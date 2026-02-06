import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AwardsService } from "./awards.service";
import {
  CreateStickerAwardDto,
  AnswerAwardDto,
  UpdateStickerAwardDto,
} from "./dto/award.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";

@Controller("awards")
@UseGuards(JwtAuthGuard)
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  // Crear un nuevo sticker award (admin)
  @Post()
  async createStickerAward(@Body() dto: CreateStickerAwardDto) {
    return this.awardsService.createStickerAward(dto);
  }

  // Obtener reto por subactividad
  @Get("subactivity/:subActivityId")
  async getAwardBySubActivity(@Param("subActivityId") subActivityId: string) {
    return this.awardsService.getAwardBySubActivity(subActivityId);
  }

  // Obtener todos los retos de una actividad
  @Get("activity/:activityId")
  async getAwardsByActivity(@Param("activityId") activityId: string) {
    return this.awardsService.getAwardsByActivity(activityId);
  }

  // Responder a un reto
  @Post("answer")
  async answerAward(@Request() req, @Body() dto: AnswerAwardDto) {
    const userId = req.user.id || req.user.sub || req.user._id;
    console.log(
      "[answerAward controller] userId:",
      userId,
      "req.user:",
      JSON.stringify(req.user),
    );
    return this.awardsService.answerAward(userId, dto);
  }

  // Obtener stickers ganados por el usuario actual
  @Get("my-awards")
  async getMyAwards(@Request() req) {
    const userId = req.user.id || req.user.sub || req.user._id;
    return this.awardsService.getUserAwards(userId);
  }

  // Obtener progreso del usuario en una actividad
  @Get("progress/:activityId")
  async getMyProgress(@Request() req, @Param("activityId") activityId: string) {
    const userId = req.user.id || req.user.sub || req.user._id;
    return this.awardsService.getUserActivityProgress(userId, activityId);
  }

  // Obtener estado de retos para múltiples subactividades
  @Get("status")
  async getSubActivityAwardsStatus(
    @Request() req,
    @Query("subActivityIds") subActivityIds: string,
  ) {
    const userId = req.user.id || req.user.sub || req.user._id;
    const ids = subActivityIds.split(",");
    const statusMap = await this.awardsService.getSubActivityAwardsStatus(
      userId,
      ids,
    );

    // Convertir Map a objeto para la respuesta JSON
    const result: Record<string, { hasAward: boolean; completed: boolean }> =
      {};
    statusMap.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Verificar si usuario ya completó un reto
  @Get("completed/:stickerAwardId")
  async hasCompletedAward(
    @Request() req,
    @Param("stickerAwardId") stickerAwardId: string,
  ) {
    const userId = req.user.id || req.user.sub || req.user._id;
    const completed = await this.awardsService.hasUserCompletedAward(
      userId,
      stickerAwardId,
    );
    return { completed };
  }

  // ===== ADMIN ENDPOINTS =====

  // Obtener todos los sticker awards
  @Get("admin/all")
  async getAllStickerAwards() {
    return this.awardsService.getAllStickerAwards();
  }

  // Actualizar sticker award
  @Put(":id")
  async updateStickerAward(
    @Param("id") id: string,
    @Body() dto: UpdateStickerAwardDto,
  ) {
    return this.awardsService.updateStickerAward(id, dto);
  }

  // Eliminar sticker award
  @Delete(":id")
  async deleteStickerAward(@Param("id") id: string) {
    await this.awardsService.deleteStickerAward(id);
    return { message: "Reto eliminado correctamente" };
  }
}
