const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getDoctors,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorById,
  seedDoctors,
  getDoctorDashboardStats,
  getDoctorPatients,
  getDoctorAvailability,
  updateDoctorAvailability,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", getDoctors);
router.get("/profile", protect, getDoctorProfile);
router.put("/profile", protect, updateDoctorProfile);
router.get("/dashboard-stats", protect, getDoctorDashboardStats);
router.get("/patients", protect, getDoctorPatients);
router.get("/availability", protect, getDoctorAvailability);
router.put("/availability", protect, updateDoctorAvailability);
router.get("/:id", getDoctorById);
router.post("/seed", seedDoctors);

module.exports = router;

