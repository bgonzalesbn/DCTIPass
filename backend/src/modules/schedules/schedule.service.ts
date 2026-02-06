import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Schedule, ScheduleDocument } from "./schemas/schedule.schema";
import {
  GroupMembership,
  GroupMembershipDocument,
} from "../groups/schemas/group-membership.schema";
import {
  Activity,
  ActivityDocument,
} from "../activities/schemas/activity.schema";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(GroupMembership.name)
    private membershipModel: Model<GroupMembershipDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  /**
   * Get all schedules for an activity
   */
  async getSchedulesByActivity(activityId: string) {
    return this.scheduleModel
      .find({
        activityId: new Types.ObjectId(activityId),
        active: true,
      })
      .populate("activityId", "_id name description color stickerId")
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(scheduleId: string) {
    return this.scheduleModel
      .findById(scheduleId)
      .populate("activityId", "_id name description color stickerId")
      .lean();
  }

  /**
   * Get all schedules
   */
  async getAllSchedules() {
    return this.scheduleModel
      .find({ active: true })
      .populate("activityId", "_id name description color stickerId")
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  /**
   * Get schedule for a group on specific date
   */
  async getScheduleByDate(groupId: string, date: string) {
    const gId = new Types.ObjectId(groupId);
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.scheduleModel
      .find({
        groupId: gId,
        date: { $gte: dateObj, $lt: nextDay },
        active: true,
      })
      .populate("activityId", "_id name description color stickerId")
      .lean();
  }

  /**
   * Get schedule for a group within date range
   */
  async getScheduleByDateRange(
    groupId: string,
    startDate: string,
    endDate: string,
  ) {
    const gId = new Types.ObjectId(groupId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.scheduleModel
      .find({
        groupId: gId,
        date: { $gte: start, $lte: end },
        active: true,
      })
      .populate("activityId", "_id name description color stickerId")
      .sort({ date: 1, startTime: 1 })
      .lean();
  }

  /**
   * Get today's schedule for user's groups
   */
  async getTodaySchedule(userId: string) {
    const uId = new Types.ObjectId(userId);

    // Get user's groups
    const memberships = await this.membershipModel
      .find({ userId: uId, active: true })
      .select("groupId")
      .lean();

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.scheduleModel
      .find({
        groupId: { $in: groupIds },
        date: { $gte: today, $lt: tomorrow },
        active: true,
      })
      .populate("activityId", "_id name description color stickerId")
      .populate("groupId", "_id name")
      .sort({ startTime: 1 })
      .lean();
  }

  /**
   * Seed IT Experience schedules with sub-activity times
   */
  async seedITExperienceSchedules() {
    // Buscar la actividad IT Experience
    const itExperience = await this.activityModel
      .findOne({ name: "IT Experience" })
      .lean();

    if (!itExperience) {
      throw new Error(
        "IT Experience activity not found. Please seed activities first.",
      );
    }

    // Mapeo de nombres de subtareas a sus IDs
    const subActivityMap = new Map<string, Types.ObjectId>();
    for (const sub of itExperience.subActivities) {
      subActivityMap.set(sub.name, sub._id as Types.ObjectId);
    }

    // Fecha del primer evento: 18 de febrero de 2026
    const eventDate = new Date("2026-02-18");
    eventDate.setHours(0, 0, 0, 0);

    // Schedule 1: IT Experience de 9:00 am a 1:00 pm
    const schedule1 = {
      activityId: itExperience._id,
      title: "IT Experience - Sesión Mañana",
      date: eventDate,
      startTime: "09:00",
      endTime: "13:00",
      order: 1,
      active: true,
      subActivitySchedules: [
        {
          subActivityId: subActivityMap.get("Estrategia Digital"),
          name: "Estrategia Digital",
          startTime: "09:30",
          endTime: "10:00",
          order: 1,
        },
        {
          subActivityId: subActivityMap.get("Supervisión y Gestión"),
          name: "Supervisión y Gestión",
          startTime: "10:00",
          endTime: "10:30",
          order: 2,
        },
        {
          subActivityId: subActivityMap.get("Gente BN"),
          name: "Gente BN",
          startTime: "10:30",
          endTime: "11:00",
          order: 3,
        },
        {
          subActivityId: subActivityMap.get("Gestión y Mejora"),
          name: "Gestión y Mejora",
          startTime: "11:00",
          endTime: "11:30",
          order: 4,
        },
        {
          subActivityId: subActivityMap.get("Arquitectura"),
          name: "Arquitectura",
          startTime: "11:30",
          endTime: "12:00",
          order: 5,
        },
        {
          subActivityId: subActivityMap.get("Entrega de Soluciones"),
          name: "Entrega de Soluciones",
          startTime: "12:00",
          endTime: "12:30",
          order: 6,
        },
        {
          subActivityId: subActivityMap.get("Operaciones"),
          name: "Operaciones",
          startTime: "12:30",
          endTime: "13:00",
          order: 7,
        },
      ].filter((s) => s.subActivityId), // Filtrar solo los que tienen ID válido
    };

    // Schedule 2: IT Experience de 1:00 pm a 5:00 pm
    const schedule2 = {
      activityId: itExperience._id,
      title: "IT Experience - Sesión Tarde",
      date: eventDate,
      startTime: "13:00",
      endTime: "17:00",
      order: 2,
      active: true,
      subActivitySchedules: [
        {
          subActivityId: subActivityMap.get("Estrategia Digital"),
          name: "Estrategia Digital",
          startTime: "13:30",
          endTime: "14:00",
          order: 1,
        },
        {
          subActivityId: subActivityMap.get("Supervisión y Gestión"),
          name: "Supervisión y Gestión",
          startTime: "14:00",
          endTime: "14:30",
          order: 2,
        },
        {
          subActivityId: subActivityMap.get("Gente BN"),
          name: "Gente BN",
          startTime: "14:30",
          endTime: "15:00",
          order: 3,
        },
        {
          subActivityId: subActivityMap.get("Gestión y Mejora"),
          name: "Gestión y Mejora",
          startTime: "15:00",
          endTime: "15:30",
          order: 4,
        },
        {
          subActivityId: subActivityMap.get("Arquitectura"),
          name: "Arquitectura",
          startTime: "15:30",
          endTime: "16:00",
          order: 5,
        },
        {
          subActivityId: subActivityMap.get("Entrega de Soluciones"),
          name: "Entrega de Soluciones",
          startTime: "16:00",
          endTime: "16:30",
          order: 6,
        },
        {
          subActivityId: subActivityMap.get("Operaciones"),
          name: "Operaciones",
          startTime: "16:30",
          endTime: "17:00",
          order: 7,
        },
      ].filter((s) => s.subActivityId),
    };

    // Eliminar schedules existentes para IT Experience en esa fecha
    await this.scheduleModel.deleteMany({
      activityId: itExperience._id,
      date: eventDate,
    });

    // Crear los nuevos schedules
    const createdSchedules = await this.scheduleModel.insertMany([
      schedule1,
      schedule2,
    ]);

    return {
      message: "IT Experience schedules seeded successfully",
      schedules: createdSchedules,
    };
  }

  /**
   * Create a new schedule
   */
  async createSchedule(scheduleData: Partial<Schedule>) {
    const schedule = new this.scheduleModel(scheduleData);
    return schedule.save();
  }

  /**
   * Update a schedule
   */
  async updateSchedule(scheduleId: string, updateData: Partial<Schedule>) {
    return this.scheduleModel
      .findByIdAndUpdate(scheduleId, updateData, { new: true })
      .populate("activityId", "_id name description color stickerId")
      .lean();
  }

  /**
   * Delete a schedule (soft delete)
   */
  async deleteSchedule(scheduleId: string) {
    return this.scheduleModel
      .findByIdAndUpdate(
        scheduleId,
        { active: false, deletedAt: new Date() },
        { new: true },
      )
      .lean();
  }
}
