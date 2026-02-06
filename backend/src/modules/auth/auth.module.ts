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
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthCredentialService } from "./auth-credential.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt.guard";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthCredential.name, schema: AuthCredentialSchema },
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
  providers: [AuthService, AuthCredentialService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthCredentialService, JwtModule],
})
export class AuthModule {}
