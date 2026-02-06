import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type GroupMembershipDocument = HydratedDocument<GroupMembership>;

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "group_memberships",
})
export class GroupMembership {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "Group" })
  groupId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  assignedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const GroupMembershipSchema =
  SchemaFactory.createForClass(GroupMembership);

// Índices
GroupMembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });
GroupMembershipSchema.index({ groupId: 1 });
GroupMembershipSchema.index({ userId: 1 });
