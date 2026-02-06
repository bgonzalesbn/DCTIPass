import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ActivityCompletionDocument = HydratedDocument<ActivityCompletion>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "activity_completions",
})
export class ActivityCompletion {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Activity" })
  activityId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Group" })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Schedule", default: null })
  scheduleId?: Types.ObjectId;

  @Prop({ required: true, type: Date })
  completedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const ActivityCompletionSchema =
  SchemaFactory.createForClass(ActivityCompletion);

// Índices
ActivityCompletionSchema.index({ userId: 1, activityId: 1 }, { unique: true });
ActivityCompletionSchema.index({ userId: 1 });
ActivityCompletionSchema.index({ activityId: 1 });
ActivityCompletionSchema.index({ groupId: 1 });
ActivityCompletionSchema.index({ completedAt: -1 });
