import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminGuard } from "../../common/guards/admin.guard";
import { User, UserSchema } from "../users/schemas/user.schema";
import {
  Activity,
  ActivitySchema,
} from "../activities/schemas/activity.schema";
import { Schedule, ScheduleSchema } from "../schedules/schemas/schedule.schema";
import {
  Challenge,
  ChallengeSchema,
} from "../challenges/schemas/challenge.schema";
import { Group, GroupSchema } from "../groups/schemas/group.schema";
import {
  GroupMembership,
  GroupMembershipSchema,
} from "../groups/schemas/group-membership.schema";
import { Sticker, StickerSchema } from "../stickers/schemas/sticker.schema";
import {
  StickerAward,
  StickerAwardSchema,
} from "../awards/schemas/sticker-award.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMembership.name, schema: GroupMembershipSchema },
      { name: Sticker.name, schema: StickerSchema },
      { name: StickerAward.name, schema: StickerAwardSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
