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
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private authCredentialService: AuthCredentialService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register new user with auth credentials
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, employeeNumber, firstName, lastName, password } =
      registerDto;

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
    const user = new this.userModel({
      email: email.toLowerCase(),
      employeeNumber,
      firstName,
      lastName: lastName || null,
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
   * Login user with employeeNumber and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { employeeNumber, password } = loginDto;

    const user = await this.userModel.findOne({
      employeeNumber,
      active: true,
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const userId = new Types.ObjectId(user._id);

    // Check lockout status
    const isLockedOut = await this.authCredentialService.isLockedOut(userId);
    if (isLockedOut) {
      throw new UnauthorizedException(
        "Account is locked. Try again after 15 minutes.",
      );
    }

    // Get credentials and verify password
    const credentials = await this.authCredentialService.getByUserId(userId);
    const isPasswordValid = await this.authCredentialService.verifyPassword(
      credentials.passwordHash,
      password,
    );

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

    return this.generateSessionToken(user._id.toString(), user.email);
  }

  /**
   * Generate JWT token
   */
  private generateSessionToken(userId: string, email: string): AuthResponseDto {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: "24h",
      userId,
      email,
    };
  }
}
