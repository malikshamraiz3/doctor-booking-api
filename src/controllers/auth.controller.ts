import { Request, Response, NextFunction } from "express";
// Request = client ne jo bheja, Response = hum jo bhejenge, NextFunction = error forward karna
import User from "../models/User.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { generateAccessToken, generateRefreshToken } from "../services/token.service";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

// ─── REGISTER ───────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone } = req.body;
    // req.body = client ne jo JSON data bheja

    // Pehle check karo — yeh email pehle se registered toh nahi
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "Email already registered"));
      // next(error) = error middleware ko de do handle karne ke liye
    }

    // Naya user banao — password model mein automatically hash hoga
    const user = await User.create({ name, email, password, phone });

    // Password response mein mat bhejo
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(201).json(
      new ApiResponse(201, "Registration successful", userResponse)
    );
  } catch (error) {
    next(error); // Koi bhi unexpected error — error middleware handle karega
  }
};

// ─── LOGIN ──────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Email se user dhundo — agar nahi mila toh error
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    // Model ka comparePassword method use karo — bcrypt se compare karta hai
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    // Dono tokens banao
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.status(200).json(
      new ApiResponse(200, "Login successful", {
        accessToken,   // Client har request mein yeh bhejega header mein
        refreshToken,  // Sirf naya access token lene ke liye use hoga
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─── REFRESH TOKEN ──────────────────────────────────────
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    // Client purana refresh token bhejega

    if (!refreshToken) {
      return next(new ApiError(400, "Refresh token required"));
    }

    // Refresh token verify karo
    const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as { id: string };

    // Naya access token banao — refresh token wahi rahega
    const newAccessToken = generateAccessToken(decoded.id);

    res.status(200).json(
      new ApiResponse(200, "Token refreshed", { accessToken: newAccessToken })
    );
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired refresh token"));
  }
};

// ─── GET CURRENT USER ───────────────────────────────────
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user auth middleware ne attach kiya tha
    res.status(200).json(
      new ApiResponse(200, "User fetched", req.user)
    );
  } catch (error) {
    next(error);
  }
};