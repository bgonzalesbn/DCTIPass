import { IsString, MinLength, Matches } from "class-validator";

export class ForgotPasswordDto {
  @IsString({ message: "Debe ingresar un número de empleado válido" })
  @MinLength(3, { message: "Número de empleado inválido" })
  employeeNumber: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @Matches(/(?=.*[a-z])/, {
    message: "La contraseña debe contener al menos una letra minúscula",
  })
  @Matches(/(?=.*[A-Z])/, {
    message: "La contraseña debe contener al menos una letra mayúscula",
  })
  @Matches(/(?=.*\d)/, {
    message: "La contraseña debe contener al menos un número",
  })
  @Matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: "La contraseña debe contener al menos un carácter especial",
  })
  newPassword: string;
}

export class ValidateTokenDto {
  @IsString()
  token: string;
}
