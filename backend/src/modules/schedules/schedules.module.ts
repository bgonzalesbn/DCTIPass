import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Schedule, ScheduleSchema } from "./schemas/schedule.schema";
import { ScheduleController } from "./schedule.controller";
import { ScheduleService } from "./schedule.service";
import {
  GroupMembership,
  GroupMembershipSchema,
} from "../groups/schemas/group-membership.schema";
import {
  Activity,
  ActivitySchema,
} from "../activities/schemas/activity.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
      { name: GroupMembership.name, schema: GroupMembershipSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [MongooseModule, ScheduleService],
})
export class SchedulesModule {}
