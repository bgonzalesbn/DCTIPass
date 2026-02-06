import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

export class AttemptActivityDto {
  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsOptional()
  scheduleId?: string;
}

export class CreateSubActivityDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  stickerId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateActivityDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  stickerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubActivityDto)
  @IsOptional()
  subActivities?: CreateSubActivityDto[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  stickerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubActivityDto)
  @IsOptional()
  subActivities?: CreateSubActivityDto[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
