const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getDoctorApplications,
  getDoctorVerificationDetails,
  approveDoctor,
  rejectDoctor,
  getAdminDoctors,
  getAdminDoctorDetails,
  updateDoctorStatusAdmin,
  getAdminInterpreters,
  getAdminInterpreterDetails,
  updateInterpreterStatusAdmin,
  getAdminAppointments,
  getAdminAppointmentDetails,
  updateAppointmentStatusAdmin,
  getAdminAnalytics,
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Dashboard & Analytics statistics
router.get("/dashboard", getDashboardStats);
router.get("/analytics", getAdminAnalytics);

// Appointments management endpoints
router.get("/appointments", getAdminAppointments);
router.get("/appointments/:id", getAdminAppointmentDetails);
router.patch("/appointments/:id/status", updateAppointmentStatusAdmin);

// User management endpoints
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.patch("/users/:id/status", updateUserStatus);

// Doctor management endpoints
router.get("/doctors", (req, res, next) => {
  if (
    req.query.status === "pending" ||
    req.query.status === "rejected" ||
    req.query.view === "verification"
  ) {
    return getDoctorApplications(req, res, next);
  }
  return getAdminDoctors(req, res, next);
});
router.get("/doctors/applications", getDoctorApplications);
router.get("/doctors/pending", (req, res, next) => {
  req.query.status = "pending";
  return getDoctorApplications(req, res, next);
});
router.get("/doctors/:id", getAdminDoctorDetails);
router.patch("/doctors/:id/status", updateDoctorStatusAdmin);
router.patch("/doctors/:id/approve", approveDoctor);
router.patch("/doctors/:id/reject", rejectDoctor);

// Interpreter management endpoints
router.get("/interpreters", getAdminInterpreters);
router.get("/interpreters/:id", getAdminInterpreterDetails);
router.patch("/interpreters/:id/status", updateInterpreterStatusAdmin);

module.exports = router;
