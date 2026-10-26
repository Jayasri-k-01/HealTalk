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
      .populate("interpreter", "name email phone language languages qualification experience specialization")
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
    if (appointment.interpreterStatus === "Requested" || appointment.interpreterStatus === "Accepted") {
      appointment.interpreterStatus = "Cancelled";
    }
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
      .populate("interpreter", "name email phone language languages qualification experience specialization")
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
    const isInterpreter = req.user.role === "interpreter";
    let appointment;

    if (isAdmin) {
      appointment = await Appointment.findById(req.params.id)
        .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
        .populate("doctor", "name specialty fee rating languages")
        .populate("interpreter", "name email phone language languages qualification experience specialization");
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
        .populate("doctor", "name specialty fee rating languages")
        .populate("interpreter", "name email phone language languages qualification experience specialization");
    } else if (isInterpreter) {
      appointment = await Appointment.findOne({
        _id: req.params.id,
        $or: [
          { interpreter: req.user.id },
          { interpreterRequested: true, interpreterStatus: "Requested" },
        ],
      })
        .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
        .populate("doctor", "name specialty fee rating languages")
        .populate("interpreter", "name email phone language languages qualification experience specialization");
    } else {
      appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.user.id,
      })
        .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals")
        .populate("doctor", "name specialty fee rating languages")
        .populate("interpreter", "name email phone language languages qualification experience specialization");
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
    if (appointment.interpreterStatus === "Accepted" || appointment.interpreterStatus === "Active") {
      appointment.interpreterStatus = "Completed";
    }
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

    if (!language || !language.trim()) {
      return res.status(400).json({ message: "Please select a required interpreter language" });
    }

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

    if (appointment.status === "Cancelled" || appointment.status === "Completed") {
      return res.status(400).json({
        message: `Cannot request interpreter for a ${appointment.status.toLowerCase()} appointment.`,
      });
    }

    // Check duplicate request
    if (
      appointment.interpreterRequested &&
      (appointment.interpreterStatus === "Requested" || appointment.interpreterStatus === "Accepted") &&
      appointment.interpreterLanguage?.toLowerCase() === language.trim().toLowerCase()
    ) {
      return res.status(400).json({
        message: `An interpreter request for ${appointment.interpreterLanguage} is already active for this appointment.`,
      });
    }

    appointment.interpreterRequested = true;
    appointment.interpreterLanguage = language.trim();
    appointment.interpreterStatus = "Requested";
    appointment.interpreter = null;
    appointment.interpreterAssignedAt = null;
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "name email phone language age gender")
      .populate("doctor", "name specialty fee rating languages")
      .populate("interpreter", "name email phone language languages qualification experience specialization");

    res.json({
      success: true,
      message: `Interpreter requested for ${language.trim()}`,
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error requesting interpreter:", error);
    res.status(500).json({
      message: "Failed to request interpreter",
      error: error.message,
    });
  }
};

// GET /api/appointments/interpreter/requests - List available requests matching interpreter's supported languages
const getAvailableInterpreterRequests = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc || userDoc.role !== "interpreter") {
      return res.status(403).json({ message: "Access restricted to authenticated interpreters" });
    }

    // Extract interpreter's supported languages
    const supportedLanguages = new Set();
    if (userDoc.language) {
      userDoc.language.split(",").forEach((l) => supportedLanguages.add(l.trim().toLowerCase()));
    }
    if (Array.isArray(userDoc.languages)) {
      userDoc.languages.forEach((l) => supportedLanguages.add(l.trim().toLowerCase()));
    }

    // Availability check: if interpreter is Busy or Offline, they are not eligible for new matching requests
    const availabilityStatus = userDoc.availabilityStatus || "Available";
    if (availabilityStatus !== "Available") {
      return res.json({
        success: true,
        count: 0,
        requests: [],
        availabilityStatus,
        supportedLanguages: Array.from(supportedLanguages),
        message: `New matching requests are paused because your status is currently set to ${availabilityStatus}. Switch to Available in My Profile to receive requests.`,
      });
    }

    // Find all pending interpreter requests
    const query = {
      interpreterRequested: true,
      interpreterStatus: "Requested",
      status: { $in: ["Confirmed", "Pending", "In Progress"] },
      interpreter: null,
    };

    const allRequests = await Appointment.find(query)
      .populate("patient", "name email phone language age gender")
      .populate("doctor", "name specialty fee rating languages hospital")
      .sort({ createdAt: -1 });

    // Filter by matching language
    const matchingRequests = allRequests.filter((apt) => {
      if (!apt.interpreterLanguage) return false;
      const targetLang = apt.interpreterLanguage.toLowerCase().trim();
      return supportedLanguages.has(targetLang) || Array.from(supportedLanguages).some(sl => sl.includes(targetLang) || targetLang.includes(sl));
    });

    res.json({
      success: true,
      count: matchingRequests.length,
      requests: matchingRequests,
      supportedLanguages: Array.from(supportedLanguages),
    });
  } catch (error) {
    console.error("Error fetching available interpreter requests:", error);
    res.status(500).json({
      message: "Failed to fetch interpreter requests",
      error: error.message,
    });
  }
};

// GET /api/appointments/interpreter/my - List appointments assigned to the logged-in interpreter
const getMyInterpreterAssignments = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc || userDoc.role !== "interpreter") {
      return res.status(403).json({ message: "Access restricted to authenticated interpreters" });
    }

    const assignments = await Appointment.find({
      interpreter: req.user.id,
    })
      .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions")
      .populate("doctor", "name specialty fee rating languages hospital")
      .populate("interpreter", "name email phone language languages qualification experience specialization")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      appointments: assignments,
    });
  } catch (error) {
    console.error("Error fetching interpreter assignments:", error);
    res.status(500).json({
      message: "Failed to fetch your interpreter assignments",
      error: error.message,
    });
  }
};

// PUT /api/appointments/:id/interpreter/accept - Accept an interpreter request
const acceptInterpreterRequest = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc || userDoc.role !== "interpreter") {
      return res.status(403).json({ message: "Only certified interpreters can accept interpreter requests" });
    }

    if (userDoc.status !== "approved") {
      return res.status(403).json({ message: "Your interpreter account is pending approval or inactive." });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "Cancelled" || appointment.status === "Completed") {
      return res.status(400).json({
        message: `Cannot accept request for a ${appointment.status.toLowerCase()} appointment.`,
      });
    }

    if (!appointment.interpreterRequested) {
      return res.status(400).json({ message: "No interpreter was requested for this appointment." });
    }

    if (appointment.interpreterStatus === "Accepted" && appointment.interpreter) {
      if (appointment.interpreter.toString() === req.user.id) {
        return res.json({
          success: true,
          message: "You have already accepted this request.",
          appointment,
        });
      }
      return res.status(400).json({ message: "This interpreter request has already been accepted by another interpreter." });
    }

    // Verify language eligibility
    const supportedLanguages = new Set();
    if (userDoc.language) {
      userDoc.language.split(",").forEach((l) => supportedLanguages.add(l.trim().toLowerCase()));
    }
    if (Array.isArray(userDoc.languages)) {
      userDoc.languages.forEach((l) => supportedLanguages.add(l.trim().toLowerCase()));
    }

    const targetLang = (appointment.interpreterLanguage || "").toLowerCase().trim();
    const isEligible = supportedLanguages.has(targetLang) || Array.from(supportedLanguages).some(sl => sl.includes(targetLang) || targetLang.includes(sl));

    if (!isEligible) {
      return res.status(403).json({
        message: `You are not registered for the requested language (${appointment.interpreterLanguage}). Your registered languages: ${Array.from(supportedLanguages).join(", ")}`,
      });
    }

    appointment.interpreter = req.user.id;
    appointment.interpreterStatus = "Accepted";
    appointment.interpreterAssignedAt = new Date();
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "name email phone language age gender")
      .populate("doctor", "name specialty fee rating languages")
      .populate("interpreter", "name email phone language languages qualification experience specialization");

    res.json({
      success: true,
      message: `Interpreter request accepted! You are now assigned to provide ${appointment.interpreterLanguage} translation.`,
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error accepting interpreter request:", error);
    res.status(500).json({
      message: "Failed to accept interpreter request",
      error: error.message,
    });
  }
};

// PUT /api/appointments/:id/interpreter/reject - Decline or release an interpreter request
const rejectInterpreterRequest = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc || userDoc.role !== "interpreter") {
      return res.status(403).json({ message: "Only interpreters can decline or release assignments" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // If this interpreter was assigned, release the assignment back to 'Requested' so another interpreter can accept
    if (appointment.interpreter && appointment.interpreter.toString() === req.user.id) {
      appointment.interpreter = null;
      appointment.interpreterStatus = "Requested";
      appointment.interpreterAssignedAt = null;
      await appointment.save();
    }

    res.json({
      success: true,
      message: "Interpreter assignment released. The request is now available for other interpreters.",
      appointment,
    });
  } catch (error) {
    console.error("Error rejecting interpreter request:", error);
    res.status(500).json({
      message: "Failed to decline interpreter request",
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
  getAvailableInterpreterRequests,
  getMyInterpreterAssignments,
  acceptInterpreterRequest,
  rejectInterpreterRequest,
};
