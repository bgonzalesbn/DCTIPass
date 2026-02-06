import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
} from "class-validator";

export class CreateStickerAwardDto {
  @IsString()
  @IsNotEmpty()
  stickerId: string;

  @IsString()
  @IsNotEmpty()
  activityId: string;

  @IsString()
  @IsNotEmpty()
  subActivityId: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsNumber()
  @IsOptional()
  points?: number;
}

export class AnswerAwardDto {
  @IsString()
  @IsNotEmpty()
  stickerAwardId: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class UpdateStickerAwardDto {
  @IsString()
  @IsOptional()
  question?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
