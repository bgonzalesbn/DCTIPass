import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "quizzes",
})
export class Quiz {
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

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ subActivityId: 1 });
QuizSchema.index({ activityId: 1 });
QuizSchema.index({ stickerId: 1 });
QuizSchema.index({ active: 1 });
