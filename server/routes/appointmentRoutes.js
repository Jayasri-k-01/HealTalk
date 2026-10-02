const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  getAppointmentById,
  completeAppointment,
  confirmAppointment,
  requestInterpreterForAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

router.use(protect);

router.post("/", createAppointment);
router.get("/my", getPatientAppointments);
router.get("/doctor", getDoctorAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/complete", completeAppointment);
router.put("/:id/confirm", confirmAppointment);
router.put("/:id/interpreter", requestInterpreterForAppointment);

module.exports = router;
