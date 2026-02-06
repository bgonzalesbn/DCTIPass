import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  GroupMembership,
  GroupMembershipDocument,
} from "./schemas/group-membership.schema";
import { Group, GroupDocument } from "./schemas/group.schema";

@Injectable()
export class GroupMembershipService {
  constructor(
    @InjectModel(GroupMembership.name)
    private membershipModel: Model<GroupMembershipDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  /**
   * Add user to group with capacity check (transaction-ready)
   * Validates capacity before insertion
   */
  async addUserToGroup(userId: Types.ObjectId, groupId: Types.ObjectId) {
    // Fetch group
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException("Group not found");
    }

    // Check if user is already in group
    const existingMembership = await this.membershipModel.findOne({
      userId,
      groupId,
      deletedAt: null,
    });

    if (existingMembership) {
      throw new BadRequestException("User is already a member of this group");
    }

    // Count current members
    const memberCount = await this.membershipModel.countDocuments({
      groupId,
      deletedAt: null,
    });

    // Check capacity
    if (memberCount >= group.capacityMax) {
      throw new BadRequestException(
        `Group is at full capacity (${group.capacityMax} members)`,
      );
    }

    // Add user to group
    const membership = new this.membershipModel({
      userId,
      groupId,
      assignedAt: new Date(),
    });

    return membership.save();
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(userId: Types.ObjectId, groupId: Types.ObjectId) {
    const result = await this.membershipModel.findOneAndUpdate(
      { userId, groupId },
      { deletedAt: new Date() },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException("Membership not found");
    }

    return result;
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string) {
    const objectId = new Types.ObjectId(userId);
    return this.membershipModel
      .find({ userId: objectId, active: true })
      .populate("groupId", "_id name")
      .lean();
  }

  /**
   * Add member to group (public method)
   */
  async addMember(groupId: string, memberId: string) {
    const gId = new Types.ObjectId(groupId);
    const mId = new Types.ObjectId(memberId);

    // Check permissions (requestingUserId should be admin or same as memberId)
    // TODO: Implement permission check

    return this.addUserToGroup(mId, gId);
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: Types.ObjectId) {
    return this.membershipModel
      .find({ groupId, active: true })
      .populate("userId", "firstName lastName email employeeNumber")
      .lean();
  }

  /**
   * Get group member count
   */
  async getGroupMemberCount(groupId: Types.ObjectId): Promise<number> {
    return this.membershipModel.countDocuments({
      groupId,
      active: true,
    });
  }

  /**
   * Check if user is in group
   */
  async isUserInGroup(
    userId: Types.ObjectId,
    groupId: Types.ObjectId,
  ): Promise<boolean> {
    const membership = await this.membershipModel.findOne({
      userId,
      groupId,
      active: true,
    });

    return !!membership;
  }
}
