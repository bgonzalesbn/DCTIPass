import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { GroupMembershipService } from "./group-membership.service";
import { AssignGroupDto } from "./dto/group.dto";
import { Public } from "../../common/decorators/public.decorator";

@Controller("groups")
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private membershipService: GroupMembershipService,
  ) {}

  @Public()
  @Get()
  async getAllGroups() {
    return this.groupsService.findAll();
  }

  @Get("my-groups")
  async getMyGroups() {
    // TODO: Get userId from session/context
    const userId = "placeholder";
    return this.membershipService.getUserGroups(userId);
  }

  @Public()
  @Get("seed")
  async seedGroups() {
    return this.groupsService.seedGroups();
  }

  @Public()
  @Get(":id")
  async getGroup(@Param("id") id: string) {
    return this.groupsService.findById(id);
  }

  @Public()
  @Get(":id/members")
  async getGroupMembers(@Param("id") id: string) {
    return this.groupsService.getGroupMembers(id);
  }

  @Public()
  @Get("name/:name")
  async getGroupByName(@Param("name") name: string) {
    return this.groupsService.findByName(decodeURIComponent(name));
  }

  @Post(":id/assign")
  async assignUserToGroup(
    @Param("id") groupId: string,
    @Body() assignDto: AssignGroupDto,
  ) {
    return this.membershipService.addMember(groupId, assignDto.userId);
  }

  @Public()
  @Post(":id/assign-employee")
  async assignEmployeeToGroup(
    @Param("id") groupId: string,
    @Body() body: { employeeNumber: string },
  ) {
    return this.groupsService.assignUserToGroup(groupId, body.employeeNumber);
  }

  @Public()
  @Post(":id/assign-schedule")
  async assignScheduleToGroup(
    @Param("id") groupId: string,
    @Body() body: { scheduleId: string },
  ) {
    return this.groupsService.assignSchedule(groupId, body.scheduleId);
  }
}
