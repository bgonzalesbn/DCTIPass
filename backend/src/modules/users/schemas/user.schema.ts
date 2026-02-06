import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type UserDocument = HydratedDocument<User>;

// Sub-schema para progreso de subactividad
class SubActivityProgress {
  @Prop({ type: Types.ObjectId, ref: "SubActivity" })
  subActivityId: Types.ObjectId;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: "Sticker", default: null })
  earnedStickerId?: Types.ObjectId;
}

// Sub-schema para progreso de actividad
class ActivityProgress {
  @Prop({ type: Types.ObjectId, ref: "Activity" })
  activityId: Types.ObjectId;

  @Prop({ default: 0 })
  completedSubActivities: number;

  @Prop({ default: 0 })
  totalSubActivities: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt?: Date;
}

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "users",
})
export class User {
  @Prop({ type: String, required: true, unique: true })
  employeeNumber: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: String, default: null })
  position?: string;

  @Prop({ type: [String], default: [] })
  hobbies: string[];

  @Prop({ type: String, ref: "Group", default: null })
  groupId?: string;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: String, default: null })
  authProviderId?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  // Campos de progreso del usuario
  @Prop({ type: [{ type: Types.ObjectId, ref: "Sticker" }], default: [] })
  earnedStickers: Types.ObjectId[];

  @Prop({ type: [Object], default: [] })
  subActivityProgress: SubActivityProgress[];

  @Prop({ type: [Object], default: [] })
  activityProgress: ActivityProgress[];

  @Prop({ type: Number, default: 0 })
  totalPoints: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices únicos
UserSchema.index({ employeeNumber: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ active: 1 });
UserSchema.index({ deletedAt: 1 });
