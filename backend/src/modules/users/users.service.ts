import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
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
  LegacyStickerAward,
  LegacyStickerAwardDocument,
} from "../activities/schemas/legacy-sticker-award.schema";
import { Group, GroupDocument } from "../groups/schemas/group.schema";
import {
  Activity,
  ActivityDocument,
} from "../activities/schemas/activity.schema";
import {
  FinalSurveyResponse,
  FinalSurveyResponseDocument,
} from "./schemas/final-survey-response.schema";

const IT_EXPERIENCE_BADGE_ID = "69823bf0d6bd58d3ea14ba91";

interface FinalSurveyAnswerInput {
  question: string;
  value: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(GroupMembership.name)
    private groupMembershipModel: Model<GroupMembershipDocument>,
    @InjectModel(ActivityCompletion.name)
    private activityCompletionModel: Model<ActivityCompletionDocument>,
    @InjectModel(LegacyStickerAward.name)
    private stickerAwardModel: Model<LegacyStickerAwardDocument>,
    @InjectModel(Group.name)
    private groupModel: Model<GroupDocument>,
    @InjectModel(Activity.name)
    private activityModel: Model<ActivityDocument>,
    @InjectModel(FinalSurveyResponse.name)
    private finalSurveyResponseModel: Model<FinalSurveyResponseDocument>,
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

    const finalSurveyDocs = await this.finalSurveyResponseModel
      .find({ userId: objectId })
      .lean();
    const finalSurveys =
      finalSurveyDocs.length > 0
        ? finalSurveyDocs
        : user.finalSurveyResponses || [];

    return {
      id: user._id.toString(),
      email: user.email,
      employeeNumber: user.employeeNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      direction: user.direction,
      hobbies: user.hobbies || [],
      isAdmin: user.isAdmin || false,
      group, // Grupo único del usuario
      schedule, // Schedule del grupo con actividad y subactividades
      progress: {
        activitiesCompleted: completionCount,
        totalActivities,
        stickerCount,
      },
      earnedStickers: (user.earnedStickers || []).map((sticker: any) =>
        sticker?.toString(),
      ),
      finalSurveys: finalSurveys.map((survey: any) => ({
        activityId: survey.activityId?.toString(),
        submittedAt: survey.submittedAt,
        answers: (survey.answers || []).map((answer: any) => ({
          question: answer.question,
          value: answer.value,
        })),
      })),
      activityProgress: (user.activityProgress || []).map((progress: any) => ({
        activityId: progress.activityId?.toString(),
        completedSubActivities: progress.completedSubActivities || 0,
        totalSubActivities: progress.totalSubActivities || 0,
        completed: !!progress.completed,
        completedAt: progress.completedAt,
      })),
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
    updateData: { email?: string; hobbies?: string[]; direction?: string },
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
    if (updateData.direction !== undefined) {
      updateFields.direction = updateData.direction;
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
        direction: updatedUser.direction,
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
    console.log(
      `[CompleteSubActivity] userId=${userId}, subId=${subActivityId}, stickerId=${stickerId}, points=${points}`,
    );
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
      console.log(
        `[CompleteSubActivity] Adding stickerId=${stickerId} to user=${userId}`,
      );
      const result = await this.userModel.updateOne(
        { _id: objectId },
        { $addToSet: { earnedStickers: new Types.ObjectId(stickerId) } },
      );
      console.log(`[CompleteSubActivity] Update result:`, result);
    } else {
      console.log(
        `[CompleteSubActivity] No stickerId provided, skipping sticker assignment`,
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

    const activity = await this.activityModel.findById(activityObjectId).lean();
    if (!activity) {
      return;
    }

    const activitySubActivityIds = new Set(
      (activity.subActivities || []).map((sub: any) => sub._id?.toString()),
    );
    const totalSubActivities = activitySubActivityIds.size;

    const user = await this.userModel.findById(objectId);
    const completedSubActivities = (user?.subActivityProgress || []).filter(
      (progress: any) =>
        progress.completed &&
        activitySubActivityIds.has(progress.subActivityId?.toString()),
    ).length;

    const activityCompleted =
      totalSubActivities > 0 && completedSubActivities >= totalSubActivities;

    // Buscar o crear el progreso de la actividad
    const existingActivityProgress = (user?.activityProgress || []).find(
      (p: any) => p.activityId?.toString() === activityId,
    );

    const activityProgressItem = {
      activityId: activityObjectId,
      completedSubActivities: completedSubActivities,
      totalSubActivities,
      completed: activityCompleted,
      completedAt:
        activityCompleted && !existingActivityProgress?.completed
          ? new Date()
          : existingActivityProgress?.completedAt || null,
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

    if (activityCompleted) {
      await this.userModel.updateOne(
        { _id: objectId },
        {
          $addToSet: {
            earnedStickers: new Types.ObjectId(IT_EXPERIENCE_BADGE_ID),
          },
        },
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

  /**
   * Guardar respuesta de claridad del usuario
   */
  async saveClarityResponse(
    userId: string,
    subActivityId: string,
    scheduleId: string,
    response: string,
  ) {
    const objectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(objectId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verificar si ya existe una respuesta para esta subactividad y schedule
    const existingResponse = (user.clarityResponses || []).find(
      (r: any) =>
        r.subActivityId?.toString() === subActivityId &&
        r.scheduleId?.toString() === scheduleId,
    );

    const clarityResponseItem = {
      subActivityId: new Types.ObjectId(subActivityId),
      scheduleId: new Types.ObjectId(scheduleId),
      response,
      answeredAt: new Date(),
    };

    if (existingResponse) {
      // Actualizar respuesta existente
      await this.userModel.updateOne(
        {
          _id: objectId,
          "clarityResponses.subActivityId": new Types.ObjectId(subActivityId),
          "clarityResponses.scheduleId": new Types.ObjectId(scheduleId),
        },
        { $set: { "clarityResponses.$": clarityResponseItem } },
      );
    } else {
      // Agregar nueva respuesta
      await this.userModel.updateOne(
        { _id: objectId },
        { $push: { clarityResponses: clarityResponseItem } },
      );
    }

    return { success: true, message: "Clarity response saved successfully" };
  }

  async submitFinalSurvey(
    userId: string,
    activityId: string,
    answers: FinalSurveyAnswerInput[],
  ) {
    if (!answers || answers.length === 0) {
      throw new BadRequestException(
        "Debe enviar las respuestas de la encuesta final.",
      );
    }

    const objectId = new Types.ObjectId(userId);
    const activityObjectId = new Types.ObjectId(activityId);

    const user = await this.userModel.findById(objectId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const alreadySubmitted = await this.finalSurveyResponseModel.exists({
      userId: objectId,
      activityId: activityObjectId,
    });

    if (alreadySubmitted) {
      throw new BadRequestException(
        "Ya completaste la encuesta final para esta actividad.",
      );
    }

    const activity = await this.activityModel.findById(activityObjectId);
    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    const totalSubActivities = activity.subActivities?.length || 0;
    if (totalSubActivities === 0) {
      throw new BadRequestException(
        "La actividad no tiene sesiones configuradas.",
      );
    }

    const completedSubIds = new Set(
      (user.subActivityProgress || [])
        .filter((progress: any) => progress.completed)
        .map((progress: any) => progress.subActivityId?.toString()),
    );

    const missingSession = activity.subActivities.find(
      (subActivity) => !completedSubIds.has(subActivity._id.toString()),
    );

    if (missingSession) {
      throw new BadRequestException(
        "Debes completar todas las sesiones antes de contestar la encuesta final.",
      );
    }

    const sanitizedAnswers = answers.map((answer, index) => {
      if (
        typeof answer.value !== "number" ||
        answer.value < 1 ||
        answer.value > 5
      ) {
        throw new BadRequestException(
          `La respuesta ${index + 1} debe estar entre 1 y 5.`,
        );
      }
      return {
        question: answer.question || `Pregunta ${index + 1}`,
        value: Math.round(answer.value),
      };
    });

    const submissionDate = new Date();

    try {
      await this.finalSurveyResponseModel.create({
        userId: objectId,
        activityId: activityObjectId,
        answers: sanitizedAnswers,
        submittedAt: submissionDate,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException(
          "Ya completaste la encuesta final para esta actividad.",
        );
      }
      throw error;
    }

    const badgeObjectId = new Types.ObjectId(IT_EXPERIENCE_BADGE_ID);
    const alreadyHasBadge = (user.earnedStickers || []).some(
      (sticker: any) => sticker?.toString() === badgeObjectId.toString(),
    );

    const now = new Date();
    let updatedProgress = false;
    const updatedActivityProgress = (user.activityProgress || []).map(
      (progress: any) => {
        if (progress.activityId?.toString() === activityObjectId.toString()) {
          updatedProgress = true;
          return {
            ...progress,
            completedSubActivities: totalSubActivities,
            totalSubActivities,
            completed: true,
            completedAt: now,
          };
        }
        return progress;
      },
    );

    if (!updatedProgress) {
      updatedActivityProgress.push({
        activityId: activityObjectId,
        completedSubActivities: totalSubActivities,
        totalSubActivities,
        completed: true,
        completedAt: now,
      });
    }

    await this.userModel.updateOne(
      { _id: objectId },
      {
        $set: {
          activityProgress: updatedActivityProgress,
        },
        $addToSet: { earnedStickers: badgeObjectId },
      },
    );

    return {
      success: true,
      message: "Encuesta final registrada y badge asignado.",
      badgeId: badgeObjectId.toString(),
      badgeAssigned: !alreadyHasBadge,
      submittedAt: submissionDate,
    };
  }
}
