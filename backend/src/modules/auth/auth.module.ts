import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { User, UserSchema } from "../users/schemas/user.schema";
import {
  AuthCredential,
  AuthCredentialSchema,
} from "./schemas/auth-credential.schema";
import {
  GeneralSurvey,
  GeneralSurveySchema,
} from "./schemas/general-survey.schema";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthCredentialService } from "./auth-credential.service";
import { PasswordResetService } from "./password-reset.service";
import { PasswordResetController } from "./password-reset.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt.guard";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthCredential.name, schema: AuthCredentialSchema },
      { name: GeneralSurvey.name, schema: GeneralSurveySchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "your-secret-key",
        signOptions: { expiresIn: "24h" },
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthCredentialService,
    PasswordResetService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  controllers: [AuthController, PasswordResetController],
  exports: [AuthService, AuthCredentialService, JwtModule],
})
export class AuthModule {}
