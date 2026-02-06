import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Challenge, ChallengeSchema } from "./schemas/challenge.schema";
import { ChallengesService } from "./challenges.service";
import { ChallengesController } from "./challenges.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
    ]),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
