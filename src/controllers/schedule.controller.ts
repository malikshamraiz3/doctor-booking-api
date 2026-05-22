import { Request, Response, NextFunction } from "express";
import Schedule from "../models/Schedule.model";
import Doctor from "../models/Doctor.model";
import Appointment from "../models/Appointment.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { generateTimeSlots } from "../utils/timeSlot.helper";

// ─── SET SCHEDULE ─────────────────────────────────────────
// Kaam: Doctor ke liye weekly schedule set karo
// Ek doctor ka ek din ka sirf ek schedule hoga
export const setSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    // Doctor exist karta hai?
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return next(new ApiError(404, "Doctor not found"));
    }

    // Agar is din ka schedule pehle se hai toh update karo
    // nahi hai toh naya banao — upsert = update + insert
    const schedule = await Schedule.findOneAndUpdate(
      { doctorId, dayOfWeek }, // Yeh dono match hone chahiye
      { startTime, endTime, slotDuration: slotDuration || 30, isActive: true },
      { upsert: true, returnDocument: 'after'} // upsert: nahi mila toh create karo
    );

    res.status(200).json(
      new ApiResponse(200, "Schedule set successfully", schedule)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET DOCTOR SCHEDULE ──────────────────────────────────
// Kaam: Doctor ki poori weekly schedule dikhao
export const getDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // URL se doctorId uthao — /schedules/doctor/:doctorId
    const schedules = await Schedule.find({
      doctorId: req.params.doctorId,
      isActive: true,
    }).sort({ dayOfWeek: 1 }); // Sunday se Saturday order mein

    res.status(200).json(
      new ApiResponse(200, "Schedule fetched", schedules)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET AVAILABLE SLOTS ──────────────────────────────────
// Kaam: Kisi specific date pe doctor ke available slots dikhao
// Yahan asli business logic hai — booked slots remove karta hai
export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // /doctors/:doctorId/slots?date=2024-12-25
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return next(new ApiError(400, "Date is required"));
    }

    // Us date ka day of week nikalo
    // 0=Sunday, 1=Monday ... 6=Saturday
    const selectedDate = new Date(date as string);
    const dayOfWeek = selectedDate.getDay();

    // Doctor ka us din ka schedule dhundo
    const schedule = await Schedule.findOne({
      doctorId,
      dayOfWeek,
      isActive: true,
    });

    if (!schedule) {
      return next(new ApiError(404, "Doctor not available on this day"));
    }

    // Schedule se saare possible slots generate karo
    // e.g., ["09:00", "09:30", "10:00" ... "16:30"]
    const allSlots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration
    );

    // Us date pe jo appointments already booked hain wo uthao
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        // Us pure din ki appointments
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
      // Cancelled appointments ko ignore karo — wo slot free hai
      status: { $nin: ["cancelled"] },
    });

    // Booked slots ki sirf time values nikalo
    // ["10:00", "11:30"] — yeh slots available nahi honge
    const bookedSlots = bookedAppointments.map((apt) => apt.slotTime);

    // Saare slots mein se booked wale hata do
    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.status(200).json(
      new ApiResponse(200, "Available slots fetched", {
        date,
        doctorId,
        availableSlots, // Sirf yeh slots book ho sakte hain
        bookedSlots,    // Reference ke liye
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE SCHEDULE ──────────────────────────────────────
// Kaam: Doctor ke kisi din ka schedule band karo
export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return next(new ApiError(404, "Schedule not found"));
    }

    res.status(200).json(
      new ApiResponse(200, "Schedule deleted", null)
    );
  } catch (error) {
    next(error);
  }
};