import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Activity, ActivitySchema } from "./schemas/activity.schema";
import {
  ActivityCompletion,
  ActivityCompletionSchema,
} from "./schemas/activity-completion.schema";
import {
  StickerAward,
  StickerAwardSchema,
} from "./schemas/sticker-award.schema";
import { Sticker, StickerSchema } from "./schemas/sticker.schema";
import {
  GroupMembership,
  GroupMembershipSchema,
} from "../groups/schemas/group-membership.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { ActivityCompletionService } from "./activity-completion.service";
import { ActivitiesService } from "./activities.service";
import { StickersService } from "./stickers.service";
import { ActivitiesController } from "./activities.controller";
import { StickersController } from "./stickers.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: ActivityCompletion.name, schema: ActivityCompletionSchema },
      { name: StickerAward.name, schema: StickerAwardSchema },
      { name: Sticker.name, schema: StickerSchema },
      { name: GroupMembership.name, schema: GroupMembershipSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ActivityCompletionService, ActivitiesService, StickersService],
  controllers: [ActivitiesController, StickersController],
  exports: [
    MongooseModule,
    ActivityCompletionService,
    ActivitiesService,
    StickersService,
  ],
})
export class ActivitiesModule {}
