import { Controller, Get, Put, Post, Body, Param, Req } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Request } from "express";
import { IsOptional, IsString, IsArray, IsEmail } from "class-validator";

class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: string[];

  @IsOptional()
  @IsString()
  position?: string;
}

class CompleteSubActivityDto {
  @IsString()
  activityId: string;

  @IsString()
  subActivityId: string;

  @IsOptional()
  @IsString()
  stickerId?: string;

  @IsOptional()
  points?: number;
}

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  async getMyProfile(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { error: "No authenticated user" };
    }
    return this.usersService.getProfile(userId);
  }

  @Put("profile")
  async updateProfile(
    @Req() req: Request,
    @Body() updateData: UpdateProfileDto,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { error: "No authenticated user" };
    }
    return this.usersService.updateProfile(userId, updateData);
  }

  @Get("progress")
  async getMyProgress(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { error: "No authenticated user" };
    }
    return this.usersService.getUserProgress(userId);
  }

  @Get("completed-subactivities")
  async getCompletedSubActivities(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { error: "No authenticated user" };
    }
    return this.usersService.getCompletedSubActivities(userId);
  }

  @Get("earned-stickers")
  async getEarnedStickers(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { error: "No authenticated user" };
    }
    return this.usersService.getEarnedStickers(userId);
  }

  @Post("complete-subactivity")
  async completeSubActivity(
    @Req() req: Request,
    @Body() dto: CompleteSubActivityDto,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return { error: "No authenticated user" };
    }
    return this.usersService.completeSubActivity(
      userId,
      dto.activityId,
      dto.subActivityId,
      dto.stickerId,
      dto.points,
    );
  }

  @Get(":id/profile")
  async getProfile(@Param("id") id: string) {
    return this.usersService.getProfile(id);
  }

  @Get(":id")
  async getUser(@Param("id") id: string) {
    return this.usersService.findById(id);
  }
}
