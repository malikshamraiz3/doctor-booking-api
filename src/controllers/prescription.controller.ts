import { Request, Response, NextFunction } from "express";
import Prescription from "../models/Prescription.model";
import Appointment from "../models/Appointment.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

// ─── CREATE PRESCRIPTION ──────────────────────────────────
// Kaam: Admin completed appointment ke baad prescription likhe
// Business Rule: Sirf completed appointment ki prescription ban sakti hai
export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, diagnosis, medicines, followUpDate } = req.body;

    // Appointment exist karti hai?
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new ApiError(404, "Appointment not found"));
    }

    // ⭐ Business Rule: Sirf completed appointment ki prescription
    if (appointment.status !== "completed") {
      return next(new ApiError(400, "Prescription can only be created for completed appointments"));
    }

    // Ek appointment ki sirf ek prescription ho sakti hai
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return next(new ApiError(400, "Prescription already exists for this appointment"));
    }

    // Prescription banao — doctorId aur patientId appointment se uthao
    // Client ko manually bhejne ki zaroorat nahi
    const prescription = await Prescription.create({
      appointmentId,
      doctorId: appointment.doctorId,   // Appointment se uthaya
      patientId: appointment.patientId, // Appointment se uthaya
      diagnosis,
      medicines,
      followUpDate: followUpDate || null,
    });

    res.status(201).json(
      new ApiResponse(201, "Prescription created successfully", prescription)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET PRESCRIPTION BY APPOINTMENT ─────────────────────
// Kaam: Appointment ID se prescription nikalo
export const getPrescriptionByAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await Prescription.findOne({
      appointmentId: req.params.appointmentId,
    })
      .populate("doctorId", "specialization hospital") // Doctor info
      .populate("patientId", "name email phone");       // Patient info

    if (!prescription) {
      return next(new ApiError(404, "Prescription not found"));
    }

    // Patient sirf apni prescription dekh sakta hai
    if (
      req.user.role === "patient" &&
      prescription.patientId._id.toString() !== req.user._id.toString()
    ) {
      return next(new ApiError(403, "Access denied"));
    }

    res.status(200).json(
      new ApiResponse(200, "Prescription fetched", prescription)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET PATIENT ALL PRESCRIPTIONS ───────────────────────
// Kaam: Patient ki poori prescription history
export const getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Patient sirf apni prescriptions dekhe
    // Admin kisi bhi patient ki dekh sake
    const patientId =
      req.user.role === "admin"
        ? req.params.patientId  // Admin URL se patientId le sakta hai
        : req.user._id;         // Patient sirf apni dekhe

    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "specialization hospital")
      .populate("appointmentId", "appointmentDate slotTime") // Appointment detail
      .sort({ createdAt: -1 }); // Latest pehle

    res.status(200).json(
      new ApiResponse(200, "Prescriptions fetched", prescriptions)
    );
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PRESCRIPTION ──────────────────────────────────
// Kaam: Galti se kuch galat likha — admin update kar sake
export const updatePrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!prescription) {
      return next(new ApiError(404, "Prescription not found"));
    }

    res.status(200).json(
      new ApiResponse(200, "Prescription updated", prescription)
    );
  } catch (error) {
    next(error);
  }
};