import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type UserAwardDocument = HydratedDocument<UserAward>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "user_awards",
})
export class UserAward {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "StickerAward", required: true })
  stickerAwardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Activity", required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "SubActivity", required: true })
  subActivityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Sticker", required: true })
  stickerId: Types.ObjectId;

  @Prop({ required: true })
  userAnswer: string;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ default: 0 })
  pointsEarned: number;

  @Prop({ type: Date, default: Date.now })
  completedAt: Date;
}

export const UserAwardSchema = SchemaFactory.createForClass(UserAward);

// Índices
UserAwardSchema.index({ userId: 1, stickerAwardId: 1 }, { unique: true });
UserAwardSchema.index({ userId: 1 });
UserAwardSchema.index({ subActivityId: 1 });
UserAwardSchema.index({ activityId: 1 });
