import { Router } from "express";
import {
  bookAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
} from "../controllers/appointment.controller";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

const router = Router();

// Patient routes — login hona chahiye
router.post("/", authMiddleware, bookAppointment);
router.get("/my", authMiddleware, getMyAppointments);
router.get("/:id", authMiddleware, getAppointmentById);
router.patch("/:id/cancel", authMiddleware, cancelAppointment);

// Admin only routes
router.get("/", authMiddleware, roleMiddleware("admin"), getAllAppointments);
router.patch("/:id/status", authMiddleware, roleMiddleware("admin"), updateAppointmentStatus);

export default router;