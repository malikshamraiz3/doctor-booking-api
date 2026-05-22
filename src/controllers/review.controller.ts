import { Request, Response, NextFunction } from "express";
import Review from "../models/Review.model";
import Appointment from "../models/Appointment.model";
import Doctor from "../models/Doctor.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

// ─── CREATE REVIEW ────────────────────────────────────────
// Kaam: Patient completed appointment pe review de
// Business Rules:
// 1. Sirf completed appointment pe review ho sakta hai
// 2. Ek appointment pe sirf ek review
// 3. Sirf us appointment ka patient review de sakta hai
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    // Appointment exist karti hai?
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new ApiError(404, "Appointment not found"));
    }

    // ⭐ Business Rule 1: Sirf completed appointment
    if (appointment.status !== "completed") {
      return next(new ApiError(400, "You can only review completed appointments"));
    }

    // ⭐ Business Rule 2: Sirf apni appointment ka review
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "You can only review your own appointments"));
    }

    // ⭐ Business Rule 3: Ek appointment pe sirf ek review
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return next(new ApiError(400, "You have already reviewed this appointment"));
    }

    // Review banao
    const review = await Review.create({
      doctorId: appointment.doctorId,   // Appointment se uthaya
      patientId: req.user._id,
      appointmentId,
      rating,
      comment: comment || "",
    });

    // ⭐ Doctor ki average rating update karo
    // Saare reviews fetch karo us doctor ke
    const allReviews = await Review.find({ doctorId: appointment.doctorId });
    const totalReviews = allReviews.length;

    // Average calculate karo
    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    // Doctor document update karo
    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      averageRating: Math.round(averageRating * 10) / 10, // 4.666 → 4.7
      totalReviews,
    });

    res.status(201).json(
      new ApiResponse(201, "Review submitted successfully", review)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET DOCTOR REVIEWS ───────────────────────────────────
// Kaam: Doctor ke saare reviews dikhao
export const getDoctorReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await Review.find({ doctorId: req.params.doctorId })
      .populate("patientId", "name")   // Patient ka naam
      .sort({ createdAt: -1 });        // Latest pehle

    res.status(200).json(
      new ApiResponse(200, "Reviews fetched", reviews)
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE REVIEW ────────────────────────────────────────
// Kaam: Admin inappropriate review delete kare
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return next(new ApiError(404, "Review not found"));
    }

    // Doctor ki rating recalculate karo review delete hone ke baad
    const allReviews = await Review.find({ doctorId: review.doctorId });
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await Doctor.findByIdAndUpdate(review.doctorId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    });

    res.status(200).json(
      new ApiResponse(200, "Review deleted", null)
    );
  } catch (error) {
    next(error);
  }
};