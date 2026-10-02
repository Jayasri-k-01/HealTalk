const express = require("express");
const router = express.Router();
const {
  getDoctorPrescriptions,
  createPrescription,
  getPrescriptionById,
  updatePrescriptionStatus,
} = require("../controllers/prescriptionController");
const { protect } = require("../middleware/authMiddleware");

// All prescription routes require JWT authentication
router.use(protect);

// GET /api/prescriptions - Fetch doctor prescriptions
router.get("/", getDoctorPrescriptions);

// POST /api/prescriptions - Create a new prescription
router.post("/", createPrescription);

// GET /api/prescriptions/:id - Fetch single prescription
router.get("/:id", getPrescriptionById);

// PATCH /api/prescriptions/:id/status - Update prescription status
router.patch("/:id/status", updatePrescriptionStatus);

module.exports = router;
