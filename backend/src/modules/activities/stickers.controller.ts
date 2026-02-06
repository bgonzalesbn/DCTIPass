import { Controller, Get, Req } from "@nestjs/common";
import { StickersService } from "./stickers.service";
import { Request } from "express";

@Controller("badges")
export class StickersController {
  constructor(private stickersService: StickersService) {}

  @Get("mine")
  async getMyBadges(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return {
        error: "No authenticated user",
        earned: 0,
        total: 0,
        badges: [],
      };
    }
    return this.stickersService.getUserBadges(userId);
  }

  @Get()
  async getAllBadges() {
    return this.stickersService.findAll();
  }
}
