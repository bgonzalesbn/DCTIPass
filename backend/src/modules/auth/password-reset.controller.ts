import { Controller, Post, Body, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { PasswordResetService } from "./password-reset.service";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateTokenDto,
} from "./dto/password-reset.dto";

@Controller("auth/password-reset")
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  /**
   * POST /auth/password-reset/request
   * Request a password reset link via email.
   */
  @Public()
  @Post("request")
  async requestReset(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.passwordResetService.requestPasswordReset(
        forgotPasswordDto.employeeNumber,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al procesar la solicitud.",
      });
    }
  }

  /**
   * POST /auth/password-reset/validate
   * Validate that a reset token is still valid.
   */
  @Public()
  @Post("validate")
  async validateToken(
    @Body() validateTokenDto: ValidateTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.passwordResetService.validateToken(
      validateTokenDto.token,
    );
    return res
      .status(result.valid ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json(result);
  }

  /**
   * POST /auth/password-reset/reset
   * Reset the password using a valid token.
   */
  @Public()
  @Post("reset")
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.passwordResetService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al restablecer la contraseña.",
      });
    }
  }
}
