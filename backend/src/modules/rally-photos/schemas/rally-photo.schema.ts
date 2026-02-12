import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RallyPhotoDocument = HydratedDocument<RallyPhoto>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: "rally_photos",
})
export class RallyPhoto {
  @Prop({ type: String, required: true })
  employeeNumber: string;

  @Prop({ type: String, required: true })
  imageData: string; // Base64 encoded image

  @Prop({ type: String, default: "" })
  caption: string;
}

export const RallyPhotoSchema = SchemaFactory.createForClass(RallyPhoto);

// Índices
RallyPhotoSchema.index({ employeeNumber: 1 });
RallyPhotoSchema.index({ createdAt: -1 });
