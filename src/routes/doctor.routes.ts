import { Router } from "express";
import {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctor.controller";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

const router = Router();

// Public routes — koi bhi dekh sakta hai, token ki zaroorat nahi
router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);

// Admin only routes — pehle login check, phir role check
// authMiddleware → token valid hai?
// roleMiddleware("admin") → role admin hai?
router.post("/", authMiddleware, roleMiddleware("admin"), createDoctor);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateDoctor);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDoctor);

export default router;