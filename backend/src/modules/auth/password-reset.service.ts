import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { User, UserDocument } from "../users/schemas/user.schema";
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from "./schemas/password-reset-token.schema";
import { AuthCredentialService } from "./auth-credential.service";
import { EmailService } from "./email.service";

@Injectable()
export class PasswordResetService {
  private readonly TOKEN_EXPIRY_HOURS = 1; // Token expires in 1 hour

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PasswordResetToken.name)
    private resetTokenModel: Model<PasswordResetTokenDocument>,
    private authCredentialService: AuthCredentialService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Request a password reset. Generates a secure token, stores it,
   * and sends an email with the reset link.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by their registered email
    const user = await this.userModel.findOne({
      email: normalizedEmail,
      active: true,
    });

    // Always return success message to avoid email enumeration attacks
    if (!user) {
      return {
        message:
          "Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña.",
      };
    }

    // Invalidate any existing tokens for this user
    await this.resetTokenModel.updateMany(
      { userId: user._id, used: false },
      { used: true },
    );

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Store the token
    await this.resetTokenModel.create({
      userId: user._id,
      token,
      expiresAt,
      used: false,
    });

    // Build the reset link
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") ||
      "https://dctpass.vercel.app";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Send the email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetLink,
        user.firstName,
      );
      console.log(
        `✅ Password reset email sent to ${normalizedEmail} for user ${user.employeeNumber}`,
      );
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error.message);
      throw new BadRequestException(
        "Error al enviar el correo. Intenta de nuevo más tarde.",
      );
    }

    return {
      message:
        "Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña.",
    };
  }

  /**
   * Validate that a reset token is still valid (not expired, not used).
   */
  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; message: string }> {
    const resetToken = await this.resetTokenModel.findOne({ token });

    if (!resetToken) {
      return { valid: false, message: "Token no válido o expirado." };
    }

    if (resetToken.used) {
      return {
        valid: false,
        message: "Este enlace ya fue utilizado. Solicita uno nuevo.",
      };
    }

    if (resetToken.expiresAt < new Date()) {
      return {
        valid: false,
        message: "Este enlace ha expirado. Solicita uno nuevo.",
      };
    }

    return { valid: true, message: "Token válido." };
  }

  /**
   * Reset the password using a valid token.
   * Invalidates the token after use.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find and validate the token
    const resetToken = await this.resetTokenModel.findOne({ token });

    if (!resetToken) {
      throw new BadRequestException("Token no válido o expirado.");
    }

    if (resetToken.used) {
      throw new BadRequestException(
        "Este enlace ya fue utilizado. Solicita uno nuevo.",
      );
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException(
        "Este enlace ha expirado. Solicita uno nuevo.",
      );
    }

    // Update the password
    const userId = new Types.ObjectId(resetToken.userId);

    try {
      await this.authCredentialService.updatePasswordDirect(
        userId,
        newPassword,
      );
    } catch (error) {
      console.error("❌ Failed to update password:", error.message);
      throw new BadRequestException("Error al actualizar la contraseña.");
    }

    // Mark the token as used
    await this.resetTokenModel.updateOne(
      { _id: resetToken._id },
      { used: true },
    );

    // Also invalidate all other tokens for this user
    await this.resetTokenModel.updateMany(
      { userId: resetToken.userId, _id: { $ne: resetToken._id }, used: false },
      { used: true },
    );

    console.log(
      `✅ Password reset successfully for userId: ${resetToken.userId}`,
    );

    return {
      message:
        "Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.",
    };
  }
}
