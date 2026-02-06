import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  StickerAward,
  StickerAwardSchema,
} from "./schemas/sticker-award.schema";
import { UserAward, UserAwardSchema } from "./schemas/user-award.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { AwardsService } from "./awards.service";
import { AwardsController } from "./awards.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StickerAward.name, schema: StickerAwardSchema },
      { name: UserAward.name, schema: UserAwardSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [AwardsService],
  controllers: [AwardsController],
  exports: [AwardsService, MongooseModule],
})
export class AwardsModule {}
