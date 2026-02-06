import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { StickersService } from "./stickers.service";
import { Public } from "../../common/decorators/public.decorator";

@Controller("badges")
export class StickersController {
  constructor(private stickersService: StickersService) {}

  @Get()
  async getAllStickers() {
    return this.stickersService.getAllStickers();
  }

  @Public()
  @Post("seed")
  async seedStickers(@Body() data: any, @Res() res: Response) {
    try {
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Body debe ser un array" });
      }

      // Validar que cada elemento tenga un name
      for (const item of data) {
        if (!item.name || typeof item.name !== "string") {
          return res
            .status(400)
            .json({ error: "Cada badge debe tener un name (string)" });
        }
      }

      const result = await this.stickersService.seedStickers(data);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      console.error("Error en seedStickers:", error);
      return res.status(500).json({
        error: "Error al seedear badges",
        message: error.message,
      });
    }
  }

  @Public()
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadBadge(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string; description?: string },
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!body.name || typeof body.name !== "string") {
        return res.status(400).json({ error: "Name is required" });
      }

      // Convertir imagen a base64
      const base64Image = file.buffer.toString("base64");
      const mimeType = file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Crear el badge
      const sticker = await this.stickersService.createSticker(
        body.name,
        body.description || "",
        dataUrl,
      );

      return res.status(HttpStatus.CREATED).json({
        message: "Badge uploaded successfully",
        sticker,
      });
    } catch (error) {
      console.error("Error uploading badge:", error);
      return res.status(500).json({
        error: "Error uploading badge",
        message: error.message,
      });
    }
  }
}
