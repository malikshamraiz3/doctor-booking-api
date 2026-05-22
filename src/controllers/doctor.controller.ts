import { Request, Response, NextFunction } from "express";
import Doctor from "../models/Doctor.model";
import User from "../models/User.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

// ─── CREATE DOCTOR ───────────────────────────────────────
// Kaam: Pehle user account banao, phir us user ka doctor profile
// Sirf admin access kar sakta hai
export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name, email, password, phone, // User fields
      specialization, qualification,
      experience, consultationFee,
      hospital, bio               // Doctor profile fields
    } = req.body;

    // Pehle check karo email already registered toh nahi
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "Email already registered"));
    }

    // Doctor ka login account banao
    // role "patient" ki jagah koi alag role nahi — admin alag manage karta hai
    const user = await User.create({
      name, email, password, phone,
      role: "patient", // Doctor ka apna role nahi, admin manage karta hai
      isVerified: true,
    });

    // Ab us user ka doctor profile banao
    const doctor = await Doctor.create({
      userId: user._id, // User aur Doctor link ho gaye
      specialization,
      qualification: qualification || [],
      experience,
      consultationFee,
      hospital,
      bio: bio || "",
    });

    res.status(201).json(
      new ApiResponse(201, "Doctor created successfully", doctor)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET ALL DOCTORS ─────────────────────────────────────
// Kaam: Saare doctors list karo — filters bhi support karta hai
// Public route — koi bhi dekh sakta hai
export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // URL se filters uthao — e.g., ?specialization=Cardiologist&maxFee=2000
    const { specialization, minFee, maxFee, minRating } = req.query;

    // query object dynamically build karo
    const query: any = { isAvailable: true };

    // Agar filter diya toh add karo — nahi diya toh ignore
    if (specialization) {
      // case-insensitive search — "cardiologist" bhi match karega
      query.specialization = { $regex: specialization, $options: "i" };
    }

    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee); // Greater than equal
      if (maxFee) query.consultationFee.$lte = Number(maxFee); // Less than equal
    }

    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // populate = userId ki jagah actual user data le aao (name, email)
    const doctors = await Doctor.find(query)
      .populate("userId", "name email phone") // Sirf yeh 3 fields chahiye
      .sort({ averageRating: -1 }); // Rating ke hisaab se sort

    res.status(200).json(
      new ApiResponse(200, "Doctors fetched", doctors)
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE DOCTOR ───────────────────────────────────
// Kaam: Ek doctor ki complete profile — URL mein id aati hai
export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.params.id = URL ka :id part — /doctors/abc123 mein "abc123"
    const doctor = await Doctor.findById(req.params.id)
      .populate("userId", "name email phone");

    if (!doctor) {
      return next(new ApiError(404, "Doctor not found"));
    }

    res.status(200).json(
      new ApiResponse(200, "Doctor fetched", doctor)
    );
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE DOCTOR ───────────────────────────────────────
// Kaam: Doctor ki profile update karo — sirf admin
export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // { new: true } = updated document return karo, purana nahi
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true } // runValidators = schema rules check karo
    );

    if (!doctor) {
      return next(new ApiError(404, "Doctor not found"));
    }

    res.status(200).json(
      new ApiResponse(200, "Doctor updated", doctor)
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE DOCTOR ───────────────────────────────────────
// Kaam: Doctor remove karo — uska user account bhi delete hoga
export const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return next(new ApiError(404, "Doctor not found"));
    }

    // Pehle doctor ka user account delete karo
    await User.findByIdAndDelete(doctor.userId);

    // Phir doctor profile delete karo
    await Doctor.findByIdAndDelete(req.params.id);

    res.status(200).json(
      new ApiResponse(200, "Doctor deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};