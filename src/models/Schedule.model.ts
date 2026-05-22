import mongoose, { Document, Schema } from "mongoose";

export interface ISchedule extends Document {
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
    slotDuration: { type: Number, default: 30 }, // minutes
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISchedule>("Schedule", ScheduleSchema);