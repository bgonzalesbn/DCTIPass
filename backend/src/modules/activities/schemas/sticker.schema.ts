import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StickerDocument = HydratedDocument<Sticker>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "stickers",
})
export class Sticker {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, default: null })
  icon?: string;

  @Prop({ type: String, default: null })
  imageUrl?: string;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const StickerSchema = SchemaFactory.createForClass(Sticker);

// Índices
StickerSchema.index({ name: 1 }, { unique: true });
StickerSchema.index({ active: 1 });
StickerSchema.index({ deletedAt: 1 });
