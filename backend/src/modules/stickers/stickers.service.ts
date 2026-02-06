import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Sticker, StickerDocument } from "./schemas/sticker.schema";

@Injectable()
export class StickersService {
  constructor(
    @InjectModel(Sticker.name) private stickerModel: Model<StickerDocument>,
  ) {}

  async getAllStickers() {
    return this.stickerModel.find({ active: true }).lean();
  }

  async getStickerById(id: string) {
    return this.stickerModel.findById(id);
  }

  async createSticker(name: string, description?: string, imageUrl?: string) {
    const sticker = new this.stickerModel({
      name,
      description: description || "", // Use empty string as default
      imageUrl: imageUrl || null,
      active: true,
    });
    return sticker.save();
  }

  async seedStickers(
    stickers: Array<{ name: string; description?: string; imageUrl?: string }>,
  ) {
    const created = [];
    for (const sticker of stickers) {
      try {
        const existing = await this.stickerModel.findOne({
          name: sticker.name,
        });
        if (!existing) {
          const newSticker = await this.createSticker(
            sticker.name,
            sticker.description,
            sticker.imageUrl,
          );
          created.push(newSticker);
        }
      } catch (error) {
        console.error(`Error creating sticker ${sticker.name}:`, error);
      }
    }
    return {
      message: `Created ${created.length} stickers`,
      count: created.length,
      stickers: created,
    };
  }
}
