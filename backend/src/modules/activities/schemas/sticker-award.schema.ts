import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type StickerAwardDocument = HydratedDocument<StickerAward>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "sticker_awards",
})
export class StickerAward {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Sticker" })
  stickerId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "ActivityCompletion" })
  activityCompletionId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  awardedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const StickerAwardSchema = SchemaFactory.createForClass(StickerAward);

// Índices
StickerAwardSchema.index({ userId: 1, stickerId: 1 }, { unique: true });
StickerAwardSchema.index({ userId: 1, awardedAt: -1 });
StickerAwardSchema.index({ stickerId: 1 });
StickerAwardSchema.index({ awardedAt: -1 });
