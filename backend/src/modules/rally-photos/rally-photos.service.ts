import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RallyPhoto, RallyPhotoDocument } from "./schemas/rally-photo.schema";

@Injectable()
export class RallyPhotosService {
  constructor(
    @InjectModel(RallyPhoto.name)
    private rallyPhotoModel: Model<RallyPhotoDocument>,
  ) {}

  async create(
    employeeNumber: string,
    imageData: string,
    caption?: string,
  ): Promise<RallyPhotoDocument> {
    const photo = new this.rallyPhotoModel({
      employeeNumber,
      imageData,
      caption: caption || "",
    });
    return photo.save();
  }

  async findByEmployee(employeeNumber: string): Promise<RallyPhotoDocument[]> {
    return this.rallyPhotoModel
      .find({ employeeNumber })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<RallyPhotoDocument[]> {
    return this.rallyPhotoModel.find().sort({ createdAt: -1 }).exec();
  }

  async delete(id: string, employeeNumber: string): Promise<boolean> {
    const result = await this.rallyPhotoModel.deleteOne({
      _id: id,
      employeeNumber,
    });
    return result.deletedCount > 0;
  }
}
