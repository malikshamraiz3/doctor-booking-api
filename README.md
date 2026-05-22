# 🏥 Doctor Appointment Booking API

A production-ready REST API built with Node.js, TypeScript, Express and MongoDB Atlas.

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** JWT (Access + Refresh Tokens)
- **Validation:** Zod

## ✨ Features
- Role based authentication (Patient, Admin)
- Doctor management with search & filters
- Weekly schedule management
- Appointment booking with slot conflict detection
- Prescription management
- Reviews & auto rating calculation

## 🚀 Setup & Installation

1. Clone the repo
   git clone https://github.com/malikshamraiz3/doctor-booking-api.git

2. Install dependencies
   npm install

3. Create .env file
   cp .env.example .env

4. Add your environment variables in .env

5. Run development server
   npm run dev

## 📡 API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- GET  /api/auth/me

### Doctors
- GET    /api/doctors
- GET    /api/doctors/:id
- POST   /api/doctors (admin)
- PUT    /api/doctors/:id (admin)
- DELETE /api/doctors/:id (admin)

### Schedules
- GET  /api/schedules/doctor/:doctorId
- GET  /api/schedules/slots/:doctorId?date=YYYY-MM-DD
- POST /api/schedules (admin)

### Appointments
- POST   /api/appointments
- GET    /api/appointments/my
- GET    /api/appointments/:id
- PATCH  /api/appointments/:id/cancel
- PATCH  /api/appointments/:id/status (admin)

### Prescriptions
- POST /api/prescriptions (admin)
- GET  /api/prescriptions/my
- GET  /api/prescriptions/appointment/:appointmentId

### Reviews
- POST   /api/reviews
- GET    /api/reviews/doctor/:doctorId
- DELETE /api/reviews/:id (admin)