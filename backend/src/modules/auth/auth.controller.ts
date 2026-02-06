import { Controller, Post, Body, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { Public } from "../../common/decorators/public.decorator";
import { Connection } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectConnection() private connection: Connection,
  ) {}

  @Public()
  @Post("register")
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const response = await this.authService.register(registerDto);
    return res.status(HttpStatus.CREATED).json(response);
  }

  @Public()
  @Post("login")
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const response = await this.authService.login(loginDto);
    return res.status(HttpStatus.OK).json(response);
  }

  @Public()
  @Post("logout")
  async logout(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      message: "Logged out successfully",
    });
  }

  @Public()
  @Post("clean")
  async cleanCollections(@Res() res: Response) {
    try {
      const usersDeleted = await this.connection
        .collection("users")
        .deleteMany({});
      const authDeleted = await this.connection
        .collection("auth_credentials")
        .deleteMany({});

      return res.status(HttpStatus.OK).json({
        message: "✅ Colecciones limpiadas exitosamente",
        users: {
          deletedCount: usersDeleted.deletedCount,
        },
        authCredentials: {
          deletedCount: authDeleted.deletedCount,
        },
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "❌ Error al limpiar colecciones",
        error: error.message,
      });
    }
  }
}
