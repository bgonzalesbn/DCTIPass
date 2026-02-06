import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Group, GroupDocument, ShiftType } from "./schemas/group.schema";
import {
  GroupMembership,
  GroupMembershipDocument,
} from "./schemas/group-membership.schema";
import {
  Schedule,
  ScheduleDocument,
} from "../schedules/schemas/schedule.schema";

// Interfaz para User (evitar dependencia circular)
interface UserDocument {
  _id: Types.ObjectId;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMembership.name)
    private membershipModel: Model<GroupMembershipDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel("User") private userModel: Model<UserDocument>,
  ) {}

  /**
   * Get all groups
   */
  async findAll() {
    return this.groupModel.find({ active: true }).populate("scheduleId").lean();
  }

  /**
   * Get group by ID
   */
  async findById(id: string) {
    const group = await this.groupModel.findById(id).populate("scheduleId");
    if (!group || !group.active) {
      throw new NotFoundException("Group not found");
    }
    return group;
  }

  /**
   * Get group by name
   */
  async findByName(name: string) {
    const group = await this.groupModel
      .findOne({ name, active: true })
      .populate("scheduleId");
    if (!group) {
      throw new NotFoundException("Group not found");
    }
    return group;
  }

  /**
   * Create new group
   */
  async create(data: any) {
    const group = new this.groupModel({
      ...data,
      active: true,
      createdAt: new Date(),
    });
    return group.save();
  }

  /**
   * Assign schedule to group
   */
  async assignSchedule(groupId: string, scheduleId: string) {
    const group = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { scheduleId: new Types.ObjectId(scheduleId) },
        { new: true },
      )
      .populate("scheduleId");

    if (!group) {
      throw new NotFoundException("Group not found");
    }
    return group;
  }

  /**
   * Assign user to group (ensures user is only in one group)
   */
  async assignUserToGroup(groupId: string, employeeNumber: string) {
    const gId = new Types.ObjectId(groupId);

    // Buscar usuario por número de empleado
    const user = await this.userModel.findOne({ employeeNumber });
    if (!user) {
      throw new NotFoundException(
        `User with employee number ${employeeNumber} not found`,
      );
    }

    // Verificar si el usuario ya está en algún grupo
    const existingMembership = await this.membershipModel.findOne({
      userId: user._id,
      deletedAt: null,
    });

    if (existingMembership) {
      // Si ya está en un grupo, eliminamos esa membresía y lo movemos al nuevo grupo
      await this.membershipModel.findByIdAndUpdate(existingMembership._id, {
        deletedAt: new Date(),
      });
    }

    // Verificar capacidad del grupo
    const group = await this.groupModel.findById(gId);
    if (!group) {
      throw new NotFoundException("Group not found");
    }

    const memberCount = await this.membershipModel.countDocuments({
      groupId: gId,
      deletedAt: null,
    });

    if (memberCount >= group.capacityMax) {
      throw new BadRequestException(
        `Group is at full capacity (${group.capacityMax} members)`,
      );
    }

    // Crear nueva membresía
    const membership = new this.membershipModel({
      userId: user._id,
      groupId: gId,
      assignedAt: new Date(),
    });

    await membership.save();

    return {
      message: `User ${user.firstName} ${user.lastName} (${employeeNumber}) assigned to group ${group.name}`,
      membership,
      user: {
        _id: user._id,
        employeeNumber: user.employeeNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      group: {
        _id: group._id,
        name: group.name,
      },
    };
  }

  /**
   * Get user's current group
   */
  async getUserGroup(userId: string) {
    const membership = await this.membershipModel
      .findOne({ userId: new Types.ObjectId(userId), deletedAt: null })
      .populate({
        path: "groupId",
        populate: { path: "scheduleId" },
      });

    if (!membership) {
      return null;
    }

    return membership.groupId;
  }

  /**
   * Seed initial groups with schedules
   */
  async seedGroups() {
    // Buscar los schedules de IT Experience
    const morningSchedule = await this.scheduleModel.findOne({
      title: "IT Experience - Sesión Mañana",
      active: true,
    });

    const afternoonSchedule = await this.scheduleModel.findOne({
      title: "IT Experience - Sesión Tarde",
      active: true,
    });

    if (!morningSchedule || !afternoonSchedule) {
      throw new NotFoundException(
        "IT Experience schedules not found. Please seed schedules first.",
      );
    }

    const groupsData = [
      {
        name: "Grupo A",
        description: "Grupo A - Sesión de la mañana",
        capacityMax: 25,
        shift: ShiftType.MORNING,
        scheduleId: morningSchedule._id,
        active: true,
      },
      {
        name: "Grupo B",
        description: "Grupo B - Sesión de la mañana",
        capacityMax: 25,
        shift: ShiftType.MORNING,
        scheduleId: morningSchedule._id,
        active: true,
      },
      {
        name: "Grupo C",
        description: "Grupo C - Sesión de la tarde",
        capacityMax: 25,
        shift: ShiftType.AFTERNOON,
        scheduleId: afternoonSchedule._id,
        active: true,
      },
      {
        name: "Grupo D",
        description: "Grupo D - Sesión de la tarde",
        capacityMax: 25,
        shift: ShiftType.AFTERNOON,
        scheduleId: afternoonSchedule._id,
        active: true,
      },
    ];

    const createdGroups = [];

    for (const groupData of groupsData) {
      // Verificar si el grupo ya existe
      let group = await this.groupModel.findOne({ name: groupData.name });

      if (group) {
        // Actualizar el grupo existente
        group = await this.groupModel.findByIdAndUpdate(group._id, groupData, {
          new: true,
        });
      } else {
        // Crear nuevo grupo
        group = await this.groupModel.create(groupData);
      }

      createdGroups.push(group);
    }

    return {
      message: "Groups seeded successfully",
      groups: createdGroups,
    };
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string) {
    const gId = new Types.ObjectId(groupId);

    const memberships = await this.membershipModel
      .find({ groupId: gId, deletedAt: null })
      .populate("userId", "firstName lastName email employeeNumber")
      .lean();

    return memberships.map((m) => m.userId);
  }
}
