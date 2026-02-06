import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Group, GroupSchema } from "./schemas/group.schema";
import {
  GroupMembership,
  GroupMembershipSchema,
} from "./schemas/group-membership.schema";
import { GroupMembershipService } from "./group-membership.service";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { Schedule, ScheduleSchema } from "../schedules/schemas/schedule.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: GroupMembership.name, schema: GroupMembershipSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [GroupMembershipService, GroupsService],
  controllers: [GroupsController],
  exports: [MongooseModule, GroupMembershipService, GroupsService],
})
export class GroupsModule {}
