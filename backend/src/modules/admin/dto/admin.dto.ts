import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

// ==================== SCHEDULES ====================
export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  activityId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groupIds?: string[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // HH:mm

  @IsString()
  @IsNotEmpty()
  endTime: string; // HH:mm

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubActivityScheduleDto)
  @IsOptional()
  subActivitySchedules?: SubActivityScheduleDto[];
}

export class SubActivityScheduleDto {
  @IsString()
  @IsNotEmpty()
  subActivityId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsNumber()
  order: number;
}

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  activityId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groupIds?: string[];

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubActivityScheduleDto)
  @IsOptional()
  subActivitySchedules?: SubActivityScheduleDto[];
}

// ==================== ACTIVITIES ====================
export class AdminCreateActivityDto {
  @IsString()
  @IsNotEmpty()
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
  @Type(() => AdminCreateSubActivityDto)
  @IsOptional()
  subActivities?: AdminCreateSubActivityDto[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AdminUpdateActivityDto {
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

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AdminCreateSubActivityDto {
  @IsString()
  @IsNotEmpty()
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

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

// ==================== CHALLENGES ====================
export class AdminCreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsEnum(["beginner", "intermediate", "advanced", "expert"])
  @IsOptional()
  difficulty?: string;

  @IsNumber()
  points: number;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsString()
  @IsOptional()
  successCriteria?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AdminUpdateChallengeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEnum(["beginner", "intermediate", "advanced", "expert"])
  @IsOptional()
  difficulty?: string;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsString()
  @IsOptional()
  successCriteria?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==================== STICKERS ====================
export class AdminCreateStickerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AdminUpdateStickerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

// ==================== GROUPS ====================
export class AdminCreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  capacityMax?: number;

  @IsEnum(["Morning", "Afternoon"])
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  scheduleId?: string;
}

export class AdminUpdateGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  capacityMax?: number;

  @IsEnum(["Morning", "Afternoon"])
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  scheduleId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AdminAssignUserDto {
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;
}

// ==================== AWARDS ====================
export class AdminCreateAwardDto {
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

export class AdminUpdateAwardDto {
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

// ==================== USERS (for listing) ====================
export class AdminUpdateUserDto {
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
