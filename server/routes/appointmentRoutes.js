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
  getAvailableInterpreterRequests,
  getMyInterpreterAssignments,
  acceptInterpreterRequest,
  rejectInterpreterRequest,
} = require("../controllers/appointmentController");

const router = express.Router();

router.use(protect);

router.post("/", createAppointment);
router.get("/my", getPatientAppointments);
router.get("/doctor", getDoctorAppointments);
router.get("/interpreter/requests", getAvailableInterpreterRequests);
router.get("/interpreter/my", getMyInterpreterAssignments);
router.get("/:id", getAppointmentById);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/complete", completeAppointment);
router.put("/:id/confirm", confirmAppointment);
router.put("/:id/interpreter", requestInterpreterForAppointment);
router.put("/:id/interpreter/accept", acceptInterpreterRequest);
router.put("/:id/interpreter/reject", rejectInterpreterRequest);

module.exports = router;
