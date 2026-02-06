import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";

export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsString()
  @MinLength(3)
  employeeNumber: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  lastName?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(3)
  @IsOptional()
  position?: string;

  @IsArray()
  @IsOptional()
  hobbies?: string[];
}

export class LoginDto {
  @IsString()
  @MinLength(3)
  employeeNumber: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  accessToken: string;
  expiresIn: string;
  userId?: string;
  email?: string;
}

export class UserProfileDto {
  id: string;
  email: string;
  employeeNumber: string;
  firstName: string;
  lastName?: string;
  groups: Array<{ id: string; name: string }>;
  progress: {
    activitiesCompleted: number;
    totalActivities: number;
    stickerCount: number;
  };
}

export class LogoutDto {
  message: string;
}
