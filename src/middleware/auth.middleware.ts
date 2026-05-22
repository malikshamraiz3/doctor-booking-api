import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import ApiError from "../utils/ApiError";
import User from "../models/User.model";

// Request mein user attach karne ke liye interface extend
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Header se token uthao
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new ApiError(401, "Access denied. No token provided"));
    }

    // Token verify karo
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };

    // Database se user dhundo
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new ApiError(401, "Invalid token. User not found"));
    }

    // User ko request mein attach karo — agle middleware use karega
    req.user = user;
    next();

  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export default authMiddleware;