import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateRallyPhotoDto {
  @IsNotEmpty()
  @IsString()
  imageData: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
