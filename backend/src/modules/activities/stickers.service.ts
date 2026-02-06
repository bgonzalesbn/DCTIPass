import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Sticker, StickerDocument } from "../stickers/schemas/sticker.schema";
import {
  StickerAward,
  StickerAwardDocument,
} from "./schemas/sticker-award.schema";
import { User, UserDocument } from "../users/schemas/user.schema";

@Injectable()
export class StickersService {
  constructor(
    @InjectModel(Sticker.name) private stickerModel: Model<StickerDocument>,
    @InjectModel(StickerAward.name)
    private awardModel: Model<StickerAwardDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get all stickers (badges/insignias)
   */
  async findAll() {
    return this.stickerModel.find({ active: true }).lean();
  }

  /**
   * Get user's badges with earned and locked status
   */
  async getUserBadges(userId: string) {
    const uId = new Types.ObjectId(userId);

    // Get all badges
    const allBadges = await this.stickerModel.find({ active: true }).lean();

    // Get earned badges from old StickerAward model (legacy)
    const legacyEarned = await this.awardModel
      .find({ userId: uId })
      .select("stickerId awardedAt")
      .lean();

    const legacyEarnedIds = new Set(
      legacyEarned.map((a: any) => a.stickerId?.toString() || a.stickerId),
    );

    // Get earned stickers from User model (new system)
    const user = await this.userModel.findById(uId).lean();
    const userEarnedStickers = new Set(
      (user?.earnedStickers || []).map((s: any) => s.toString()),
    );

    // Combine both sources
    const allEarnedIds = new Set([...legacyEarnedIds, ...userEarnedStickers]);

    return {
      earned: allEarnedIds.size,
      total: allBadges.length,
      badges: allBadges.map((badge: any) => ({
        id: badge._id.toString(),
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        imageUrl: badge.imageUrl,
        isEarned: allEarnedIds.has(badge._id.toString()),
        earnedAt: legacyEarned.find(
          (a: any) => a.stickerId?.toString() === badge._id.toString(),
        )?.awardedAt,
      })),
    };
  }
}
