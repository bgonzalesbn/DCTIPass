import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type StickerAwardDocument = HydratedDocument<StickerAward>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "sticker_awards",
})
export class StickerAward {
  @Prop({ type: Types.ObjectId, ref: "Sticker", required: true })
  stickerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Activity", required: true })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "SubActivity", required: true })
  subActivityId: Types.ObjectId;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ default: "" })
  explanation: string;

  @Prop({ default: 10 })
  points: number;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const StickerAwardSchema = SchemaFactory.createForClass(StickerAward);

// Índices
StickerAwardSchema.index({ subActivityId: 1 });
StickerAwardSchema.index({ activityId: 1 });
StickerAwardSchema.index({ stickerId: 1 });
StickerAwardSchema.index({ active: 1 });
