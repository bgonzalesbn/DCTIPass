import { Connection } from "mongoose";

let mongod: any;
let mongoConnection: Connection;

export const rootMongooseTestModule = () => ({
  module: "MongooseTestModule",
  inject: [],
});

export const mongooseModuleOptions = async () => {
  // mongod = await MongoMemoryServer.create();
  // const mongoUri = mongod.getUri();
  // mongoConnection = (await connect(mongoUri)).connection;
  return {
    uri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/itexperience-test",
  };
};

export const closeInMongodConnection = async () => {
  if (mongoConnection) {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
};
