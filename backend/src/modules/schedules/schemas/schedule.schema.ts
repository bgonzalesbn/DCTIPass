import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ScheduleDocument = HydratedDocument<Schedule>;
export type SubActivityScheduleDocument = HydratedDocument<SubActivitySchedule>;

// Schema para el horario de cada subtarea dentro de un schedule
@Schema({ _id: true })
export class SubActivitySchedule {
  @Prop({ required: true, type: Types.ObjectId })
  subActivityId: Types.ObjectId;

  @Prop({ required: true })
  name: string; // Nombre de la subtarea para fácil referencia

  @Prop({ required: true })
  startTime: string; // HH:mm format

  @Prop({ required: true })
  endTime: string; // HH:mm format

  @Prop({ required: true })
  order: number; // Orden dentro del schedule
}

export const SubActivityScheduleSchema =
  SchemaFactory.createForClass(SubActivitySchedule);

// Schema para una sesión individual dentro de la distribución por grupo
@Schema({ _id: false })
export class GroupSessionItem {
  @Prop({ required: true, type: Types.ObjectId })
  subActivityId: Types.ObjectId;

  @Prop({ required: true })
  subActivityName: string;

  @Prop({ required: true })
  startTime: string; // HH:mm

  @Prop({ required: true })
  endTime: string; // HH:mm

  @Prop({ required: true, default: 0 })
  order: number;
}

export const GroupSessionItemSchema =
  SchemaFactory.createForClass(GroupSessionItem);

// Schema para la distribución de sesiones de un grupo específico
@Schema({ _id: false })
export class GroupSession {
  @Prop({ required: true, type: Types.ObjectId, ref: "Group" })
  groupId: Types.ObjectId;

  @Prop({ type: [GroupSessionItemSchema], default: [] })
  sessions: GroupSessionItem[];
}

export const GroupSessionSchema = SchemaFactory.createForClass(GroupSession);

@Schema({
  timestamps: { createdAt: true, updatedAt: true },
  collection: "schedule",
})
export class Schedule {
  @Prop({ type: [{ type: Types.ObjectId, ref: "Group" }], default: [] })
  groupIds: Types.ObjectId[]; // Grupos asignados al horario

  @Prop({ required: true, type: Types.ObjectId, ref: "Activity" })
  activityId: Types.ObjectId;

  @Prop({ required: true })
  title: string; // Título del schedule (ej: "IT Experience - Sesión Mañana")

  @Prop({ required: true, type: Date })
  date: Date; // Fecha del evento

  @Prop({ required: true })
  startTime: string; // HH:mm format - hora inicio general

  @Prop({ required: true })
  endTime: string; // HH:mm format - hora fin general

  @Prop({ type: [SubActivityScheduleSchema], default: [] })
  subActivitySchedules: SubActivitySchedule[]; // Horarios de subtareas

  @Prop({ type: Number, default: 30 })
  sessionDuration: number; // Duración de cada sesión en minutos

  @Prop({ type: [GroupSessionSchema], default: [] })
  groupSessions: GroupSession[]; // Distribución de sesiones por grupo

  @Prop({ default: 1 })
  order: number; // Order within the day

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

// Índices
ScheduleSchema.index({ activityId: 1, date: 1 });
ScheduleSchema.index({ groupIds: 1, date: 1, startTime: 1, endTime: 1 });
ScheduleSchema.index({ date: 1, groupIds: 1 });
ScheduleSchema.index({ groupIds: 1, date: 1, startTime: 1 });
ScheduleSchema.index({ groupIds: 1, order: 1 });
