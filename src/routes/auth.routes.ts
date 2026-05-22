import { Router } from "express";
import { register, login, refreshToken, getMe } from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

// Public routes — koi bhi access kar sakta hai
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected route — sirf logged in user access kar sakta hai
// authMiddleware pehle chalta hai, phir getMe
router.get("/me", authMiddleware, getMe);

export default router;