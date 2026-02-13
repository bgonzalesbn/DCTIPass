import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type LegacyStickerAwardDocument = HydratedDocument<LegacyStickerAward>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "sticker_awards",
})
export class LegacyStickerAward {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Sticker" })
  stickerId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: "ActivityCompletion",
  })
  activityCompletionId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  awardedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const LegacyStickerAwardSchema =
  SchemaFactory.createForClass(LegacyStickerAward);

LegacyStickerAwardSchema.index(
  { userId: 1, stickerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $exists: true, $type: "objectId" },
      stickerId: { $exists: true, $type: "objectId" },
    },
  },
);
LegacyStickerAwardSchema.index({ userId: 1, awardedAt: -1 });
LegacyStickerAwardSchema.index({ stickerId: 1 });
LegacyStickerAwardSchema.index({ awardedAt: -1 });
