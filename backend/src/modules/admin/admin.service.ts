// ==================== QUIZZES ====================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import {
  Activity,
  ActivityDocument,
} from "../activities/schemas/activity.schema";
import {
  Schedule,
  ScheduleDocument,
} from "../schedules/schemas/schedule.schema";
import {
  Challenge,
  ChallengeDocument,
} from "../challenges/schemas/challenge.schema";
import {
  Group,
  GroupDocument,
  ShiftType,
} from "../groups/schemas/group.schema";
import {
  GroupMembership,
  GroupMembershipDocument,
} from "../groups/schemas/group-membership.schema";
import {
  AdminCreateActivityDto,
  AdminUpdateActivityDto,
  AdminCreateSubActivityDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  AdminBulkCreateSchedulesDto,
  AdminCreateChallengeDto,
  AdminUpdateChallengeDto,
  AdminCreateStickerDto,
  AdminUpdateStickerDto,
  AdminCreateGroupDto,
  AdminUpdateGroupDto,
  AdminCreateAwardDto,
  AdminUpdateAwardDto,
  AdminUpdateUserDto,
} from "./dto/admin.dto";
import {
  FinalSurveyResponse,
  FinalSurveyResponseDocument,
} from "../users/schemas/final-survey-response.schema";

// Import sticker from the stickers module
import { Sticker, StickerDocument } from "../stickers/schemas/sticker.schema";
// Import StickerAward from the awards module

import {
  StickerAward,
  StickerAwardDocument,
} from "../awards/schemas/sticker-award.schema";
import {
  UserAward,
  UserAwardDocument,
} from "../awards/schemas/user-award.schema";

import { Quiz, QuizDocument } from "../awards/schemas/quiz.schema";

@Injectable()
export class AdminService {
  // ==================== AWARDS ====================
  async getAllAwards() {
    return this.stickerAwardModel
      .find({ deletedAt: null, active: true })
      .populate("stickerId", "_id name imageUrl")
      .populate("activityId", "_id name")
      .populate("scheduleId", "_id title date startTime endTime")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createAward(data: AdminCreateAwardDto) {
    if (!data.scheduleId) {
      throw new BadRequestException("Debes seleccionar un horario.");
    }

    // Validar que los IDs sean ObjectIds válidos
    try {
      new Types.ObjectId(data.stickerId);
      new Types.ObjectId(data.activityId);
      new Types.ObjectId(data.subActivityId);
      new Types.ObjectId(data.scheduleId);
    } catch (error) {
      throw new BadRequestException(
        "Uno o más IDs son inválidos. Por favor recarga la página e intenta nuevamente.",
      );
    }

    const existing = await this.stickerAwardModel.findOne({
      subActivityId: new Types.ObjectId(data.subActivityId),
      scheduleId: new Types.ObjectId(data.scheduleId),
      deletedAt: null,
      active: true,
    });
    if (existing) {
      throw new BadRequestException(
        "Ya existe un reto para esta sesión en el horario seleccionado.",
      );
    }

    try {
      const award = new this.stickerAwardModel({
        stickerId: new Types.ObjectId(data.stickerId),
        activityId: new Types.ObjectId(data.activityId),
        subActivityId: new Types.ObjectId(data.subActivityId),
        scheduleId: new Types.ObjectId(data.scheduleId),
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || "",
        points: data.points || 10,
        active: true,
      });
      const saved = await award.save();
      return this.stickerAwardModel
        .findById(saved._id)
        .populate("stickerId", "_id name imageUrl")
        .populate("activityId", "_id name")
        .populate("scheduleId", "_id title date startTime endTime")
        .lean();
    } catch (error) {
      console.error("Error creating award:", error);
      throw new BadRequestException(
        `Error al crear el reto: ${error.message || "Error desconocido"}`,
      );
    }
  }
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FinalSurveyResponse.name)
    private finalSurveyResponseModel: Model<FinalSurveyResponseDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(Challenge.name)
    private challengeModel: Model<ChallengeDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMembership.name)
    private membershipModel: Model<GroupMembershipDocument>,
    @InjectModel(Sticker.name) private stickerModel: Model<StickerDocument>,
    @InjectModel(StickerAward.name)
    private stickerAwardModel: Model<StickerAwardDocument>,
    @InjectModel(UserAward.name)
    private userAwardModel: Model<UserAwardDocument>,
    @InjectModel(Quiz.name)
    private quizModel: Model<QuizDocument>,
  ) {}

  // ==================== USERS ====================

  async getAvailableUsers() {
    // Obtener IDs de usuarios que ya tienen membership activa
    const activeMemberships = await this.membershipModel
      .find({ deletedAt: null })
      .select("userId")
      .lean();
    const assignedUserIds = activeMemberships.map((m) => m.userId);

    return this.userModel
      .find({ _id: { $nin: assignedUserIds }, deletedAt: null, active: true })
      .select("employeeNumber firstName lastName email")
      .sort({ firstName: 1, lastName: 1 })
      .lean();
  }

  async getAllUsers() {
    return this.userModel
      .find({ deletedAt: null })
      .select(
        "employeeNumber firstName lastName email direction isAdmin active totalPoints createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  async getPendingFinalSurveyByGroup() {
    const itExperienceActivity = await this.activityModel
      .findOne({ name: "IT Experience", active: true })
      .select("_id name")
      .lean();

    if (!itExperienceActivity?._id) {
      throw new NotFoundException("Activity IT Experience not found");
    }

    const users = await this.userModel
      .find({ deletedAt: null, active: true })
      .select("employeeNumber firstName lastName direction")
      .lean();

    const responses = await this.finalSurveyResponseModel
      .find({ activityId: itExperienceActivity._id })
      .select("userId")
      .lean();

    const respondedUserIds = new Set(
      responses.map((response) => response.userId?.toString()).filter(Boolean),
    );

    const pendingUsers = users.filter(
      (user: any) => !respondedUserIds.has(user._id.toString()),
    );

    if (pendingUsers.length === 0) {
      return {
        activityName: itExperienceActivity.name,
        totalPendingUsers: 0,
        totalGroups: 0,
        groups: [],
        generatedAt: new Date(),
      };
    }

    const pendingUserIds = pendingUsers.map((user: any) => user._id);

    const memberships = await this.membershipModel
      .find({
        deletedAt: null,
        userId: { $in: pendingUserIds },
      })
      .select("userId groupId assignedAt")
      .sort({ assignedAt: -1 })
      .lean();

    const latestMembershipByUser = new Map<string, any>();
    for (const membership of memberships) {
      const userId = membership.userId?.toString();
      if (!userId || latestMembershipByUser.has(userId)) {
        continue;
      }
      latestMembershipByUser.set(userId, membership);
    }

    const groupIds = Array.from(
      new Set(
        Array.from(latestMembershipByUser.values())
          .map((membership: any) => membership.groupId?.toString())
          .filter(Boolean),
      ),
    ).map((groupId) => new Types.ObjectId(groupId));

    const groups =
      groupIds.length > 0
        ? await this.groupModel
            .find({ _id: { $in: groupIds } })
            .select("name shift")
            .lean()
        : [];

    const groupsMap = new Map(
      groups.map((group: any) => [group._id.toString(), group]),
    );

    const grouped = new Map<
      string,
      {
        groupId: string | null;
        groupName: string;
        shift: string | null;
        users: {
          id: string;
          employeeNumber: string;
          fullName: string;
          direction: string;
        }[];
      }
    >();

    for (const user of pendingUsers as any[]) {
      const membership = latestMembershipByUser.get(user._id.toString());
      const groupId = membership?.groupId?.toString() || null;
      const groupData = groupId ? groupsMap.get(groupId) : null;
      const bucketKey = groupId || "NO_GROUP";

      if (!grouped.has(bucketKey)) {
        grouped.set(bucketKey, {
          groupId,
          groupName: groupData?.name || "Sin grupo asignado",
          shift: groupData?.shift || null,
          users: [],
        });
      }

      grouped.get(bucketKey)!.users.push({
        id: user._id.toString(),
        employeeNumber: user.employeeNumber || "N/A",
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        direction: user.direction || "Sin dirección",
      });
    }

    const normalizeEmployeeNumber = (value: string) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? value : parsed;
    };

    const groupList = Array.from(grouped.values())
      .map((group) => ({
        ...group,
        users: group.users.sort((a, b) => {
          const aParsed = normalizeEmployeeNumber(a.employeeNumber);
          const bParsed = normalizeEmployeeNumber(b.employeeNumber);
          if (typeof aParsed === "number" && typeof bParsed === "number") {
            return aParsed - bParsed;
          }
          return String(a.employeeNumber).localeCompare(
            String(b.employeeNumber),
          );
        }),
      }))
      .sort((a, b) => {
        if (a.groupName === "Sin grupo asignado") return 1;
        if (b.groupName === "Sin grupo asignado") return -1;
        return a.groupName.localeCompare(b.groupName);
      })
      .map((group) => ({
        ...group,
        totalUsers: group.users.length,
      }));

    return {
      activityName: itExperienceActivity.name,
      totalPendingUsers: pendingUsers.length,
      totalGroups: groupList.length,
      groups: groupList,
      generatedAt: new Date(),
    };
  }

  async updateUser(userId: string, data: AdminUpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: data }, { new: true })
      .select(
        "employeeNumber firstName lastName email direction isAdmin active",
      )
      .lean();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  // ==================== SCHEDULES ====================

  async getAllSchedules() {
    return this.scheduleModel
      .find({ deletedAt: null })
      .populate("activityId", "_id name description color")
      .populate("groupIds", "_id name shift")
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  async createSchedule(data: CreateScheduleDto) {
    // Validar que no exista un horario con solapamiento de horas para la misma actividad en la misma fecha
    const activityId = new Types.ObjectId(data.activityId);
    // Extraer solo la parte de fecha (YYYY-MM-DD) y fijar a mediodía UTC para evitar desfase de timezone
    const dateOnly = data.date.substring(0, 10);
    const dateObj = new Date(dateOnly + "T00:00:00.000Z");
    const nextDay = new Date(dateOnly + "T23:59:59.999Z");

    const overlapping = await this.scheduleModel.findOne({
      activityId,
      date: { $gte: dateObj, $lt: nextDay },
      deletedAt: null,
      // Solapamiento: el nuevo inicia antes de que termine el existente Y termina después de que inicie el existente
      startTime: { $lt: data.endTime },
      endTime: { $gt: data.startTime },
    });

    if (overlapping) {
      throw new BadRequestException(
        `Ya existe un horario para esta actividad en la fecha seleccionada que se solapa en horario (${overlapping.startTime} - ${overlapping.endTime})`,
      );
    }

    const scheduleData: any = {
      ...data,
      activityId,
      date: new Date(dateOnly + "T12:00:00.000Z"),
      groupIds: (data.groupIds || []).map((id) => new Types.ObjectId(id)),
      active: true,
    };

    // Limpiar campo legacy
    delete scheduleData.groupId;

    if (data.subActivitySchedules) {
      scheduleData.subActivitySchedules = data.subActivitySchedules.map(
        (s) => ({
          ...s,
          subActivityId: new Types.ObjectId(s.subActivityId),
        }),
      );
    }

    const schedule = new this.scheduleModel(scheduleData);
    const saved = await schedule.save();
    return this.scheduleModel
      .findById(saved._id)
      .populate("activityId", "_id name description color")
      .populate("groupIds", "_id name shift")
      .lean();
  }

  async updateSchedule(scheduleId: string, data: UpdateScheduleDto) {
    // Validar solapamiento de horas si se cambia actividad, fecha u horas
    if (data.activityId || data.date || data.startTime || data.endTime) {
      const current = await this.scheduleModel.findById(scheduleId).lean();
      if (current) {
        const checkActivityId = data.activityId
          ? new Types.ObjectId(data.activityId)
          : current.activityId;
        const checkDate = data.date ? data.date.substring(0, 10) : null;
        const baseDateStr =
          checkDate || current.date.toISOString().substring(0, 10);
        const checkStartTime = data.startTime || current.startTime;
        const checkEndTime = data.endTime || current.endTime;
        const dateStart = new Date(baseDateStr + "T00:00:00.000Z");
        const dateEnd = new Date(baseDateStr + "T23:59:59.999Z");

        const overlapping = await this.scheduleModel.findOne({
          _id: { $ne: new Types.ObjectId(scheduleId) },
          activityId: checkActivityId,
          date: { $gte: dateStart, $lte: dateEnd },
          deletedAt: null,
          startTime: { $lt: checkEndTime },
          endTime: { $gt: checkStartTime },
        });

        if (overlapping) {
          throw new BadRequestException(
            `Ya existe un horario para esta actividad en la fecha seleccionada que se solapa en horario (${overlapping.startTime} - ${overlapping.endTime})`,
          );
        }
      }
    }

    const updateData: any = { ...data };

    if (data.activityId) {
      updateData.activityId = new Types.ObjectId(data.activityId);
    }
    if (data.date) {
      const dOnly = data.date.substring(0, 10);
      updateData.date = new Date(dOnly + "T12:00:00.000Z");
    }
    if (data.groupIds) {
      updateData.groupIds = data.groupIds.map((id) => new Types.ObjectId(id));
    }
    // Limpiar campo legacy
    delete updateData.groupId;

    if (data.subActivitySchedules) {
      updateData.subActivitySchedules = data.subActivitySchedules.map((s) => ({
        ...s,
        subActivityId: new Types.ObjectId(s.subActivityId),
      }));
    }

    const schedule = await this.scheduleModel
      .findByIdAndUpdate(scheduleId, { $set: updateData }, { new: true })
      .populate("activityId", "_id name description color")
      .populate("groupIds", "_id name shift")
      .lean();

    if (!schedule) {
      throw new NotFoundException("Schedule not found");
    }
    return schedule;
  }

  async deleteSchedule(scheduleId: string) {
    const schedule = await this.scheduleModel
      .findByIdAndUpdate(
        scheduleId,
        { active: false, deletedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!schedule) {
      throw new NotFoundException("Schedule not found");
    }
    return { message: "Schedule deleted successfully" };
  }

  async getSchedulesByActivity(activityId: string) {
    return this.scheduleModel
      .find({ activityId: new Types.ObjectId(activityId), deletedAt: null })
      .populate("groupIds", "_id name shift")
      .populate("groupSessions.groupId", "_id name shift")
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  async bulkCreateSchedules(
    activityId: string,
    data: AdminBulkCreateSchedulesDto,
  ) {
    const actObjId = new Types.ObjectId(activityId);
    const groupObjIds = (data.groupIds || []).map(
      (id) => new Types.ObjectId(id),
    );
    const created: any[] = [];

    for (const dateStr of data.dates) {
      const dateOnly = dateStr.substring(0, 10);
      const dateObj = new Date(dateOnly + "T00:00:00.000Z");
      const nextDay = new Date(dateOnly + "T23:59:59.999Z");

      for (const slot of data.timeSlots) {
        // Validar solapamiento
        const overlapping = await this.scheduleModel.findOne({
          activityId: actObjId,
          date: { $gte: dateObj, $lt: nextDay },
          deletedAt: null,
          startTime: { $lt: slot.endTime },
          endTime: { $gt: slot.startTime },
        });

        if (overlapping) {
          throw new BadRequestException(
            `Solapamiento de horario en fecha ${dateOnly}: ${overlapping.startTime} - ${overlapping.endTime} se cruza con ${slot.startTime} - ${slot.endTime}`,
          );
        }

        const schedule = new this.scheduleModel({
          title: data.title,
          activityId: actObjId,
          date: new Date(dateOnly + "T12:00:00.000Z"),
          startTime: slot.startTime,
          endTime: slot.endTime,
          groupIds: groupObjIds,
          active: true,
        });
        const saved = await schedule.save();
        created.push(saved);
      }
    }

    // Retornar los horarios creados con populate
    const ids = created.map((s) => s._id);
    return this.scheduleModel
      .find({ _id: { $in: ids } })
      .populate("activityId", "_id name description color")
      .populate("groupIds", "_id name shift")
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  async updateGroupSessions(
    scheduleId: string,
    data: import("./dto/admin.dto").UpdateGroupSessionsDto,
  ) {
    const schedule = await this.scheduleModel.findById(scheduleId);
    if (!schedule) throw new NotFoundException("Schedule not found");

    const groupSessions = data.groupSessions.map((gs) => ({
      groupId: new Types.ObjectId(gs.groupId),
      sessions: gs.sessions.map((s, idx) => ({
        subActivityId: new Types.ObjectId(s.subActivityId),
        subActivityName: s.subActivityName,
        startTime: s.startTime,
        endTime: s.endTime,
        order: s.order ?? idx,
      })),
    }));

    const updateData: any = { groupSessions };
    if (data.sessionDuration) {
      updateData.sessionDuration = data.sessionDuration;
    }
    if (data.sessionStartTime !== undefined) {
      updateData.sessionStartTime = data.sessionStartTime;
    }

    const updated = await this.scheduleModel
      .findByIdAndUpdate(scheduleId, { $set: updateData }, { new: true })
      .populate("activityId", "_id name description color")
      .populate("groupIds", "_id name shift")
      .populate("groupSessions.groupId", "_id name shift")
      .lean();

    return updated;
  }

  // ==================== ACTIVITIES ====================

  async getAllActivities() {
    return this.activityModel
      .find({ deletedAt: null })
      .populate("stickerId", "_id name imageUrl")
      .populate("subActivities.stickerId", "_id name imageUrl")
      .sort({ name: 1 })
      .lean();
  }

  async createActivity(data: AdminCreateActivityDto) {
    const activity = new this.activityModel({
      ...data,
      stickerId: data.stickerId
        ? new Types.ObjectId(data.stickerId)
        : undefined,
      active: data.active ?? true,
    });
    const saved = await activity.save();
    return this.activityModel
      .findById(saved._id)
      .populate("stickerId", "_id name imageUrl")
      .lean();
  }

  async updateActivity(activityId: string, data: AdminUpdateActivityDto) {
    const updateData: any = { ...data };
    if (data.stickerId) {
      updateData.stickerId = new Types.ObjectId(data.stickerId);
    }

    const activity = await this.activityModel
      .findByIdAndUpdate(activityId, { $set: updateData }, { new: true })
      .populate("stickerId", "_id name imageUrl")
      .populate("subActivities.stickerId", "_id name imageUrl")
      .lean();

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }
    return activity;
  }

  async deleteActivity(activityId: string) {
    const activity = await this.activityModel
      .findByIdAndUpdate(
        activityId,
        { active: false, deletedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }
    return { message: "Activity deleted successfully" };
  }

  // ==================== SUB-ACTIVITIES ====================

  async addSubActivity(activityId: string, data: AdminCreateSubActivityDto) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    const subActivity: any = {
      _id: new Types.ObjectId(),
      name: data.name,
      description: data.description || "",
      color: data.color || "from-blue-500 to-blue-600",
      stickerId: data.stickerId
        ? new Types.ObjectId(data.stickerId)
        : undefined,
      active: data.active ?? true,
      order: data.order ?? activity.subActivities.length,
      location: data.location || "",
      enableClarityQuestion: data.enableClarityQuestion ?? false,
    };

    activity.subActivities.push(subActivity);
    await activity.save();

    return this.activityModel
      .findById(activityId)
      .populate("stickerId", "_id name imageUrl")
      .populate("subActivities.stickerId", "_id name imageUrl")
      .lean();
  }

  async updateSubActivity(
    activityId: string,
    subActivityId: string,
    data: AdminCreateSubActivityDto,
  ) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    const subIdx = activity.subActivities.findIndex(
      (s: any) => s._id.toString() === subActivityId,
    );
    if (subIdx === -1) {
      throw new NotFoundException("SubActivity not found");
    }

    const existing = activity.subActivities[subIdx] as any;
    if (data.name !== undefined) existing.name = data.name;
    if (data.description !== undefined) existing.description = data.description;
    if (data.color !== undefined) existing.color = data.color;
    if (data.stickerId !== undefined)
      existing.stickerId = new Types.ObjectId(data.stickerId);
    if (data.order !== undefined) existing.order = data.order;
    if (data.active !== undefined) existing.active = data.active;
    if (data.location !== undefined) existing.location = data.location;
    if (data.enableClarityQuestion !== undefined)
      existing.enableClarityQuestion = data.enableClarityQuestion;

    await activity.save();

    return this.activityModel
      .findById(activityId)
      .populate("stickerId", "_id name imageUrl")
      .populate("subActivities.stickerId", "_id name imageUrl")
      .lean();
  }

  async deleteSubActivity(activityId: string, subActivityId: string) {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    activity.subActivities = activity.subActivities.filter(
      (s: any) => s._id.toString() !== subActivityId,
    ) as any;

    await activity.save();
    return { message: "SubActivity deleted successfully" };
  }

  // ==================== CHALLENGES ====================

  async getAllChallenges() {
    return this.challengeModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();
  }

  async createChallenge(data: AdminCreateChallengeDto) {
    const challenge = new this.challengeModel({
      ...data,
      isActive: data.isActive ?? true,
    });
    return challenge.save();
  }

  async updateChallenge(challengeId: string, data: AdminUpdateChallengeDto) {
    const challenge = await this.challengeModel
      .findByIdAndUpdate(challengeId, { $set: data }, { new: true })
      .lean();

    if (!challenge) {
      throw new NotFoundException("Challenge not found");
    }
    return challenge;
  }

  async deleteChallenge(challengeId: string) {
    const challenge = await this.challengeModel
      .findByIdAndUpdate(
        challengeId,
        { deletedAt: new Date(), isActive: false },
        { new: true },
      )
      .lean();

    if (!challenge) {
      throw new NotFoundException("Challenge not found");
    }
    return { message: "Challenge deleted successfully" };
  }

  // ==================== STICKERS ====================

  async getAllStickers() {
    return this.stickerModel.find({ deletedAt: null }).sort({ name: 1 }).lean();
  }

  async createSticker(data: AdminCreateStickerDto) {
    const sticker = new this.stickerModel({
      ...data,
      active: data.active ?? true,
    });
    return sticker.save();
  }

  async updateSticker(stickerId: string, data: AdminUpdateStickerDto) {
    const sticker = await this.stickerModel
      .findByIdAndUpdate(stickerId, { $set: data }, { new: true })
      .lean();

    if (!sticker) {
      throw new NotFoundException("Sticker not found");
    }
    return sticker;
  }

  async deleteSticker(stickerId: string) {
    const sticker = await this.stickerModel
      .findByIdAndUpdate(
        stickerId,
        { active: false, deletedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!sticker) {
      throw new NotFoundException("Sticker not found");
    }
    return { message: "Sticker deleted successfully" };
  }

  // ==================== GROUPS ====================

  async getAllGroups() {
    const groups = await this.groupModel
      .find({ deletedAt: null })
      .populate("scheduleId", "_id title date startTime endTime")
      .sort({ name: 1 })
      .lean();

    // Add member count for each group
    const groupsWithCount = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.membershipModel.countDocuments({
          groupId: group._id,
          deletedAt: null,
        });
        return { ...group, memberCount };
      }),
    );

    return groupsWithCount;
  }

  async createGroup(data: AdminCreateGroupDto) {
    const groupData: any = {
      ...data,
      active: true,
    };

    if (!groupData.shift) {
      groupData.shift = ShiftType.MORNING;
    }

    if (data.scheduleId) {
      groupData.scheduleId = new Types.ObjectId(data.scheduleId);
    }

    const group = new this.groupModel(groupData);
    return group.save();
  }

  async updateGroup(groupId: string, data: AdminUpdateGroupDto) {
    const updateData: any = { ...data };
    if (data.scheduleId) {
      updateData.scheduleId = new Types.ObjectId(data.scheduleId);
    }

    const group = await this.groupModel
      .findByIdAndUpdate(groupId, { $set: updateData }, { new: true })
      .populate("scheduleId")
      .lean();

    if (!group) {
      throw new NotFoundException("Group not found");
    }
    return group;
  }

  async deleteGroup(groupId: string) {
    const group = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { active: false, deletedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    // Soft delete all memberships
    await this.membershipModel.updateMany(
      { groupId: new Types.ObjectId(groupId), deletedAt: null },
      { deletedAt: new Date() },
    );

    return { message: "Group deleted successfully" };
  }

  async getGroupMembers(groupId: string) {
    return this.membershipModel
      .find({ groupId: new Types.ObjectId(groupId), deletedAt: null })
      .populate("userId", "employeeNumber firstName lastName email direction")
      .lean();
  }

  async assignUserToGroup(groupId: string, employeeNumber: string) {
    const user = await this.userModel.findOne({ employeeNumber });
    if (!user) {
      throw new NotFoundException(
        `User with employee number ${employeeNumber} not found`,
      );
    }

    const group = await this.groupModel.findById(groupId);
    if (!group || !group.active) {
      throw new NotFoundException("Group not found");
    }

    // Remove from current group
    await this.membershipModel.updateMany(
      { userId: user._id, deletedAt: null },
      { deletedAt: new Date() },
    );

    // Check capacity
    const memberCount = await this.membershipModel.countDocuments({
      groupId: new Types.ObjectId(groupId),
      deletedAt: null,
    });

    if (memberCount >= group.capacityMax) {
      throw new BadRequestException(
        `Group is at full capacity (${group.capacityMax})`,
      );
    }

    const groupObjectId = new Types.ObjectId(groupId);
    const existingMembership = await this.membershipModel.findOne({
      userId: user._id,
      groupId: groupObjectId,
    });

    if (existingMembership) {
      existingMembership.deletedAt = null;
      existingMembership.assignedAt = new Date();
      await existingMembership.save();
    } else {
      // Create new membership
      const membership = new this.membershipModel({
        userId: user._id,
        groupId: groupObjectId,
        assignedAt: new Date(),
      });

      await membership.save();
    }

    return {
      message: `${user.firstName} ${user.lastName} assigned to ${group.name}`,
      user: {
        _id: user._id,
        employeeNumber: user.employeeNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      group: { _id: group._id, name: group.name },
    };
  }

  async removeUserFromGroup(groupId: string, userId: string) {
    const result = await this.membershipModel.findOneAndUpdate(
      {
        groupId: new Types.ObjectId(groupId),
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      },
      { deletedAt: new Date() },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException("Membership not found");
    }

    return { message: "User removed from group" };
  }

  // ==================== AWARDS (Sticker Awards / Retos) ====================

  async updateAward(awardId: string, data: AdminUpdateAwardDto) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.scheduleId) {
      updateData.scheduleId = new Types.ObjectId(data.scheduleId);
    }
    const award = await this.stickerAwardModel
      .findByIdAndUpdate(awardId, { $set: updateData }, { new: true })
      .populate("stickerId", "_id name imageUrl")
      .populate("activityId", "_id name")
      .populate("scheduleId", "_id title date startTime endTime")
      .lean();

    if (!award) {
      throw new NotFoundException("Award not found");
    }
    return award;
  }

  async deleteAward(awardId: string) {
    const award = await this.stickerAwardModel
      .findByIdAndUpdate(
        awardId,
        { active: false, deletedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!award) {
      throw new NotFoundException("Award not found");
    }
    return { message: "Award deleted successfully" };
  }

  async getAwardsAnalytics() {
    const [awards, attempts] = await Promise.all([
      this.stickerAwardModel
        .find({ deletedAt: null, active: true })
        .populate("scheduleId", "_id title date startTime endTime")
        .lean(),
      this.userAwardModel
        .aggregate([
          {
            $group: {
              _id: "$stickerAwardId",
              totalResponses: { $sum: 1 },
              correctResponses: {
                $sum: { $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] },
              },
              incorrectResponses: {
                $sum: { $cond: [{ $eq: ["$isCorrect", false] }, 1, 0] },
              },
            },
          },
        ])
        .exec(),
    ]);

    const responseByAwardId = new Map(
      attempts.map((item: any) => [
        String(item._id),
        {
          totalResponses: item.totalResponses || 0,
          correctResponses: item.correctResponses || 0,
          incorrectResponses: item.incorrectResponses || 0,
        },
      ]),
    );

    const activityIds = Array.from(
      new Set(awards.map((a: any) => String(a.activityId)).filter(Boolean)),
    ).map((id) => new Types.ObjectId(id));

    const activities =
      activityIds.length > 0
        ? await this.activityModel
            .find({ _id: { $in: activityIds } })
            .select("_id subActivities")
            .lean()
        : [];

    const subActivityNameById = new Map<string, string>();
    for (const activity of activities as any[]) {
      for (const subActivity of activity.subActivities || []) {
        subActivityNameById.set(
          String(subActivity._id),
          subActivity.name || "Sesión sin nombre",
        );
      }
    }

    const items = awards.map((award: any) => {
      const stats = responseByAwardId.get(String(award._id)) || {
        totalResponses: 0,
        correctResponses: 0,
        incorrectResponses: 0,
      };
      const total = stats.totalResponses;
      const correctRate =
        total > 0 ? Math.round((stats.correctResponses / total) * 100) : 0;

      return {
        awardId: String(award._id),
        question: award.question || "Sin pregunta",
        activityId:
          typeof award.activityId === "object"
            ? String(award.activityId._id || award.activityId)
            : String(award.activityId),
        subActivityId: String(award.subActivityId),
        sessionName:
          subActivityNameById.get(String(award.subActivityId)) ||
          "Sesión sin nombre",
        scheduleId: award.scheduleId?._id ? String(award.scheduleId._id) : null,
        scheduleTitle: award.scheduleId?.title || "Horario no definido",
        scheduleDate: award.scheduleId?.date || null,
        totalResponses: stats.totalResponses,
        correctResponses: stats.correctResponses,
        incorrectResponses: stats.incorrectResponses,
        correctRate,
      };
    });

    const mostCorrect = [...items]
      .sort(
        (a, b) =>
          b.correctResponses - a.correctResponses ||
          b.correctRate - a.correctRate ||
          b.totalResponses - a.totalResponses,
      )
      .slice(0, 5);

    const leastCertainty = [...items]
      .filter((item) => item.totalResponses > 0)
      .sort(
        (a, b) =>
          a.correctRate - b.correctRate ||
          b.incorrectResponses - a.incorrectResponses ||
          b.totalResponses - a.totalResponses,
      )
      .slice(0, 5);

    return {
      generatedAt: new Date(),
      totalChallenges: items.length,
      answeredChallenges: items.filter((item) => item.totalResponses > 0)
        .length,
      mostCorrect,
      leastCertainty,
      items,
    };
  }

  // ==================== QUIZZES ====================
  async getAllQuizzes() {
    try {
      return await this.quizModel
        .find({ deletedAt: null, active: true })
        .populate("stickerId", "_id name imageUrl")
        .populate("activityId", "_id name")
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      console.error("[getAllQuizzes] Error:", error);
      return [];
    }
  }

  async createQuiz(data: AdminCreateAwardDto) {
    // Prevenir duplicados por sub-actividad
    const existing = await this.quizModel.findOne({
      subActivityId: new Types.ObjectId(data.subActivityId),
      deletedAt: null,
      active: true,
    });
    if (existing) {
      throw new BadRequestException(
        "Ya existe un reto para esta sub-actividad.",
      );
    }
    const quiz = new this.quizModel({
      ...data,
      stickerId: new Types.ObjectId(data.stickerId),
      activityId: new Types.ObjectId(data.activityId),
      subActivityId: new Types.ObjectId(data.subActivityId),
      active: true,
    });
    const saved = await quiz.save();
    return this.quizModel
      .findById(saved._id)
      .populate("stickerId", "_id name imageUrl")
      .populate("activityId", "_id name")
      .lean();
  }
  // ==================== DASHBOARD STATS ====================

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalActivities,
      totalSchedules,
      totalGroups,
      totalStickers,
      totalChallenges,
      totalAwards,
    ] = await Promise.all([
      this.userModel.countDocuments({ deletedAt: null }),
      this.userModel.countDocuments({ active: true, deletedAt: null }),
      this.activityModel.countDocuments({ deletedAt: null }),
      this.scheduleModel.countDocuments({ deletedAt: null, active: true }),
      this.groupModel.countDocuments({ deletedAt: null, active: true }),
      this.stickerModel.countDocuments({ deletedAt: null }),
      this.challengeModel.countDocuments({ deletedAt: null }),
      this.stickerAwardModel.countDocuments({ deletedAt: null }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalActivities,
      totalSchedules,
      totalGroups,
      totalStickers,
      totalChallenges,
      totalAwards,
    };
  }
}
