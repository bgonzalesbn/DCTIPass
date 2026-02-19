import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type FinalSurveyResponseDocument = HydratedDocument<FinalSurveyResponse>;

class FinalSurveyAnswer {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true, min: 1, max: 5 })
  value: number;
}

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: "final_survey_responses",
})
export class FinalSurveyResponse {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Activity", required: true, index: true })
  activityId: Types.ObjectId;

  @Prop({ type: [FinalSurveyAnswer], default: [] })
  answers: FinalSurveyAnswer[];

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;
}

export const FinalSurveyResponseSchema =
  SchemaFactory.createForClass(FinalSurveyResponse);

FinalSurveyResponseSchema.index({ userId: 1, activityId: 1 }, { unique: true });
