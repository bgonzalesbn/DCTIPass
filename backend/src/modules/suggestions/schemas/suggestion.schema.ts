import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SuggestionDocument = HydratedDocument<Suggestion>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: "suggestions",
})
export class Suggestion {
  @Prop({ type: String, required: true })
  employeeNumber: string;

  @Prop({ type: String, required: true })
  suggestion: string;
}

export const SuggestionSchema = SchemaFactory.createForClass(Suggestion);
