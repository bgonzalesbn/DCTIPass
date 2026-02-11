import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
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
  direction: string;

  @IsArray()
  @IsOptional()
  hobbies?: string[];

  @IsInt()
  @Min(1)
  @Max(5)
  survey_question_1: number;

  @IsInt()
  @Min(1)
  @Max(5)
  survey_question_2: number;

  @IsInt()
  @Min(1)
  @Max(5)
  survey_question_3: number;
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
  isAdmin?: boolean;
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
