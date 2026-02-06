import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { Types } from "mongoose";
import { ActivitiesService } from "./activities.service";
import { ActivityCompletionService } from "./activity-completion.service";
import {
  AttemptActivityDto,
  CreateActivityDto,
  UpdateActivityDto,
  CreateSubActivityDto,
} from "./dto/activity.dto";
import { Public } from "../../common/decorators/public.decorator";

@Controller("activities")
export class ActivitiesController {
  constructor(
    private activitiesService: ActivitiesService,
    private completionService: ActivityCompletionService,
  ) {}

  @Get()
  async getAllActivities() {
    return this.activitiesService.findAll();
  }

  @Public()
  @Get("seed/it-experience")
  async seedITExperience() {
    return this.activitiesService.seedITExperience();
  }

  @Get("active")
  async getActiveActivities() {
    // TODO: Get userId from session/context
    const userId = "placeholder";
    return this.activitiesService.getActiveForUser(userId);
  }

  @Get(":id")
  async getActivity(@Param("id") id: string) {
    return this.activitiesService.findById(id);
  }

  @Get("name/:name")
  async getActivityByName(@Param("name") name: string) {
    return this.activitiesService.findByName(decodeURIComponent(name));
  }

  @Post()
  async createActivity(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Put(":id")
  async updateActivity(
    @Param("id") id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(":id")
  async deleteActivity(@Param("id") id: string) {
    return this.activitiesService.delete(id);
  }

  @Post(":id/subactivities")
  async addSubActivity(
    @Param("id") activityId: string,
    @Body() subActivity: CreateSubActivityDto,
  ) {
    return this.activitiesService.addSubActivity(activityId, subActivity);
  }

  @Delete(":activityId/subactivities/:subActivityId")
  async removeSubActivity(
    @Param("activityId") activityId: string,
    @Param("subActivityId") subActivityId: string,
  ) {
    return this.activitiesService.removeSubActivity(activityId, subActivityId);
  }

  @Post(":id/attempt")
  async attemptActivity(
    @Param("id") activityId: string,
    @Body() attemptDto: AttemptActivityDto,
  ) {
    // TODO: Get userId from session/context
    const userId = "placeholder";
    return this.completionService.completeActivityAndAwardSticker(
      new Types.ObjectId(userId),
      new Types.ObjectId(activityId),
      attemptDto.groupId ? new Types.ObjectId(attemptDto.groupId) : null,
      attemptDto.scheduleId ? new Types.ObjectId(attemptDto.scheduleId) : null,
    );
  }
}
