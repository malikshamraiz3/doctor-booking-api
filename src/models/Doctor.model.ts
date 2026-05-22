import mongoose, { Document, Schema } from "mongoose";

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  specialization: string;
  qualification: string[];
  experience: number;
  consultationFee: number;
  hospital: string;
  bio: string;
  profileImage: string;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    specialization: { type: String, required: true },
    qualification: [{ type: String }],
    experience: { type: Number, required: true },
    consultationFee: { type: Number, required: true },
    hospital: { type: String, required: true },
    bio: { type: String },
    profileImage: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>("Doctor", DoctorSchema);