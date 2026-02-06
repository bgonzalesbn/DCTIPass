import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Injectable()
export class DatabaseService {
  constructor(@InjectConnection() private connection: Connection) {}

  getConnection(): Connection {
    return this.connection;
  }

  async ping(): Promise<boolean> {
    try {
      await this.connection.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}
