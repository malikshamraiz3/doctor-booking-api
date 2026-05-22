import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  slotTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  reason: string;
  notes: string;
  cancelReason: string;
  cancelledBy: "patient" | "doctor" | "admin";
  fee: number;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentDate: { type: Date, required: true },
    slotTime: { type: String, required: true }, // "10:30"
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
      default: "pending",
    },
    reason: { type: String, required: true },
    notes: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
    },
    fee: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAppointment>("Appointment", AppointmentSchema);