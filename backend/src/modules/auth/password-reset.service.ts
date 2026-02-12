import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import { AuthCredentialService } from "./auth-credential.service";

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private authCredentialService: AuthCredentialService,
  ) {}

  /**
   * Step 1: Verify identity using employeeNumber + email.
   * Returns whether the user has a security question configured.
   */
  async verifyIdentity(
    employeeNumber: string,
    email: string,
  ): Promise<{
    verified: boolean;
    hasSecurityQuestion: boolean;
    securityQuestion?: string;
  }> {
    const user = await this.userModel.findOne({
      employeeNumber,
      email: email.toLowerCase(),
      active: true,
    });

    if (!user) {
      throw new BadRequestException(
        "No se encontró una cuenta con ese número de empleado y correo electrónico.",
      );
    }

    const hasSecurityQuestion = !!(
      user.securityQuestion && user.securityAnswer
    );

    return {
      verified: true,
      hasSecurityQuestion,
      securityQuestion: hasSecurityQuestion ? user.securityQuestion : undefined,
    };
  }

  /**
   * Step 2a (first time): Reset password directly after identity verification.
   * Only allowed if user has NO security question set yet.
   */
  async resetPasswordFirstTime(
    employeeNumber: string,
    email: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      employeeNumber,
      email: email.toLowerCase(),
      active: true,
    });

    if (!user) {
      throw new BadRequestException("Datos de verificación inválidos.");
    }

    // Only allow direct reset if no security question is set
    if (user.securityQuestion && user.securityAnswer) {
      throw new BadRequestException(
        "Debes responder tu pregunta de seguridad para restablecer la contraseña.",
      );
    }

    const userId = user._id as Types.ObjectId;
    await this.authCredentialService.updatePasswordDirect(userId, newPassword);

    console.log(
      `✅ Password reset (first time) for employee ${employeeNumber}`,
    );

    return {
      message: "Contraseña actualizada exitosamente.",
    };
  }

  /**
   * Step 2b (returning user): Verify security question answer.
   */
  async verifySecurityAnswer(
    employeeNumber: string,
    answer: string,
  ): Promise<{ valid: boolean }> {
    const user = await this.userModel.findOne({
      employeeNumber,
      active: true,
    });

    if (!user || !user.securityAnswer) {
      throw new BadRequestException("Datos inválidos.");
    }

    // Case-insensitive comparison
    const isValid =
      user.securityAnswer.toLowerCase().trim() === answer.toLowerCase().trim();

    if (!isValid) {
      throw new BadRequestException("La respuesta es incorrecta.");
    }

    return { valid: true };
  }

  /**
   * Step 2b continued: Reset password after answering security question.
   */
  async resetPasswordWithAnswer(
    employeeNumber: string,
    answer: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // First verify the answer
    await this.verifySecurityAnswer(employeeNumber, answer);

    const user = await this.userModel.findOne({
      employeeNumber,
      active: true,
    });

    if (!user) {
      throw new BadRequestException("Usuario no encontrado.");
    }

    const userId = user._id as Types.ObjectId;
    await this.authCredentialService.updatePasswordDirect(userId, newPassword);

    console.log(
      `✅ Password reset (with security answer) for employee ${employeeNumber}`,
    );

    return {
      message: "Contraseña actualizada exitosamente.",
    };
  }

  /**
   * Step 3: Set security question after first password reset.
   */
  async setSecurityQuestion(
    employeeNumber: string,
    securityQuestion: string,
    securityAnswer: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      employeeNumber,
      active: true,
    });

    if (!user) {
      throw new BadRequestException("Usuario no encontrado.");
    }

    await this.userModel.updateOne(
      { _id: user._id },
      {
        securityQuestion,
        securityAnswer: securityAnswer.toLowerCase().trim(),
      },
    );

    console.log(`✅ Security question set for employee ${employeeNumber}`);

    return {
      message: "Pregunta de seguridad configurada exitosamente.",
    };
  }
}
