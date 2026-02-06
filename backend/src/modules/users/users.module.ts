import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import {
  GroupMembership,
  GroupMembershipSchema,
} from "../groups/schemas/group-membership.schema";
import {
  ActivityCompletion,
  ActivityCompletionSchema,
} from "../activities/schemas/activity-completion.schema";
import {
  StickerAward,
  StickerAwardSchema,
} from "../activities/schemas/sticker-award.schema";
import { Group, GroupSchema } from "../groups/schemas/group.schema";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: GroupMembership.name, schema: GroupMembershipSchema },
      { name: ActivityCompletion.name, schema: ActivityCompletionSchema },
      { name: StickerAward.name, schema: StickerAwardSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
