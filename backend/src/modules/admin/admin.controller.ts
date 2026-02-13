// ...existing code...
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { AdminGuard } from "../../common/guards/admin.guard";
import { AdminService } from "./admin.service";
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  AdminCreateActivityDto,
  AdminUpdateActivityDto,
  AdminCreateSubActivityDto,
  AdminCreateChallengeDto,
  AdminUpdateChallengeDto,
  AdminCreateStickerDto,
  AdminUpdateStickerDto,
  AdminCreateGroupDto,
  AdminUpdateGroupDto,
  AdminAssignUserDto,
  AdminCreateAwardDto,
  AdminUpdateAwardDto,
  AdminUpdateUserDto,
  AdminBulkCreateSchedulesDto,
  UpdateGroupSessionsDto,
} from "./dto/admin.dto";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  @Get("stats")
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==================== USERS ====================

  @Get("users/available")
  async getAvailableUsers() {
    return this.adminService.getAvailableUsers();
  }

  @Get("users")
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch("users/:id")
  async updateUser(@Param("id") id: string, @Body() data: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, data);
  }

  // ==================== SCHEDULES ====================

  @Get("schedules")
  async getAllSchedules() {
    return this.adminService.getAllSchedules();
  }

  @Post("schedules")
  async createSchedule(@Body() data: CreateScheduleDto) {
    return this.adminService.createSchedule(data);
  }

  @Put("schedules/:id")
  async updateSchedule(
    @Param("id") id: string,
    @Body() data: UpdateScheduleDto,
  ) {
    return this.adminService.updateSchedule(id, data);
  }

  @Delete("schedules/:id")
  async deleteSchedule(@Param("id") id: string) {
    return this.adminService.deleteSchedule(id);
  }

  // ==================== ACTIVITY SCHEDULES ====================

  @Get("activities/:activityId/schedules")
  async getSchedulesByActivity(@Param("activityId") activityId: string) {
    return this.adminService.getSchedulesByActivity(activityId);
  }

  @Post("activities/:activityId/schedules/bulk")
  async bulkCreateSchedules(
    @Param("activityId") activityId: string,
    @Body() data: AdminBulkCreateSchedulesDto,
  ) {
    return this.adminService.bulkCreateSchedules(activityId, data);
  }

  @Put("schedules/:scheduleId/group-sessions")
  async updateGroupSessions(
    @Param("scheduleId") scheduleId: string,
    @Body() data: UpdateGroupSessionsDto,
  ) {
    return this.adminService.updateGroupSessions(scheduleId, data);
  }

  // ==================== ACTIVITIES ====================

  @Get("activities")
  async getAllActivities() {
    return this.adminService.getAllActivities();
  }

  @Post("activities")
  async createActivity(@Body() data: AdminCreateActivityDto) {
    return this.adminService.createActivity(data);
  }

  @Put("activities/:id")
  async updateActivity(
    @Param("id") id: string,
    @Body() data: AdminUpdateActivityDto,
  ) {
    return this.adminService.updateActivity(id, data);
  }

  @Delete("activities/:id")
  async deleteActivity(@Param("id") id: string) {
    return this.adminService.deleteActivity(id);
  }

  // ==================== SUB-ACTIVITIES ====================

  @Post("activities/:activityId/subactivities")
  async addSubActivity(
    @Param("activityId") activityId: string,
    @Body() data: AdminCreateSubActivityDto,
  ) {
    return this.adminService.addSubActivity(activityId, data);
  }

  @Put("activities/:activityId/subactivities/:subActivityId")
  async updateSubActivity(
    @Param("activityId") activityId: string,
    @Param("subActivityId") subActivityId: string,
    @Body() data: AdminCreateSubActivityDto,
  ) {
    return this.adminService.updateSubActivity(activityId, subActivityId, data);
  }

  @Delete("activities/:activityId/subactivities/:subActivityId")
  async deleteSubActivity(
    @Param("activityId") activityId: string,
    @Param("subActivityId") subActivityId: string,
  ) {
    return this.adminService.deleteSubActivity(activityId, subActivityId);
  }

  // ==================== CHALLENGES ====================

  @Get("challenges")
  async getAllChallenges() {
    return this.adminService.getAllChallenges();
  }

  @Post("challenges")
  async createChallenge(@Body() data: AdminCreateChallengeDto) {
    return this.adminService.createChallenge(data);
  }

  @Put("challenges/:id")
  async updateChallenge(
    @Param("id") id: string,
    @Body() data: AdminUpdateChallengeDto,
  ) {
    return this.adminService.updateChallenge(id, data);
  }

  @Delete("challenges/:id")
  async deleteChallenge(@Param("id") id: string) {
    return this.adminService.deleteChallenge(id);
  }

  // ==================== STICKERS ====================

  @Get("stickers")
  async getAllStickers() {
    return this.adminService.getAllStickers();
  }

  @Post("stickers")
  async createSticker(@Body() data: AdminCreateStickerDto) {
    return this.adminService.createSticker(data);
  }

  @Put("stickers/:id")
  async updateSticker(
    @Param("id") id: string,
    @Body() data: AdminUpdateStickerDto,
  ) {
    return this.adminService.updateSticker(id, data);
  }

  @Delete("stickers/:id")
  async deleteSticker(@Param("id") id: string) {
    return this.adminService.deleteSticker(id);
  }

  // ==================== GROUPS ====================

  @Get("groups")
  async getAllGroups() {
    return this.adminService.getAllGroups();
  }

  @Post("groups")
  async createGroup(@Body() data: AdminCreateGroupDto) {
    return this.adminService.createGroup(data);
  }

  @Put("groups/:id")
  async updateGroup(
    @Param("id") id: string,
    @Body() data: AdminUpdateGroupDto,
  ) {
    return this.adminService.updateGroup(id, data);
  }

  @Delete("groups/:id")
  async deleteGroup(@Param("id") id: string) {
    return this.adminService.deleteGroup(id);
  }

  @Get("groups/:id/members")
  async getGroupMembers(@Param("id") id: string) {
    return this.adminService.getGroupMembers(id);
  }

  @Post("groups/:id/assign")
  async assignUserToGroup(
    @Param("id") groupId: string,
    @Body() data: AdminAssignUserDto,
  ) {
    return this.adminService.assignUserToGroup(groupId, data.employeeNumber);
  }

  @Delete("groups/:groupId/members/:userId")
  async removeUserFromGroup(
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
  ) {
    return this.adminService.removeUserFromGroup(groupId, userId);
  }

  // ==================== QUIZZES ====================
  @Get("quizzes")
  async getAllQuizzes() {
    return this.adminService.getAllQuizzes();
  }

  @Post("quizzes")
  async createQuiz(@Body() data: AdminCreateAwardDto) {
    return this.adminService.createQuiz(data);
  }

  // ==================== AWARDS ====================
  @Get("awards")
  async getAllAwards() {
    return this.adminService.getAllAwards();
  }

  @Post("awards")
  async createAward(@Body() data: AdminCreateAwardDto) {
    this.logger.log("Creating award with data:", JSON.stringify(data));
    return this.adminService.createAward(data);
  }

  @Put("awards/:id")
  async updateAward(
    @Param("id") id: string,
    @Body() data: AdminUpdateAwardDto,
  ) {
    return this.adminService.updateAward(id, data);
  }

  @Delete("awards/:id")
  async deleteAward(@Param("id") id: string) {
    return this.adminService.deleteAward(id);
  }
}
