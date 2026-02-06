import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ActivityDocument = HydratedDocument<Activity>;

// Sub-schema for SubActivity
@Schema({ _id: true })
export class SubActivity {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: String, default: "from-blue-500 to-blue-600" })
  color: string;

  @Prop({ type: Types.ObjectId, ref: "Sticker", default: null })
  stickerId?: Types.ObjectId;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Number, default: 0 })
  order: number;
}

export const SubActivitySchema = SchemaFactory.createForClass(SubActivity);

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "activities",
})
export class Activity {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: String, default: "from-indigo-600 to-purple-600" })
  color: string;

  @Prop({ type: Types.ObjectId, ref: "Sticker", default: null })
  stickerId?: Types.ObjectId;

  @Prop({ type: [SubActivitySchema], default: [] })
  subActivities: SubActivity[];

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Índices
ActivitySchema.index({ name: 1 }, { unique: true });
ActivitySchema.index({ active: 1 });
ActivitySchema.index({ "subActivities._id": 1 });
