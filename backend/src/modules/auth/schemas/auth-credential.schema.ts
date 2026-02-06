import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type AuthCredentialDocument = HydratedDocument<AuthCredential>;

export enum PasswordAlgorithm {
  ARGON2ID = "argon2id",
  BCRYPT = "bcrypt",
}

export interface PasswordParams {
  memoryCost?: number; // argon2id
  timeCost?: number; // argon2id
  parallelism?: number; // argon2id
  costFactor?: number; // bcrypt
}

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "auth_credentials",
})
export class AuthCredential {
  @Prop({ required: true, type: Types.ObjectId, ref: "User", unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: false, default: null })
  passwordSalt: string;

  @Prop({
    required: true,
    enum: PasswordAlgorithm,
    default: PasswordAlgorithm.ARGON2ID,
  })
  passwordAlgo: PasswordAlgorithm;

  @Prop({ required: true, type: Object })
  passwordParams: PasswordParams;

  @Prop({ required: true, default: 1 })
  passwordVersion: number;

  @Prop({ required: true, type: Date })
  passwordUpdatedAt: Date;

  @Prop({ required: true, default: 0 })
  failedAttempts: number;

  @Prop({ type: Date, default: null })
  lockoutUntil?: Date;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date;

  @Prop({ type: String, default: null })
  lastLoginIp?: string;

  @Prop({ required: true, default: false })
  mfaEnabled: boolean;

  @Prop({ type: String, default: null })
  mfaMethod?: string; // totp | sms | email

  @Prop({ type: String, default: null })
  mfaSecret?: string; // encrypted

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const AuthCredentialSchema =
  SchemaFactory.createForClass(AuthCredential);

// Índices
AuthCredentialSchema.index({ userId: 1 }, { unique: true });
AuthCredentialSchema.index({ lockoutUntil: 1 });
AuthCredentialSchema.index({ lastLoginAt: -1 });
