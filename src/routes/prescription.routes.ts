import { Router } from "express";
import {
  createPrescription,
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  updatePrescription,
} from "../controllers/prescription.controller";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

const router = Router();

// Admin only — prescription banana aur update karna
router.post("/", authMiddleware, roleMiddleware("admin"), createPrescription);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updatePrescription);

// Patient aur Admin — prescription dekhna
router.get("/appointment/:appointmentId", authMiddleware, getPrescriptionByAppointment);
router.get("/patient/:patientId", authMiddleware, getPatientPrescriptions);
router.get("/my", authMiddleware, getPatientPrescriptions); // Patient apni dekhega

export default router;