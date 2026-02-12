import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import { RallyPhotosService } from "./rally-photos.service";
import { CreateRallyPhotoDto } from "./dto/create-rally-photo.dto";

@Controller("rally-photos")
export class RallyPhotosController {
  constructor(
    private readonly rallyPhotosService: RallyPhotosService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post()
  async upload(
    @Body() dto: CreateRallyPhotoDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const jwtUser = (req as any).user;
      const userId = jwtUser.id || jwtUser.sub || jwtUser._id;

      const user = await this.userModel.findById(userId).lean();
      if (!user) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "Usuario no encontrado." });
      }

      const photo = await this.rallyPhotosService.create(
        user.employeeNumber,
        dto.imageData,
        dto.caption,
      );

      return res.status(HttpStatus.CREATED).json({
        message: "Foto subida exitosamente.",
        photo: {
          _id: photo._id,
          caption: photo.caption,
          createdAt: (photo as any).createdAt,
        },
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al subir la foto.",
      });
    }
  }

  @Get("my-photos")
  async getMyPhotos(@Req() req: Request, @Res() res: Response) {
    try {
      const jwtUser = (req as any).user;
      const userId = jwtUser.id || jwtUser.sub || jwtUser._id;

      const user = await this.userModel.findById(userId).lean();
      if (!user) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "Usuario no encontrado." });
      }

      const photos = await this.rallyPhotosService.findByEmployee(
        user.employeeNumber,
      );
      return res.status(HttpStatus.OK).json(photos);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Error al obtener las fotos.",
      });
    }
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const jwtUser = (req as any).user;
      const userId = jwtUser.id || jwtUser.sub || jwtUser._id;

      const user = await this.userModel.findById(userId).lean();
      if (!user) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "Usuario no encontrado." });
      }

      const deleted = await this.rallyPhotosService.delete(
        id,
        user.employeeNumber,
      );

      if (!deleted) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: "Foto no encontrada." });
      }

      return res
        .status(HttpStatus.OK)
        .json({ message: "Foto eliminada exitosamente." });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Error al eliminar la foto.",
      });
    }
  }
}
