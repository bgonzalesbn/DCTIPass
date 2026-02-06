import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import {
  GroupMembership,
  GroupMembershipDocument,
} from "../groups/schemas/group-membership.schema";
import {
  ActivityCompletion,
  ActivityCompletionDocument,
} from "../activities/schemas/activity-completion.schema";
import {
  StickerAward,
  StickerAwardDocument,
} from "../activities/schemas/sticker-award.schema";
import { Group, GroupDocument } from "../groups/schemas/group.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(GroupMembership.name)
    private groupMembershipModel: Model<GroupMembershipDocument>,
    @InjectModel(ActivityCompletion.name)
    private activityCompletionModel: Model<ActivityCompletionDocument>,
    @InjectModel(StickerAward.name)
    private stickerAwardModel: Model<StickerAwardDocument>,
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
  ) {}

  /**
   * Get user profile with groups and progress
   */
  async getProfile(userId: string) {
    const objectId = new Types.ObjectId(userId);

    const user = await this.userModel.findById(objectId);
    if (!user || !user.active) {
      throw new NotFoundException("User not found");
    }

    // Get user's group membership (solo puede tener 1 grupo)
    const membership = await this.groupMembershipModel
      .findOne({ userId: objectId, deletedAt: null })
      .lean();

    let group = null;
    let schedule = null;

    if (membership) {
      // Obtener el grupo con su schedule
      const groupData = await this.groupModel
        .findById(membership.groupId)
        .populate({
          path: "scheduleId",
          populate: {
            path: "activityId",
            select: "_id name description color stickerId subActivities",
            populate: {
              path: "stickerId subActivities.stickerId",
            },
          },
        })
        .lean();

      if (groupData) {
        group = {
          _id: groupData._id,
          name: groupData.name,
          description: groupData.description,
          shift: groupData.shift,
          capacityMax: groupData.capacityMax,
        };

        if (groupData.scheduleId) {
          schedule = groupData.scheduleId;
        }
      }
    }

    // Get progress statistics
    const completionCount = await this.activityCompletionModel.countDocuments({
      userId: objectId,
    });

    const stickerCount = await this.stickerAwardModel.countDocuments({
      userId: objectId,
    });

    // TODO: Get total activities count
    const totalActivities = 0; // Placeholder

    return {
      id: user._id.toString(),
      email: user.email,
      employeeNumber: user.employeeNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      hobbies: user.hobbies || [],
      group, // Grupo único del usuario
      schedule, // Schedule del grupo con actividad y subactividades
      progress: {
        activitiesCompleted: completionCount,
        totalActivities,
        stickerCount,
      },
    };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select("-password");

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select("-password");
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).select("-password");
  }

  async updatePoints(userId: string, points: number) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { totalPoints: points } },
      { new: true },
    );
  }

  async incrementCompletedChallenges(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { completedChallenges: 1 } },
      { new: true },
    );
  }

  async addBadge(userId: string, badgeId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { badges: badgeId } },
      { new: true },
    );
  }

  async updateProfile(
    userId: string,
    updateData: { email?: string; hobbies?: string[]; position?: string },
  ) {
    const objectId = new Types.ObjectId(userId);

    const user = await this.userModel.findById(objectId);
    if (!user || !user.active) {
      throw new NotFoundException("User not found");
    }

    // Build update object with only provided fields
    const updateFields: any = {};
    if (updateData.email !== undefined) {
      updateFields.email = updateData.email;
    }
    if (updateData.hobbies !== undefined) {
      updateFields.hobbies = updateData.hobbies;
    }
    if (updateData.position !== undefined) {
      updateFields.position = updateData.position;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(objectId, { $set: updateFields }, { new: true })
      .select("-password");

    return {
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        employeeNumber: updatedUser.employeeNumber,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        position: updatedUser.position,
        hobbies: updatedUser.hobbies || [],
      },
    };
  }

  /**
   * Obtener progreso completo del usuario
   */
  async getUserProgress(userId: string) {
    const objectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(objectId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      earnedStickers: user.earnedStickers || [],
      subActivityProgress: user.subActivityProgress || [],
      activityProgress: user.activityProgress || [],
      totalPoints: user.totalPoints || 0,
    };
  }

  /**
   * Marcar subactividad como completada
   */
  async completeSubActivity(
    userId: string,
    activityId: string,
    subActivityId: string,
    stickerId?: string,
    points?: number,
  ) {
    const objectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(objectId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verificar si ya está completada
    const existingProgress = (user.subActivityProgress || []).find(
      (p: any) => p.subActivityId?.toString() === subActivityId,
    );

    if (existingProgress?.completed) {
      return { success: true, message: "SubActivity already completed" };
    }

    // Actualizar progreso de subactividad
    const subActivityProgressItem = {
      subActivityId: new Types.ObjectId(subActivityId),
      completed: true,
      completedAt: new Date(),
      earnedStickerId: stickerId ? new Types.ObjectId(stickerId) : null,
    };

    // Si existe, actualizar; si no, agregar
    if (existingProgress) {
      await this.userModel.updateOne(
        {
          _id: objectId,
          "subActivityProgress.subActivityId": new Types.ObjectId(
            subActivityId,
          ),
        },
        { $set: { "subActivityProgress.$": subActivityProgressItem } },
      );
    } else {
      await this.userModel.updateOne(
        { _id: objectId },
        { $push: { subActivityProgress: subActivityProgressItem } },
      );
    }

    // Agregar sticker ganado si lo hay
    if (stickerId) {
      await this.userModel.updateOne(
        { _id: objectId },
        { $addToSet: { earnedStickers: new Types.ObjectId(stickerId) } },
      );
    }

    // Sumar puntos si los hay
    if (points && points > 0) {
      await this.userModel.updateOne(
        { _id: objectId },
        { $inc: { totalPoints: points } },
      );
    }

    // Actualizar progreso de la actividad padre
    await this.updateActivityProgress(userId, activityId);

    return { success: true, message: "SubActivity completed successfully" };
  }

  /**
   * Actualizar progreso de actividad
   */
  async updateActivityProgress(userId: string, activityId: string) {
    const objectId = new Types.ObjectId(userId);
    const activityObjectId = new Types.ObjectId(activityId);

    // Contar subactividades completadas para esta actividad
    // Necesitamos obtener las subactividades de la actividad desde la colección de awards
    const completedCount = await this.stickerAwardModel.countDocuments({
      activityId: activityObjectId,
    });

    const user = await this.userModel.findById(objectId);
    const completedSubActivities = (user?.subActivityProgress || []).filter(
      (p: any) => p.completed,
    ).length;

    // Buscar o crear el progreso de la actividad
    const existingActivityProgress = (user?.activityProgress || []).find(
      (p: any) => p.activityId?.toString() === activityId,
    );

    const activityProgressItem = {
      activityId: activityObjectId,
      completedSubActivities: completedSubActivities,
      totalSubActivities: completedCount,
      completed: completedSubActivities >= completedCount && completedCount > 0,
      completedAt:
        completedSubActivities >= completedCount && completedCount > 0
          ? new Date()
          : null,
    };

    if (existingActivityProgress) {
      await this.userModel.updateOne(
        { _id: objectId, "activityProgress.activityId": activityObjectId },
        { $set: { "activityProgress.$": activityProgressItem } },
      );
    } else {
      await this.userModel.updateOne(
        { _id: objectId },
        { $push: { activityProgress: activityProgressItem } },
      );
    }
  }

  /**
   * Obtener subactividades completadas por el usuario
   */
  async getCompletedSubActivities(userId: string): Promise<string[]> {
    const objectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(objectId);

    if (!user) {
      console.log(`[getCompletedSubActivities] User not found: ${userId}`);
      return [];
    }

    console.log(`[getCompletedSubActivities] User found: ${userId}`);
    console.log(
      `[getCompletedSubActivities] subActivityProgress:`,
      JSON.stringify(user.subActivityProgress),
    );

    const completedIds = (user.subActivityProgress || [])
      .filter((p: any) => p.completed)
      .map((p: any) => p.subActivityId?.toString());

    console.log(`[getCompletedSubActivities] Returning:`, completedIds);
    return completedIds;
  }

  /**
   * Obtener stickers ganados por el usuario
   */
  async getEarnedStickers(userId: string): Promise<string[]> {
    const objectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(objectId);

    if (!user) {
      return [];
    }

    return (user.earnedStickers || []).map((s: any) => s.toString());
  }
}
