import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Challenge,
  ChallengeDocument,
  DifficultyLevel,
} from "./schemas/challenge.schema";

@Injectable()
export class ChallengesService {
  constructor(
    @InjectModel(Challenge.name)
    private challengeModel: Model<ChallengeDocument>,
  ) {}

  async findAll(filters?: {
    difficulty?: DifficultyLevel;
    isActive?: boolean;
  }) {
    const query = { ...filters };
    return this.challengeModel.find(query).lean();
  }

  async findById(id: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel.findById(id);

    if (!challenge) {
      throw new NotFoundException("Challenge not found");
    }

    return challenge;
  }

  async findBySlug(slug: string): Promise<ChallengeDocument | null> {
    return this.challengeModel.findOne({ slug });
  }

  async incrementCompletionCount(id: string) {
    return this.challengeModel.findByIdAndUpdate(
      id,
      { $inc: { completionCount: 1 } },
      { new: true },
    );
  }

  async create(data: Partial<Challenge>) {
    const challenge = new this.challengeModel(data);
    return challenge.save();
  }

  async update(id: string, data: Partial<Challenge>) {
    return this.challengeModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return this.challengeModel.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
