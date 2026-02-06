import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
} from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { Public } from "../../common/decorators/public.decorator";

@Controller("schedule")
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  /**
   * Get all schedules
   */
  @Public()
  @Get()
  async getSchedule(
    @Query("groupId") groupId?: string,
    @Query("activityId") activityId?: string,
    @Query("date") date?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    // Get schedules by activity
    if (activityId) {
      return this.scheduleService.getSchedulesByActivity(activityId);
    }

    // Support both single date and date range queries for groups
    if (groupId && startDate && endDate) {
      return this.scheduleService.getScheduleByDateRange(
        groupId,
        startDate,
        endDate,
      );
    }

    if (groupId && date) {
      return this.scheduleService.getScheduleByDate(groupId, date);
    }

    // Return all schedules
    return this.scheduleService.getAllSchedules();
  }

  /**
   * Get schedule by ID
   */
  @Public()
  @Get(":id")
  async getScheduleById(@Param("id") id: string) {
    return this.scheduleService.getScheduleById(id);
  }

  /**
   * Seed IT Experience schedules
   */
  @Public()
  @Get("seed/it-experience")
  async seedITExperienceSchedules() {
    return this.scheduleService.seedITExperienceSchedules();
  }

  /**
   * Create a new schedule
   */
  @Post()
  async createSchedule(@Body() scheduleData: any) {
    return this.scheduleService.createSchedule(scheduleData);
  }

  /**
   * Update a schedule
   */
  @Patch(":id")
  async updateSchedule(@Param("id") id: string, @Body() updateData: any) {
    return this.scheduleService.updateSchedule(id, updateData);
  }

  /**
   * Delete a schedule
   */
  @Delete(":id")
  async deleteSchedule(@Param("id") id: string) {
    return this.scheduleService.deleteSchedule(id);
  }
}
