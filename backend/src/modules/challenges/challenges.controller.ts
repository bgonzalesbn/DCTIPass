import { Controller, Get, Param, Query } from "@nestjs/common";
import { ChallengesService } from "./challenges.service";

@Controller("challenges")
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Get()
  async getAllChallenges(
    @Query("difficulty") difficulty?: string,
    @Query("isActive") isActive?: string,
  ) {
    const filters: any = {};
    if (difficulty) filters.difficulty = difficulty;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    return this.challengesService.findAll(filters);
  }

  @Get(":id")
  async getChallengeById(@Param("id") id: string) {
    return this.challengesService.findById(id);
  }

  @Get("slug/:slug")
  async getChallengeBySlug(@Param("slug") slug: string) {
    return this.challengesService.findBySlug(slug);
  }
}
