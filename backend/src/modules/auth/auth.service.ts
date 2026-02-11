import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { User, UserDocument } from "../users/schemas/user.schema";
import { AuthCredentialService } from "./auth-credential.service";
import { RegisterDto, LoginDto, AuthResponseDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  // Credential cache para reducir queries a MongoDB
  private credentialCache = new Map<string, any>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private authCredentialService: AuthCredentialService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new user with auth credentials
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const {
      email,
      employeeNumber,
      firstName,
      lastName,
      password,
      direction,
      hobbies,
    } = registerDto;

    // Check for existing user
    const userExists = await this.userModel.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeNumber }],
    });

    if (userExists) {
      throw new ConflictException(
        "User with this email or employee number already exists",
      );
    }

    // Create user
    const normalizedHobbies = (hobbies || [])
      .filter((hobby) => typeof hobby === "string")
      .map((hobby) => hobby.trim())
      .filter((hobby) => hobby.length > 0);

    const user = new this.userModel({
      email: email.toLowerCase(),
      employeeNumber,
      firstName,
      lastName: lastName || null,
      direction: direction || null,
      hobbies: normalizedHobbies,
      active: true,
      createdAt: new Date(),
    });

    const savedUser = await user.save();

    // Create auth credentials
    try {
      await this.authCredentialService.createCredentials(
        new Types.ObjectId(savedUser._id),
        password,
      );
    } catch (error) {
      // Rollback user creation if credentials fail
      await this.userModel.deleteOne({ _id: savedUser._id });
      throw new BadRequestException("Failed to create credentials");
    }

    return this.generateSessionToken(
      savedUser._id.toString(),
      email.toLowerCase(),
    );
  }

  /**
   * Login user with employeeNumber and password with caching and diagnostics
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const startTime = Date.now();
    const timings: Record<string, number> = {};

    try {
      const { employeeNumber, password } = loginDto;

      timings.start = Date.now();
      const user = await this.userModel.findOne({
        employeeNumber,
        active: true,
      });
      timings.userFind = Date.now();

      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const userId = new Types.ObjectId(user._id);

      // Check lockout status
      const isLockedOut = await this.authCredentialService.isLockedOut(userId);
      timings.lockoutCheck = Date.now();

      if (isLockedOut) {
        throw new UnauthorizedException(
          "Account is locked. Try again after 15 minutes.",
        );
      }

      // 🚀 Get credentials with cache
      const cacheKey = `creds_${userId}`;
      let credentials = this.credentialCache.get(cacheKey);

      if (!credentials) {
        // Not in cache, fetch from DB
        credentials = await this.authCredentialService.getByUserId(userId);
        // Store in cache
        this.credentialCache.set(cacheKey, credentials);
        // Auto-expire cache after TTL
        setTimeout(() => this.credentialCache.delete(cacheKey), this.CACHE_TTL);
      }
      timings.credentialsGet = Date.now();

      // Verify password (this is CPU-intensive - Argon2)
      const isPasswordValid = await this.authCredentialService.verifyPassword(
        credentials.passwordHash,
        password,
      );
      timings.passwordVerify = Date.now();

      if (!isPasswordValid) {
        const lockoutUntil =
          await this.authCredentialService.recordFailedAttempt(userId);
        if (lockoutUntil) {
          throw new UnauthorizedException(
            "Too many failed attempts. Account locked for 15 minutes.",
          );
        }
        throw new UnauthorizedException("Invalid credentials");
      }

      // Record successful login
      const ip = "127.0.0.1"; // TODO: Extract from request headers
      await this.authCredentialService.recordSuccessfulLogin(userId, ip);
      timings.loginRecord = Date.now();

      const result = this.generateSessionToken(
        user._id.toString(),
        user.email,
        user.isAdmin || false,
      );

      // 📊 Log performance metrics
      const totalTime = Date.now() - startTime;
      console.log("⏱️  Login Performance Metrics:", {
        employeeNumber,
        totalTime: `${totalTime}ms`,
        "User Find": `${timings.userFind - timings.start}ms`,
        "Lockout Check": `${timings.lockoutCheck - timings.userFind}ms`,
        "Get Credentials": `${timings.credentialsGet - timings.lockoutCheck}ms (cached: ${this.credentialCache.has(cacheKey)})`,
        "Password Verify (Argon2)": `${timings.passwordVerify - timings.credentialsGet}ms (CPU-intensive)`,
        "Login Record": `${timings.loginRecord - timings.passwordVerify}ms`,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      console.error("❌ Login Error:", {
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  private generateSessionToken(
    userId: string,
    email: string,
    isAdmin = false,
  ): AuthResponseDto {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: "24h",
      userId,
      email,
      isAdmin,
    };
  }
}
