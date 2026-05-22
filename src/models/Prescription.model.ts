import mongoose, { Document, Schema } from "mongoose";

interface IMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IPrescription extends Document {
  appointmentId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  diagnosis: string;
  medicines: IMedicine[];
  followUpDate: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    diagnosis: { type: String, required: true },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },       // "500mg"
        frequency: { type: String, required: true },    // "2 times a day"
        duration: { type: String, required: true },     // "7 days"
        instructions: { type: String, default: "" },    // "After meal"
      },
    ],
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IPrescription>("Prescription", PrescriptionSchema);