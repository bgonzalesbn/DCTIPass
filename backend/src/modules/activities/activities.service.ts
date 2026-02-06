import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Activity, ActivityDocument } from "./schemas/activity.schema";
import {
  GroupMembership,
  GroupMembershipDocument,
} from "../groups/schemas/group-membership.schema";
import {
  CreateActivityDto,
  UpdateActivityDto,
  CreateSubActivityDto,
} from "./dto/activity.dto";

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(GroupMembership.name)
    private membershipModel: Model<GroupMembershipDocument>,
  ) {}

  /**
   * Get all active activities
   */
  async findAll() {
    return this.activityModel
      .find({ active: true })
      .populate("stickerId")
      .populate("subActivities.stickerId")
      .lean();
  }

  /**
   * Get activity by ID
   */
  async findById(id: string) {
    const activity = await this.activityModel
      .findById(id)
      .populate("stickerId")
      .populate("subActivities.stickerId");

    if (!activity || !activity.active) {
      throw new NotFoundException("Activity not found");
    }

    return activity;
  }

  /**
   * Get activity by name
   */
  async findByName(name: string) {
    const activity = await this.activityModel
      .findOne({ name, active: true })
      .populate("stickerId")
      .populate("subActivities.stickerId");

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    return activity;
  }

  /**
   * Create a new activity
   */
  async create(createActivityDto: CreateActivityDto) {
    // Check if activity with same name exists
    const existing = await this.activityModel.findOne({
      name: createActivityDto.name,
    });

    if (existing) {
      throw new ConflictException("Activity with this name already exists");
    }

    const activity = new this.activityModel({
      ...createActivityDto,
      stickerId: createActivityDto.stickerId
        ? new Types.ObjectId(createActivityDto.stickerId)
        : null,
      subActivities: (createActivityDto.subActivities || []).map(
        (sub, index) => ({
          ...sub,
          _id: new Types.ObjectId(),
          stickerId: sub.stickerId ? new Types.ObjectId(sub.stickerId) : null,
          order: sub.order ?? index,
        }),
      ),
    });

    return activity.save();
  }

  /**
   * Update an activity
   */
  async update(id: string, updateActivityDto: UpdateActivityDto) {
    const activity = await this.activityModel.findById(id);

    if (!activity || !activity.active) {
      throw new NotFoundException("Activity not found");
    }

    // Check name uniqueness if changing name
    if (updateActivityDto.name && updateActivityDto.name !== activity.name) {
      const existing = await this.activityModel.findOne({
        name: updateActivityDto.name,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException("Activity with this name already exists");
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...updateActivityDto };

    if (updateActivityDto.stickerId) {
      updateData.stickerId = new Types.ObjectId(updateActivityDto.stickerId);
    }

    if (updateActivityDto.subActivities) {
      updateData.subActivities = updateActivityDto.subActivities.map(
        (sub, index) => ({
          ...sub,
          _id: new Types.ObjectId(),
          stickerId: sub.stickerId ? new Types.ObjectId(sub.stickerId) : null,
          order: sub.order ?? index,
        }),
      );
    }

    return this.activityModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate("stickerId")
      .populate("subActivities.stickerId");
  }

  /**
   * Add a subactivity to an existing activity
   */
  async addSubActivity(activityId: string, subActivity: CreateSubActivityDto) {
    const activity = await this.activityModel.findById(activityId);

    if (!activity || !activity.active) {
      throw new NotFoundException("Activity not found");
    }

    const newSubActivity = {
      ...subActivity,
      _id: new Types.ObjectId(),
      stickerId: subActivity.stickerId
        ? new Types.ObjectId(subActivity.stickerId)
        : null,
      order: subActivity.order ?? activity.subActivities.length,
    };

    activity.subActivities.push(newSubActivity as any);
    return activity.save();
  }

  /**
   * Remove a subactivity from an activity
   */
  async removeSubActivity(activityId: string, subActivityId: string) {
    const activity = await this.activityModel.findById(activityId);

    if (!activity || !activity.active) {
      throw new NotFoundException("Activity not found");
    }

    activity.subActivities = activity.subActivities.filter(
      (sub) => sub._id.toString() !== subActivityId,
    );

    return activity.save();
  }

  /**
   * Seed IT Experience activity with subactivities
   */
  async seedITExperience() {
    const existingActivity = await this.activityModel.findOne({
      name: "IT Experience",
    });

    if (existingActivity) {
      return existingActivity;
    }

    const itExperience = new this.activityModel({
      name: "IT Experience",
      description:
        "Programa principal de desarrollo tecnológico del Banco Nacional",
      color: "from-indigo-600 to-purple-600",
      stickerId: new Types.ObjectId("69823bf0d6bd58d3ea14ba91"),
      active: true,
      subActivities: [
        {
          _id: new Types.ObjectId(),
          name: "Estrategia Digital",
          description: "Transformación y estrategia digital del banco",
          color: "from-blue-500 to-blue-600",
          stickerId: new Types.ObjectId("69823b2ed6bd58d3ea14ba7b"),
          active: true,
          order: 0,
        },
        {
          _id: new Types.ObjectId(),
          name: "Supervisión y Gestión",
          description: "Control y supervisión de procesos tecnológicos",
          color: "from-purple-500 to-purple-600",
          stickerId: new Types.ObjectId("69823bd5d6bd58d3ea14ba8d"),
          active: true,
          order: 1,
        },
        {
          _id: new Types.ObjectId(),
          name: "Gente BN",
          description: "Desarrollo del talento humano tecnológico",
          color: "from-green-500 to-green-600",
          stickerId: new Types.ObjectId("69823b4cd6bd58d3ea14ba7f"),
          active: true,
          order: 2,
        },
        {
          _id: new Types.ObjectId(),
          name: "Gestión y Mejora",
          description: "Mejora continua de procesos y servicios",
          color: "from-orange-500 to-orange-600",
          stickerId: new Types.ObjectId("69823b79d6bd58d3ea14ba83"),
          active: true,
          order: 3,
        },
        {
          _id: new Types.ObjectId(),
          name: "Arquitectura",
          description: "Arquitectura empresarial y de soluciones",
          color: "from-indigo-500 to-indigo-600",
          stickerId: new Types.ObjectId("69823aced6bd58d3ea14ba73"),
          active: true,
          order: 4,
        },
        {
          _id: new Types.ObjectId(),
          name: "Entrega de Soluciones",
          description: "Desarrollo y entrega de soluciones tecnológicas",
          color: "from-pink-500 to-pink-600",
          stickerId: new Types.ObjectId("69823b02d6bd58d3ea14ba77"),
          active: true,
          order: 5,
        },
        {
          _id: new Types.ObjectId(),
          name: "Operaciones",
          description: "Operaciones y soporte de infraestructura TI",
          color: "from-gray-500 to-gray-600",
          stickerId: new Types.ObjectId("69823b96d6bd58d3ea14ba87"),
          active: true,
          order: 6,
        },
      ],
    });

    return itExperience.save();
  }

  /**
   * Get active activities for user's groups
   */
  async getActiveForUser(userId: string) {
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

    return this.activityModel
      .find({
        groupId: { $in: groupIds },
        active: true,
      })
      .populate("stickerId", "_id name description")
      .lean();
  }

  /**
   * Soft delete an activity
   */
  async delete(id: string) {
    const activity = await this.activityModel.findById(id);

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    activity.active = false;
    activity.deletedAt = new Date();
    return activity.save();
  }
}
