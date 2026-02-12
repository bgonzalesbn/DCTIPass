import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty({ message: "La sugerencia no puede estar vacía." })
  @MaxLength(2000, {
    message: "La sugerencia no puede exceder 2000 caracteres.",
  })
  suggestion: string;
}
