import { Request, Response, NextFunction } from "express";
import Appointment from "../models/Appointment.model";
import Doctor from "../models/Doctor.model";
import Schedule from "../models/Schedule.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { generateTimeSlots } from "../utils/timeSlot.helper";

// ─── BOOK APPOINTMENT ─────────────────────────────────────
// Kaam: Patient slot book karta hai
// Business Logic: Pehle check karo slot available hai ya nahi
export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, appointmentDate, slotTime, reason } = req.body;

    // Doctor exist karta hai aur available hai?
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return next(new ApiError(404, "Doctor not found"));
    }
    if (!doctor.isAvailable) {
      return next(new ApiError(400, "Doctor is not available"));
    }

    // Us date ka day of week nikalo
    const selectedDate = new Date(appointmentDate);
    const dayOfWeek = selectedDate.getDay();

    // Doctor ka us din ka schedule check karo
    const schedule = await Schedule.findOne({
      doctorId,
      dayOfWeek,
      isActive: true,
    });
    if (!schedule) {
      return next(new ApiError(400, "Doctor is not available on this day"));
    }

    // Schedule se valid slots generate karo
    const validSlots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration
    );

    // Patient ne jo slot manga — woh valid hai?
    // e.g., "08:00" invalid hoga agar schedule 09:00 se shuru ho
    if (!validSlots.includes(slotTime)) {
      return next(new ApiError(400, "Invalid slot time"));
    }

    // ⭐ Core Business Logic — Slot already booked toh nahi?
    const slotStart = new Date(selectedDate.setHours(0, 0, 0, 0));
    const slotEnd = new Date(selectedDate.setHours(23, 59, 59, 999));

    const existingAppointment = await Appointment.findOne({
      doctorId,
      slotTime,
      appointmentDate: { $gte: slotStart, $lte: slotEnd },
      status: { $nin: ["cancelled"] }, // Cancelled slots dobara book ho sakte hain
    });

    if (existingAppointment) {
      return next(new ApiError(400, "This slot is already booked"));
    }

    // Sab theek hai — appointment create karo
    const appointment = await Appointment.create({
      patientId: req.user._id, // Auth middleware ne attach kiya tha
      doctorId,
      appointmentDate: selectedDate,
      slotTime,
      reason,
      fee: doctor.consultationFee, // Fee snapshot — baad mein fee change ho toh bhi record sahi rahe
      status: "pending",
    });

    res.status(201).json(
      new ApiResponse(201, "Appointment booked successfully", appointment)
    );
  } catch (error) {
    next(error);
  }
};

// ─── MY APPOINTMENTS ──────────────────────────────────────
// Kaam: Patient apni saari appointments dekhe
export const getMyAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.user._id,
    })
      .populate("doctorId", "specialization consultationFee hospital") // Doctor ki info
      .populate("patientId", "name email phone")                        // Patient ki info
      .sort({ appointmentDate: -1 }); // Latest pehle

    res.status(200).json(
      new ApiResponse(200, "Appointments fetched", appointments)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET ALL APPOINTMENTS ─────────────────────────────────
// Kaam: Admin saari appointments dekhe — filters ke saath
export const getAllAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ?status=pending ya ?doctorId=xxx filters
    const { status, doctorId } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;

    const appointments = await Appointment.find(query)
      .populate("doctorId", "specialization hospital")
      .populate("patientId", "name email phone")
      .sort({ appointmentDate: -1 });

    res.status(200).json(
      new ApiResponse(200, "All appointments fetched", appointments)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE APPOINTMENT ───────────────────────────────
// Kaam: Ek appointment ki complete detail
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctorId", "specialization consultationFee hospital")
      .populate("patientId", "name email phone");

    if (!appointment) {
      return next(new ApiError(404, "Appointment not found"));
    }

    // Patient sirf apni appointment dekh sakta hai
    // toString() isliye kyunke MongoDB ObjectId aur string compare nahi hote directly
    if (
      req.user.role === "patient" &&
      appointment.patientId._id.toString() !== req.user._id.toString()
    ) {
      return next(new ApiError(403, "Access denied"));
    }

    res.status(200).json(
      new ApiResponse(200, "Appointment fetched", appointment)
    );
  } catch (error) {
    next(error);
  }
};

// ─── CANCEL APPOINTMENT ───────────────────────────────────
// Kaam: Patient ya admin appointment cancel kare
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cancelReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return next(new ApiError(404, "Appointment not found"));
    }

    // Sirf pending ya confirmed appointment cancel ho sakti hai
    if (!["pending", "confirmed"].includes(appointment.status)) {
      return next(new ApiError(400, `Cannot cancel ${appointment.status} appointment`));
    }

    // Patient sirf apni appointment cancel kar sakta hai
    if (
      req.user.role === "patient" &&
      appointment.patientId.toString() !== req.user._id.toString()
    ) {
      return next(new ApiError(403, "Access denied"));
    }

    // Status update karo
    appointment.status = "cancelled";
    appointment.cancelReason = cancelReason || "";
    appointment.cancelledBy = req.user.role; // "patient" ya "admin"
    await appointment.save();

    res.status(200).json(
      new ApiResponse(200, "Appointment cancelled", appointment)
    );
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE STATUS ────────────────────────────────────────
// Kaam: Admin appointment ka status change kare
// pending → confirmed → completed ya no-show
export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    // Sirf yeh status allowed hain
    const allowedStatuses = ["confirmed", "completed", "no-show"];
    if (!allowedStatuses.includes(status)) {
      return next(new ApiError(400, "Invalid status"));
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return next(new ApiError(404, "Appointment not found"));
    }

    res.status(200).json(
      new ApiResponse(200, `Appointment marked as ${status}`, appointment)
    );
  } catch (error) {
    next(error);
  }
};