import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import { ENV } from "./config/env";
import errorMiddleware from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/doctor.routes";
import scheduleRoutes from "./routes/schedule.routes";
import appointmentRoutes from "./routes/appointment.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import reviewRoutes from "./routes/review.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Connect
connectDB();

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Doctor Booking API Running ✅" });
});
// Routes — /api/auth/register, /api/auth/login etc.
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reviews", reviewRoutes);

// Global error handler — sabse last mein hona chahiye
app.use(errorMiddleware);

// Server Start
app.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on port ${ENV.PORT}`);
});

export default app;