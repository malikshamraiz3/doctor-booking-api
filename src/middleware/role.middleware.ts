import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

// Jis role ko allow karna ho woh pass karo
const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // auth middleware pehle chalna chahiye
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    // User ka role allowed list mein hai?
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required role: ${roles.join(" or ")}`)
      );
    }

    next();
  };
};

export default roleMiddleware;

// Usage example:
// router.post("/", authMiddleware, roleMiddleware("admin"), createDoctor)
// router.get("/my", authMiddleware, roleMiddleware("patient", "admin"), getMyAppointments)