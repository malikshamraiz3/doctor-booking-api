import { Router } from "express";
import {
  setSchedule,
  getDoctorSchedule,
  getAvailableSlots,
  deleteSchedule,
} from "../controllers/schedule.controller";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

const router = Router();

// Public — koi bhi available slots dekh sakta hai
router.get("/doctor/:doctorId", getDoctorSchedule);
router.get("/slots/:doctorId", getAvailableSlots);

// Admin only — schedule set aur delete karna
router.post("/", authMiddleware, roleMiddleware("admin"), setSchedule);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteSchedule);

export default router;