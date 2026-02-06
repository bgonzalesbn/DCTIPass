import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type GroupDocument = HydratedDocument<Group>;

export enum ShiftType {
  MORNING = "Morning",
  AFTERNOON = "Afternoon",
}

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "groups",
})
export class Group {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, default: 20, min: 1 })
  capacityMax: number;

  @Prop({ required: true, enum: ShiftType })
  shift: ShiftType;

  @Prop({ type: Types.ObjectId, ref: "Schedule", default: null })
  scheduleId?: Types.ObjectId; // Horario asignado al grupo

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

// Índices
GroupSchema.index({ name: 1 }, { unique: true });
GroupSchema.index({ active: 1 });
GroupSchema.index({ shift: 1 });
GroupSchema.index({ scheduleId: 1 });
