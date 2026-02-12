import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Suggestion, SuggestionDocument } from "./schemas/suggestion.schema";

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectModel(Suggestion.name)
    private suggestionModel: Model<SuggestionDocument>,
  ) {}

  async create(
    employeeNumber: string,
    suggestion: string,
  ): Promise<SuggestionDocument> {
    const newSuggestion = new this.suggestionModel({
      employeeNumber,
      suggestion,
    });
    return newSuggestion.save();
  }

  async findAll(): Promise<SuggestionDocument[]> {
    return this.suggestionModel.find().sort({ createdAt: -1 }).exec();
  }
}
