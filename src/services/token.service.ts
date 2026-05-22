import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

// Access token — short life (15 min)
// Yeh har request ke sath bheja jata hai
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },        // Token ke andar yeh data store hoga
    ENV.JWT_SECRET,        // Secret key se sign karo
    { expiresIn: "15m" }   // 15 minute baad expire
  );
};

// Refresh token — long life (7 days)
// Jab access token expire ho toh naya lene ke liye use hota hai
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};