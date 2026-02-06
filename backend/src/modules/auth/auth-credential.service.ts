import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as argon2 from "argon2";
import {
  AuthCredential,
  AuthCredentialDocument,
  PasswordAlgorithm,
} from "./schemas/auth-credential.schema";

@Injectable()
export class AuthCredentialService {
  // Argon2id parameters
  private readonly argon2Options = {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19 MB
    timeCost: 2,
    parallelism: 1,
  };

  constructor(
    @InjectModel(AuthCredential.name)
    private authCredentialModel: Model<AuthCredentialDocument>,
  ) {}

  /**
   * Create auth credentials for new user
   */
  async createCredentials(userId: Types.ObjectId, plainPassword: string) {
    const passwordHash = await argon2.hash(plainPassword, this.argon2Options);

    const credentials = new this.authCredentialModel({
      userId,
      passwordHash,
      passwordSalt: null, // Argon2 includes salt in hash
      passwordAlgo: PasswordAlgorithm.ARGON2ID,
      passwordParams: {
        memoryCost: this.argon2Options.memoryCost,
        timeCost: this.argon2Options.timeCost,
        parallelism: this.argon2Options.parallelism,
      },
      passwordVersion: 1,
      passwordUpdatedAt: new Date(),
      failedAttempts: 0,
    });

    return credentials.save();
  }

  /**
   * Verify password
   */
  async verifyPassword(
    passwordHash: string,
    plainPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, plainPassword);
    } catch (error) {
      return false;
    }
  }

  /**
   * Record failed login attempt and apply lockout if needed
   */
  async recordFailedAttempt(userId: Types.ObjectId): Promise<Date | null> {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    const creds = await this.authCredentialModel.findOneAndUpdate(
      { userId },
      { $inc: { failedAttempts: 1 } },
      { new: true },
    );

    if (!creds) {
      throw new NotFoundException("Auth credentials not found");
    }

    // Apply lockout after max attempts
    if (creds.failedAttempts >= MAX_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await this.authCredentialModel.updateOne({ userId }, { lockoutUntil });
      return lockoutUntil;
    }

    return null;
  }

  /**
   * Record successful login
   */
  async recordSuccessfulLogin(userId: Types.ObjectId, ip: string) {
    await this.authCredentialModel.updateOne(
      { userId },
      {
        failedAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    );
  }

  /**
   * Check if user is locked out
   */
  async isLockedOut(userId: Types.ObjectId): Promise<boolean> {
    const creds = await this.authCredentialModel.findOne({ userId });

    if (!creds) {
      return false;
    }

    if (creds.lockoutUntil && creds.lockoutUntil > new Date()) {
      return true;
    }

    // Clear expired lockout
    if (creds.lockoutUntil && creds.lockoutUntil <= new Date()) {
      await this.authCredentialModel.updateOne(
        { userId },
        { lockoutUntil: null },
      );
    }

    return false;
  }

  /**
   * Get credentials by user ID
   */
  async getByUserId(userId: Types.ObjectId): Promise<AuthCredentialDocument> {
    const creds = await this.authCredentialModel.findOne({ userId });

    if (!creds) {
      throw new NotFoundException("Auth credentials not found");
    }

    return creds;
  }

  /**
   * Update password
   */
  async updatePassword(userId: Types.ObjectId, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword, this.argon2Options);

    return this.authCredentialModel.findOneAndUpdate(
      { userId },
      {
        passwordHash,
        passwordUpdatedAt: new Date(),
        passwordVersion: (doc) => doc.passwordVersion + 1,
        failedAttempts: 0,
        lockoutUntil: null,
      },
      { new: true },
    );
  }

  /**
   * Enable MFA
   */
  async enableMFA(userId: Types.ObjectId, method: string, secret: string) {
    return this.authCredentialModel.findOneAndUpdate(
      { userId },
      {
        mfaEnabled: true,
        mfaMethod: method,
        mfaSecret: secret,
      },
      { new: true },
    );
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: Types.ObjectId) {
    return this.authCredentialModel.findOneAndUpdate(
      { userId },
      {
        mfaEnabled: false,
        mfaMethod: null,
        mfaSecret: null,
      },
      { new: true },
    );
  }
}
