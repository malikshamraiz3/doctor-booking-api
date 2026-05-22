import { Router } from "express";
import {
  createReview,
  getDoctorReviews,
  deleteReview,
} from "../controllers/review.controller";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

const router = Router();

// Patient — review dena
router.post("/", authMiddleware, createReview);

// Public — doctor ke reviews dekhna
router.get("/doctor/:doctorId", getDoctorReviews);

// Admin — review delete karna
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteReview);

export default router;