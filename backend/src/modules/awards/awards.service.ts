import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  StickerAward,
  StickerAwardDocument,
} from "./schemas/sticker-award.schema";
import { UserAward, UserAwardDocument } from "./schemas/user-award.schema";
import {
  CreateStickerAwardDto,
  AnswerAwardDto,
  UpdateStickerAwardDto,
} from "./dto/award.dto";
import { User, UserDocument } from "../users/schemas/user.schema";

@Injectable()
export class AwardsService {
  constructor(
    @InjectModel(StickerAward.name)
    private stickerAwardModel: Model<StickerAwardDocument>,
    @InjectModel(UserAward.name)
    private userAwardModel: Model<UserAwardDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // Crear un nuevo sticker award (reto)
  async createStickerAward(dto: CreateStickerAwardDto): Promise<StickerAward> {
    const stickerAward = new this.stickerAwardModel({
      stickerId: new Types.ObjectId(dto.stickerId),
      activityId: new Types.ObjectId(dto.activityId),
      subActivityId: new Types.ObjectId(dto.subActivityId),
      question: dto.question,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation || "",
      points: dto.points || 10,
      active: true,
    });
    return stickerAward.save();
  }

  // Obtener reto por subactividad
  async getAwardBySubActivity(
    subActivityId: string,
  ): Promise<StickerAward | null> {
    return this.stickerAwardModel
      .findOne({
        subActivityId: new Types.ObjectId(subActivityId),
        active: true,
        deletedAt: null,
      })
      .populate("stickerId")
      .exec();
  }

  // Obtener todos los retos de una actividad
  async getAwardsByActivity(activityId: string): Promise<StickerAward[]> {
    return this.stickerAwardModel
      .find({
        activityId: new Types.ObjectId(activityId),
        active: true,
        deletedAt: null,
      })
      .populate("stickerId")
      .exec();
  }

  // Verificar si usuario ya completó un reto
  async hasUserCompletedAward(
    userId: string,
    stickerAwardId: string,
  ): Promise<boolean> {
    const existing = await this.userAwardModel.findOne({
      userId: new Types.ObjectId(userId),
      stickerAwardId: new Types.ObjectId(stickerAwardId),
    });
    return !!existing;
  }

  // Responder a un reto
  async answerAward(
    userId: string,
    dto: AnswerAwardDto,
  ): Promise<{
    isCorrect: boolean;
    pointsEarned: number;
    sticker: any;
    explanation: string;
    alreadyCompleted?: boolean;
  }> {
    // Primero obtener el documento sin populate para tener los ObjectIds originales
    const stickerAwardRaw = await this.stickerAwardModel
      .findById(dto.stickerAwardId)
      .lean()
      .exec();

    if (!stickerAwardRaw) {
      throw new NotFoundException("Reto no encontrado");
    }

    // Ahora obtener con populate para el sticker
    const stickerAward = await this.stickerAwardModel
      .findById(dto.stickerAwardId)
      .populate("stickerId")
      .exec();

    if (!stickerAward) {
      throw new NotFoundException("Reto no encontrado");
    }

    // Verificar si ya completó este reto
    const alreadyCompleted = await this.hasUserCompletedAward(
      userId,
      dto.stickerAwardId,
    );
    if (alreadyCompleted) {
      return {
        isCorrect: true,
        pointsEarned: 0,
        sticker: stickerAward.stickerId,
        explanation: "Ya completaste este reto anteriormente",
        alreadyCompleted: true,
      };
    }

    // Comparación de respuesta usando el documento raw (sin populate)
    const userAnswer = dto.answer?.trim() || "";
    const correctAnswer = stickerAwardRaw.correctAnswer?.trim() || "";
    const isCorrect = userAnswer === correctAnswer;
    const pointsEarned = isCorrect ? stickerAwardRaw.points : 0;

    // Debug log
    console.log("User answer:", JSON.stringify(userAnswer));
    console.log("Correct answer:", JSON.stringify(correctAnswer));
    console.log("Is correct:", isCorrect);

    // Usar los valores del documento raw (lean) para asegurar ObjectIds correctos
    const activityIdValue = stickerAwardRaw.activityId
      ? new Types.ObjectId(stickerAwardRaw.activityId.toString())
      : null;
    const subActivityIdValue = stickerAwardRaw.subActivityId
      ? new Types.ObjectId(stickerAwardRaw.subActivityId.toString())
      : null;

    if (!activityIdValue || !subActivityIdValue) {
      throw new NotFoundException(
        "El reto no tiene actividad o subactividad asociada",
      );
    }

    console.log(`[answerAward] Creating UserAward with userId: ${userId}`);

    // Guardar respuesta del usuario - usar stickerId del documento raw
    const userAward = new this.userAwardModel({
      userId: new Types.ObjectId(userId),
      stickerAwardId: new Types.ObjectId(dto.stickerAwardId),
      activityId: activityIdValue,
      subActivityId: subActivityIdValue,
      stickerId: stickerAwardRaw.stickerId
        ? new Types.ObjectId(stickerAwardRaw.stickerId.toString())
        : null,
      userAnswer: dto.answer,
      isCorrect,
      pointsEarned,
      completedAt: new Date(),
    });
    const savedAward = await userAward.save();
    console.log(
      `[answerAward] UserAward saved with id: ${savedAward._id}, userId in doc: ${savedAward.userId}`,
    );
    console.log(
      `[answerAward] stickerAwardId: ${dto.stickerAwardId}, userId: ${userId}, isCorrect: ${isCorrect}`,
    );

    // Si respondió correctamente, actualizar el progreso del usuario
    if (isCorrect) {
      const stickerIdString = stickerAwardRaw.stickerId?.toString();

      // Actualizar progreso de subactividad en el usuario
      const userObjectId = new Types.ObjectId(userId);
      const user = await this.userModel.findById(userObjectId);

      if (user) {
        const subActivityIdString = subActivityIdValue.toString();
        const activityIdString = activityIdValue.toString();

        console.log(`[answerAward] Updating progress for user ${userId}`);
        console.log(`[answerAward] subActivityId: ${subActivityIdString}`);

        // Verificar si ya existe el progreso de esta subactividad
        const existingProgress = (user.subActivityProgress || []).find(
          (p: any) => p.subActivityId?.toString() === subActivityIdString,
        );

        const subActivityProgressItem = {
          subActivityId: subActivityIdValue,
          completed: true,
          completedAt: new Date(),
          earnedStickerId: stickerIdString
            ? new Types.ObjectId(stickerIdString)
            : null,
        };

        console.log(
          `[answerAward] subActivityProgressItem:`,
          JSON.stringify(subActivityProgressItem),
        );

        if (existingProgress) {
          console.log(`[answerAward] Updating existing progress`);
          const updateResult = await this.userModel.updateOne(
            {
              _id: userObjectId,
              "subActivityProgress.subActivityId": subActivityIdValue,
            },
            { $set: { "subActivityProgress.$": subActivityProgressItem } },
          );
          console.log(
            `[answerAward] Update result:`,
            JSON.stringify(updateResult),
          );
        } else {
          console.log(`[answerAward] Adding new progress`);
          const pushResult = await this.userModel.updateOne(
            { _id: userObjectId },
            { $push: { subActivityProgress: subActivityProgressItem } },
          );
          console.log(`[answerAward] Push result:`, JSON.stringify(pushResult));
        }

        // Agregar sticker ganado
        if (stickerIdString) {
          await this.userModel.updateOne(
            { _id: userObjectId },
            {
              $addToSet: {
                earnedStickers: new Types.ObjectId(stickerIdString),
              },
            },
          );
        }

        // Actualizar puntos
        if (pointsEarned > 0) {
          await this.userModel.updateOne(
            { _id: userObjectId },
            { $inc: { totalPoints: pointsEarned } },
          );
        }

        // Actualizar progreso de actividad
        const updatedUser = await this.userModel.findById(userObjectId);
        const completedSubActivitiesCount = (
          updatedUser?.subActivityProgress || []
        ).filter((p: any) => p.completed).length;

        // Contar total de subactividades con retos para esta actividad
        const totalAwardsForActivity =
          await this.stickerAwardModel.countDocuments({
            activityId: activityIdValue,
            active: true,
            deletedAt: null,
          });

        const existingActivityProgress = (
          updatedUser?.activityProgress || []
        ).find((p: any) => p.activityId?.toString() === activityIdString);

        const activityProgressItem = {
          activityId: activityIdValue,
          completedSubActivities: completedSubActivitiesCount,
          totalSubActivities: totalAwardsForActivity,
          completed:
            completedSubActivitiesCount >= totalAwardsForActivity &&
            totalAwardsForActivity > 0,
          completedAt:
            completedSubActivitiesCount >= totalAwardsForActivity &&
            totalAwardsForActivity > 0
              ? new Date()
              : null,
        };

        if (existingActivityProgress) {
          await this.userModel.updateOne(
            {
              _id: userObjectId,
              "activityProgress.activityId": activityIdValue,
            },
            { $set: { "activityProgress.$": activityProgressItem } },
          );
        } else {
          await this.userModel.updateOne(
            { _id: userObjectId },
            { $push: { activityProgress: activityProgressItem } },
          );
        }
      }
    }

    return {
      isCorrect,
      pointsEarned,
      sticker: isCorrect ? stickerAward.stickerId : null,
      explanation: stickerAwardRaw.explanation || "",
    };
  }

  // Obtener todos los stickers ganados por un usuario
  async getUserAwards(userId: string): Promise<UserAward[]> {
    return this.userAwardModel
      .find({
        userId: new Types.ObjectId(userId),
        isCorrect: true,
      })
      .populate("stickerId")
      .populate("subActivityId")
      .exec();
  }

  // Obtener progreso del usuario en una actividad
  async getUserActivityProgress(
    userId: string,
    activityId: string,
  ): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    const totalAwards = await this.stickerAwardModel.countDocuments({
      activityId: new Types.ObjectId(activityId),
      active: true,
      deletedAt: null,
    });

    const completedAwards = await this.userAwardModel.countDocuments({
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
      isCorrect: true,
    });

    return {
      total: totalAwards,
      completed: completedAwards,
      percentage:
        totalAwards > 0 ? Math.round((completedAwards / totalAwards) * 100) : 0,
    };
  }

  // Obtener estado de retos para subactividades
  async getSubActivityAwardsStatus(
    userId: string,
    subActivityIds: string[],
  ): Promise<Map<string, { hasAward: boolean; completed: boolean }>> {
    const result = new Map<string, { hasAward: boolean; completed: boolean }>();

    console.log(
      `[getSubActivityAwardsStatus] Checking status for userId: ${userId}`,
    );
    console.log(
      `[getSubActivityAwardsStatus] SubActivityIds: ${JSON.stringify(subActivityIds)}`,
    );

    for (const subActivityId of subActivityIds) {
      const award = await this.stickerAwardModel.findOne({
        subActivityId: new Types.ObjectId(subActivityId),
        active: true,
        deletedAt: null,
      });

      console.log(
        `[getSubActivityAwardsStatus] SubActivity ${subActivityId}: award found = ${!!award}`,
      );

      if (award) {
        const completed = await this.userAwardModel.findOne({
          userId: new Types.ObjectId(userId),
          stickerAwardId: award._id,
          isCorrect: true,
        });

        console.log(
          `[getSubActivityAwardsStatus] SubActivity ${subActivityId}: completed = ${!!completed}, awardId = ${award._id}`,
        );

        result.set(subActivityId, {
          hasAward: true,
          completed: !!completed,
        });
      } else {
        result.set(subActivityId, {
          hasAward: false,
          completed: false,
        });
      }
    }

    return result;
  }

  // Obtener todos los sticker awards (admin)
  async getAllStickerAwards(): Promise<StickerAward[]> {
    return this.stickerAwardModel
      .find({ deletedAt: null })
      .populate("stickerId")
      .populate("activityId")
      .populate("subActivityId")
      .exec();
  }

  // Actualizar sticker award
  async updateStickerAward(
    id: string,
    dto: UpdateStickerAwardDto,
  ): Promise<StickerAward> {
    const award = await this.stickerAwardModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!award) {
      throw new NotFoundException("Reto no encontrado");
    }
    return award;
  }

  // Eliminar sticker award (soft delete)
  async deleteStickerAward(id: string): Promise<void> {
    const award = await this.stickerAwardModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), active: false },
      { new: true },
    );
    if (!award) {
      throw new NotFoundException("Reto no encontrado");
    }
  }
}
