import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../../modules/users/schemas/user.schema";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException("No authenticated user");
    }

    const user = await this.userModel
      .findById(userId)
      .select("isAdmin active")
      .lean();

    if (!user || !user.active) {
      throw new ForbiddenException("User not found");
    }

    if (!user.isAdmin) {
      throw new ForbiddenException("Access denied: admin privileges required");
    }

    return true;
  }
}
