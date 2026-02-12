import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: "password_reset_tokens",
})
export class PasswordResetToken {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String, unique: true })
  token: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ required: true, default: false })
  used: boolean;
}

export const PasswordResetTokenSchema =
  SchemaFactory.createForClass(PasswordResetToken);

// Auto-expire documents after they pass their expiresAt date + 1 day buffer
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
PasswordResetTokenSchema.index({ token: 1 }, { unique: true });
PasswordResetTokenSchema.index({ userId: 1 });
