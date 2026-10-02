const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

// POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      date,
      time,
      type,
      interpreterRequested,
      interpreterLanguage,
      reason,
    } = req.body;

    if (!doctorId || !date || !time || !reason) {
      return res.status(400).json({ message: "Please provide doctor, date, time, and reason" });
    }

    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      // Check User model if doctor was registered as a User
      const docUser = await User.findOne({ _id: doctorId, role: "doctor" });
      if (docUser) {
        doctor = {
          _id: docUser._id,
          name: docUser.name,
          specialty: "General Physician",
        };
      }
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check for double-booking slot conflict in MongoDB
    const existingBooking = await Appointment.findOne({
      doctor: doctor._id,
      date,
      time,
      status: { $ne: "Cancelled" },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "This consultation slot is already booked. Please select a different time slot.",
      });
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctor._id,
      doctorName: doctor.name,
      specialty: doctor.specialty || "General Physician",
      date,
      time,
      type: type || "Video Call",
      interpreterRequested: !!interpreterRequested,
      interpreterLanguage: interpreterRequested ? interpreterLanguage : null,
      reason,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully (Pending confirmation)",
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      message: "Failed to book appointment",
      error: error.message,
    });
  }
};

// GET /api/appointments/my
const getPatientAppointments = async (req, res) => {
  try {
    const isDoctor = req.user.role === "doctor";
    let query = { patient: req.user.id };

    if (isDoctor) {
      const userDoc = await User.findById(req.user.id);
      const doctorDoc = await Doctor.findOne({
        $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
      });
      const doctorMatchIds = [req.user.id];
      if (doctorDoc) doctorMatchIds.push(doctorDoc._id);

      query = {
        $or: [
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name email phone language age gender")
      .populate("doctor", "name specialty fee rating languages")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

// PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const isDoctor = req.user.role === "doctor";
    const isAdmin = req.user.role === "admin";
    let appointment;

    if (isAdmin) {
      appointment = await Appointment.findById(req.params.id);
    } else if (isDoctor) {
      const userDoc = await User.findById(req.user.id);
      const doctorDoc = await Doctor.findOne({
        $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
      });
      const doctorMatchIds = [req.user.id];
      if (doctorDoc) doctorMatchIds.push(doctorDoc._id);

      appointment = await Appointment.findOne({
        _id: req.params.id,
        $or: [
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      });
    } else {
      appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.user.id,
      });
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized to cancel" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
};

// GET /api/appointments/doctor - Get all appointments for currently authenticated doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    const doctorDocs = await Doctor.find({
      $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
    });
    const doctorMatchIds = [req.user.id, ...doctorDocs.map((d) => d._id)];

    const query = {
      $or: [
        { doctor: { $in: doctorMatchIds } },
        ...(userDoc?.name
          ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
          : []),
      ],
    };

    const appointments = await Appointment.find(query)
      .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
      .populate("doctor", "name specialty fee rating languages")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      message: "Failed to fetch doctor appointments",
      error: error.message,
    });
  }
};

// GET /api/appointments/:id - Fetch single appointment with patient details & history
const getAppointmentById = async (req, res) => {
  try {
    const isDoctor = req.user.role === "doctor";
    const isAdmin = req.user.role === "admin";
    let appointment;

    if (isAdmin) {
      appointment = await Appointment.findById(req.params.id)
        .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
        .populate("doctor", "name specialty fee rating languages");
    } else if (isDoctor) {
      const userDoc = await User.findById(req.user.id);
      const doctorDocs = await Doctor.find({
        $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
      });
      const doctorMatchIds = [req.user.id, ...doctorDocs.map((d) => d._id)];

      appointment = await Appointment.findOne({
        _id: req.params.id,
        $or: [
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      })
        .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
        .populate("doctor", "name specialty fee rating languages");
    } else {
      appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.user.id,
      })
        .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
        .populate("doctor", "name specialty fee rating languages");
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    // Fetch previous appointment records for this patient
    let previousAppointments = [];
    if (appointment.patient && appointment.patient._id) {
      previousAppointments = await Appointment.find({
        patient: appointment.patient._id,
        _id: { $ne: appointment._id },
      })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      appointment,
      previousAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointment by ID:", error);
    res.status(500).json({
      message: "Failed to fetch appointment details",
      error: error.message,
    });
  }
};

// PUT /api/appointments/:id/complete - Mark appointment as completed
const completeAppointment = async (req, res) => {
  try {
    const isDoctor = req.user.role === "doctor";
    const isAdmin = req.user.role === "admin";
    let appointment;

    if (isAdmin) {
      appointment = await Appointment.findById(req.params.id);
    } else if (isDoctor) {
      const userDoc = await User.findById(req.user.id);
      const doctorDocs = await Doctor.find({
        $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
      });
      const doctorMatchIds = [req.user.id, ...doctorDocs.map((d) => d._id)];

      appointment = await Appointment.findOne({
        _id: req.params.id,
        $or: [
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      });
    } else {
      return res.status(403).json({ message: "Only doctors or admins can mark consultations as completed" });
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    appointment.status = "Completed";
    if (req.body && req.body.notes) {
      appointment.notes = req.body.notes;
    }
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment marked as completed",
      appointment,
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({
      message: "Failed to complete appointment",
      error: error.message,
    });
  }
};

// PUT /api/appointments/:id/interpreter - Request / update interpreter language for appointment
const requestInterpreterForAppointment = async (req, res) => {
  try {
    const { language } = req.body;
    const isDoctor = req.user.role === "doctor";
    const isAdmin = req.user.role === "admin";
    let appointment;

    if (isAdmin) {
      appointment = await Appointment.findById(req.params.id);
    } else if (isDoctor) {
      const userDoc = await User.findById(req.user.id);
      const doctorDocs = await Doctor.find({
        $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
      });
      const doctorMatchIds = [req.user.id, ...doctorDocs.map((d) => d._id)];

      appointment = await Appointment.findOne({
        _id: req.params.id,
        $or: [
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      });
    } else {
      appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.user.id,
      });
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    appointment.interpreterRequested = true;
    if (language) {
      appointment.interpreterLanguage = language;
    }
    await appointment.save();

    res.json({
      success: true,
      message: "Interpreter requested for appointment",
      appointment,
    });
  } catch (error) {
    console.error("Error requesting interpreter:", error);
    res.status(500).json({
      message: "Failed to request interpreter",
      error: error.message,
    });
  }
};

// PUT /api/appointments/:id/confirm - Confirm an appointment (doctor or admin)
const confirmAppointment = async (req, res) => {
  try {
    const isDoctor = req.user.role === "doctor";
    const isAdmin = req.user.role === "admin";
    let appointment;

    if (isAdmin) {
      appointment = await Appointment.findById(req.params.id);
    } else if (isDoctor) {
      const userDoc = await User.findById(req.user.id);
      const doctorDocs = await Doctor.find({
        $or: [{ user: req.user.id }, { name: userDoc?.name }, { _id: req.user.id }],
      });
      const doctorMatchIds = [req.user.id, ...doctorDocs.map((d) => d._id)];

      appointment = await Appointment.findOne({
        _id: req.params.id,
        $or: [
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      });
    } else {
      return res.status(403).json({ message: "Only doctors or administrators can confirm appointments" });
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    appointment.status = "Confirmed";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment confirmed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    res.status(500).json({
      message: "Failed to confirm appointment",
      error: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  getAppointmentById,
  completeAppointment,
  confirmAppointment,
  requestInterpreterForAppointment,
};
