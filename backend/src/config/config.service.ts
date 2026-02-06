import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get mongoUri(): string {
    return this.configService.get<string>(
      "MONGO_URI",
      "mongodb://localhost:27017/itexperience",
    );
  }

  get jwtSecret(): string {
    return this.configService.get<string>("JWT_SECRET", "secret-key");
  }

  get jwtExpiration(): string {
    return this.configService.get<string>("JWT_EXPIRATION", "7d");
  }

  get corsOrigin(): string[] {
    const origin = this.configService.get<string>(
      "CORS_ORIGIN",
      "http://localhost:3001",
    );
    return origin.split(",");
  }

  get port(): number {
    return this.configService.get<number>("PORT", 3000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>("NODE_ENV", "development");
  }
}
