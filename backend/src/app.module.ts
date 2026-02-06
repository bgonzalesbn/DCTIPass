import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseService } from "./database/database.service";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { SchedulesModule } from "./modules/schedules/schedules.module";
import { StickersModule } from "./modules/stickers/stickers.module";
import { AwardsModule } from "./modules/awards/awards.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>("MONGODB_URI") ||
          "mongodb://localhost:27017/itexperience",
      }),
    }),
    AuthModule,
    UsersModule,
    ActivitiesModule,
    GroupsModule,
    SchedulesModule,
    StickersModule,
    AwardsModule,
  ],
  providers: [
    DatabaseService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [DatabaseService],
})
export class AppModule {}
