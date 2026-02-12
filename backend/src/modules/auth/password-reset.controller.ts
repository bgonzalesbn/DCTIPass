import { Controller, Post, Body, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { PasswordResetService } from "./password-reset.service";
import {
  VerifyIdentityDto,
  AnswerSecurityQuestionDto,
  SetSecurityQuestionDto,
} from "./dto/password-reset.dto";

@Controller("auth/password-reset")
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  /**
   * POST /auth/password-reset/verify-identity
   * Verify employeeNumber + email. Returns if user has a security question.
   */
  @Public()
  @Post("verify-identity")
  async verifyIdentity(@Body() dto: VerifyIdentityDto, @Res() res: Response) {
    try {
      const result = await this.passwordResetService.verifyIdentity(
        dto.employeeNumber,
        dto.email,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al verificar la identidad.",
      });
    }
  }

  /**
   * POST /auth/password-reset/reset-first-time
   * Reset password for users without security question (first time).
   */
  @Public()
  @Post("reset-first-time")
  async resetFirstTime(
    @Body()
    body: { employeeNumber: string; email: string; newPassword: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.passwordResetService.resetPasswordFirstTime(
        body.employeeNumber,
        body.email,
        body.newPassword,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al restablecer la contraseña.",
      });
    }
  }

  /**
   * POST /auth/password-reset/verify-answer
   * Verify the security question answer.
   */
  @Public()
  @Post("verify-answer")
  async verifyAnswer(
    @Body() dto: AnswerSecurityQuestionDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.passwordResetService.verifySecurityAnswer(
        dto.employeeNumber,
        dto.answer,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al verificar la respuesta.",
      });
    }
  }

  /**
   * POST /auth/password-reset/reset-with-answer
   * Reset password after answering security question.
   */
  @Public()
  @Post("reset-with-answer")
  async resetWithAnswer(
    @Body()
    body: { employeeNumber: string; answer: string; newPassword: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.passwordResetService.resetPasswordWithAnswer(
        body.employeeNumber,
        body.answer,
        body.newPassword,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al restablecer la contraseña.",
      });
    }
  }

  /**
   * POST /auth/password-reset/set-security-question
   * Set security question after first password reset.
   */
  @Public()
  @Post("set-security-question")
  async setSecurityQuestion(
    @Body() dto: SetSecurityQuestionDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.passwordResetService.setSecurityQuestion(
        dto.employeeNumber,
        dto.securityQuestion,
        dto.securityAnswer,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message:
          error.message || "Error al configurar la pregunta de seguridad.",
      });
    }
  }
}
