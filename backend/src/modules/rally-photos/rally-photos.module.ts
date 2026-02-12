import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RallyPhoto, RallyPhotoSchema } from "./schemas/rally-photo.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { RallyPhotosService } from "./rally-photos.service";
import { RallyPhotosController } from "./rally-photos.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RallyPhoto.name, schema: RallyPhotoSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [RallyPhotosService],
  controllers: [RallyPhotosController],
  exports: [RallyPhotosService],
})
export class RallyPhotosModule {}
