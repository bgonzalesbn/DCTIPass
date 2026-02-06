import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ActivityCompletion,
  ActivityCompletionDocument,
} from "./schemas/activity-completion.schema";
import {
  StickerAward,
  StickerAwardDocument,
} from "./schemas/sticker-award.schema";
import { Activity } from "./schemas/activity.schema";
import { Sticker } from "../stickers/schemas/sticker.schema";

@Injectable()
export class ActivityCompletionService {
  constructor(
    @InjectModel(ActivityCompletion.name)
    private completionModel: Model<ActivityCompletionDocument>,
    @InjectModel(StickerAward.name)
    private awardModel: Model<StickerAwardDocument>,
    @InjectModel(Activity.name) private activityModel: Model<any>,
    @InjectModel(Sticker.name) private stickerModel: Model<any>,
  ) {}

  /**
   * Complete activity and award sticker (TRANSACTIONAL)
   * Uses MongoDB transaction to ensure atomic operation
   */
  async completeActivityAndAwardSticker(
    userId: Types.ObjectId,
    activityId: Types.ObjectId,
    groupId: Types.ObjectId,
    scheduleId: Types.ObjectId | null,
  ) {
    // Start MongoDB transaction session
    const session = await this.completionModel.startSession();
    session.startTransaction();

    try {
      // 1. Check activity exists
      const activity = await this.activityModel
        .findById(activityId)
        .session(session);
      if (!activity) {
        throw new NotFoundException("Activity not found");
      }

      // 2. Check if user already completed this activity
      const existingCompletion = await this.completionModel
        .findOne({ userId, activityId, deletedAt: null })
        .session(session);

      if (existingCompletion) {
        throw new BadRequestException(
          "User has already completed this activity",
        );
      }

      // 3. Get sticker associated with activity
      const sticker = await this.stickerModel
        .findById(activity.stickerId)
        .session(session);
      if (!sticker) {
        throw new NotFoundException("Sticker not found");
      }

      // 4. Create activity completion
      const completion = new this.completionModel({
        userId,
        activityId,
        groupId,
        scheduleId: scheduleId || null,
        completedAt: new Date(),
      });

      const savedCompletion = await completion.save({ session });

      // 5. Award sticker (check for duplicate)
      const existingAward = await this.awardModel
        .findOne({ userId, stickerId: sticker._id, deletedAt: null })
        .session(session);

      let award = null;
      if (!existingAward) {
        award = new this.awardModel({
          userId,
          stickerId: sticker._id,
          activityCompletionId: savedCompletion._id,
          awardedAt: new Date(),
        });

        award = await award.save({ session });
      }

      // 6. Commit transaction
      await session.commitTransaction();

      return {
        completion: savedCompletion,
        award: award,
        sticker: sticker,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get user completions
   */
  async getUserCompletions(userId: Types.ObjectId) {
    return this.completionModel
      .find({ userId, deletedAt: null })
      .populate("activityId")
      .populate("groupId")
      .populate("scheduleId")
      .sort({ completedAt: -1 })
      .exec();
  }

  /**
   * Get activity completions
   */
  async getActivityCompletions(activityId: Types.ObjectId) {
    return this.completionModel
      .find({ activityId, deletedAt: null })
      .populate("userId", "firstName lastName email employeeNumber")
      .sort({ completedAt: -1 })
      .exec();
  }

  /**
   * Check if user completed activity
   */
  async hasCompleted(
    userId: Types.ObjectId,
    activityId: Types.ObjectId,
  ): Promise<boolean> {
    const completion = await this.completionModel.findOne({
      userId,
      activityId,
      deletedAt: null,
    });

    return !!completion;
  }

  /**
   * Get user's earned stickers (unique)
   */
  async getUserStickers(userId: Types.ObjectId) {
    return this.awardModel
      .find({ userId, deletedAt: null })
      .populate("stickerId")
      .sort({ awardedAt: -1 })
      .exec();
  }

  /**
   * Count user stickers
   */
  async countUserStickers(userId: Types.ObjectId): Promise<number> {
    return this.awardModel.countDocuments({
      userId,
      deletedAt: null,
    });
  }
}
