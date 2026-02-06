import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Sticker, StickerSchema } from "./schemas/sticker.schema";
import { StickersService } from "./stickers.service";
import { StickersController } from "./stickers.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sticker.name, schema: StickerSchema }]),
  ],
  providers: [StickersService],
  controllers: [StickersController],
  exports: [StickersService, MongooseModule],
})
export class StickersModule {}
