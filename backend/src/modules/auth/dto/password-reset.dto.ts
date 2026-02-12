import { IsString, MinLength, Matches, IsEmail } from "class-validator";

export class VerifyIdentityDto {
  @IsString({ message: "Debe ingresar un número de empleado válido" })
  @MinLength(3, { message: "Número de empleado inválido" })
  employeeNumber: string;

  @IsEmail({}, { message: "Debe ingresar un correo electrónico válido" })
  email: string;
}

export class AnswerSecurityQuestionDto {
  @IsString()
  @MinLength(3)
  employeeNumber: string;

  @IsString({ message: "Debe ingresar una respuesta" })
  @MinLength(1, { message: "La respuesta no puede estar vacía" })
  answer: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(3)
  employeeNumber: string;

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

export class SetSecurityQuestionDto {
  @IsString()
  @MinLength(3)
  employeeNumber: string;

  @IsString({ message: "Debe seleccionar una pregunta de seguridad" })
  securityQuestion: string;

  @IsString({ message: "Debe ingresar una respuesta" })
  @MinLength(2, { message: "La respuesta debe tener al menos 2 caracteres" })
  securityAnswer: string;
}
