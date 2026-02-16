import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import { SuggestionsService } from "./suggestions.service";
import { CreateSuggestionDto } from "./dto/create-suggestion.dto";

@Controller("suggestions")
export class SuggestionsController {
  constructor(
    private readonly suggestionsService: SuggestionsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateSuggestionDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const isAnonymous = dto.anonymous === true;
      let employeeNumber: string | undefined;

      if (!isAnonymous) {
        const jwtUser = (req as any).user;
        const userId = jwtUser.id || jwtUser.sub || jwtUser._id;

        const user = await this.userModel.findById(userId).lean();
        if (!user) {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json({ message: "Usuario no encontrado." });
        }
        employeeNumber = user.employeeNumber;
      }

      const suggestion = await this.suggestionsService.create(
        dto.suggestion,
        employeeNumber,
      );

      return res.status(HttpStatus.CREATED).json({
        message: "Sugerencia enviada exitosamente.",
        suggestion,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message || "Error al enviar la sugerencia.",
      });
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const suggestions = await this.suggestionsService.findAll();
      return res.status(HttpStatus.OK).json(suggestions);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Error al obtener las sugerencias.",
      });
    }
  }
}
