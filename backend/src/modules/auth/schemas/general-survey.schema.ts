import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type GeneralSurveyDocument = HydratedDocument<GeneralSurvey>;

@Schema({
  timestamps: false,
  collection: "general_survey",
})
export class GeneralSurvey {
  @Prop({ required: true, type: String })
  employeeNumber: string;

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  question_1: number;

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  question_2: number;

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  question_3: number;

  @Prop({ required: true, type: Date, default: () => new Date() })
  timestamp: Date;
}

export const GeneralSurveySchema = SchemaFactory.createForClass(GeneralSurvey);

GeneralSurveySchema.index({ employeeNumber: 1 });
