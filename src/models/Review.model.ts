import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const ReviewSchema = new Schema<IReview>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Yeh ensure karta hai ek appointment pe sirf ek review ho
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", ReviewSchema);