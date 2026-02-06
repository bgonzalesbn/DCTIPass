import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ChallengeDocument = HydratedDocument<Challenge>;

export enum DifficultyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  EXPERT = "expert",
}

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "challenges",
})
export class Challenge {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ enum: DifficultyLevel, default: DifficultyLevel.BEGINNER })
  difficulty: DifficultyLevel;

  @Prop({ required: true })
  points: number;

  @Prop({ required: true })
  instructions: string;

  @Prop({ type: String, required: false })
  successCriteria?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, required: false })
  imageUrl?: string;

  @Prop({ default: 0 })
  completionCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  releasedAt?: Date;

  @Prop({ type: Date })
  retiredAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);

// Índices
ChallengeSchema.index({ slug: 1 }, { unique: true });
ChallengeSchema.index({ difficulty: 1, isActive: 1 });
ChallengeSchema.index({ isActive: 1 });
