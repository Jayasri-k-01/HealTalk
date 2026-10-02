const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

// Helper to resolve doctor details and IDs for the authenticated user
const resolveDoctorContext = async (userId) => {
  const userDoc = await User.findById(userId);
  let doctorDoc = await Doctor.findOne({
    $or: [{ user: userId }, { name: userDoc?.name }, { _id: userId }],
  });

  const doctorMatchIds = [userId];
  if (doctorDoc) {
    doctorMatchIds.push(doctorDoc._id);
  }

  const doctorName = doctorDoc?.name || userDoc?.name || "Dr. Elena Rostova";
  const licenseNumber = userDoc?.licenseNumber || "MED-782910";

  return {
    userDoc,
    doctorDoc,
    doctorMatchIds,
    doctorName,
    licenseNumber,
  };
};

// Seed initial prescriptions in MongoDB if empty for the doctor
const seedInitialPrescriptionsIfEmpty = async (doctorCtx) => {
  try {
    const { userDoc, doctorDoc, doctorMatchIds, doctorName, licenseNumber } = doctorCtx;
    const existingCount = await Prescription.countDocuments({
      $or: [
        { doctorUser: userDoc._id },
        { doctor: { $in: doctorMatchIds } },
        { doctorName: { $regex: new RegExp(`^${doctorName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } },
      ],
    });

    if (existingCount > 0) return;

    // Look for existing patient users to link
    let patients = await User.find({ role: "patient" }).limit(5);

    // If fewer than 3 patients exist, create realistic patient accounts
    if (!patients || patients.length < 3) {
      const samplePatients = [
        {
          name: "Robert Fox",
          email: "robert.fox@example.com",
          password: "patientPassword123!",
          role: "patient",
          status: "approved",
          language: "Spanish",
          age: 58,
          gender: "Male",
          bloodGroup: "O+",
          phone: "+1 (555) 234-5678",
        },
        {
          name: "Jane Cooper",
          email: "jane.cooper@example.com",
          password: "patientPassword123!",
          role: "patient",
          status: "approved",
          language: "Spanish",
          age: 34,
          gender: "Female",
          bloodGroup: "A+",
          phone: "+1 (555) 876-5432",
        },
        {
          name: "Devon Lane",
          email: "devon.lane@example.com",
          password: "patientPassword123!",
          role: "patient",
          status: "approved",
          language: "French",
          age: 42,
          gender: "Male",
          bloodGroup: "B+",
          phone: "+1 (555) 345-6789",
        },
        {
          name: "Eleanor Pena",
          email: "eleanor.pena@example.com",
          password: "patientPassword123!",
          role: "patient",
          status: "approved",
          language: "Mandarin",
          age: 29,
          gender: "Female",
          bloodGroup: "AB+",
          phone: "+1 (555) 987-6543",
        },
      ];

      for (const p of samplePatients) {
        let existing = await User.findOne({ email: p.email.toLowerCase() });
        if (!existing) {
          existing = await User.create(p);
        }
      }
      patients = await User.find({ role: "patient" }).limit(5);
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const initialSeedData = [
      {
        prescriptionId: "RX-8902",
        appointmentId: "APT-2026-002",
        patientName: "Robert Fox",
        patientAge: 58,
        patientGender: "Male",
        date: todayStr,
        diagnosis: "Essential Hypertension (Stage 1)",
        outputLanguage: "Spanish",
        status: "Active",
        medicines: [
          {
            name: "Lisinopril",
            dosage: "20 mg",
            frequency: "Once daily (Morning)",
            duration: "90 days",
            instructions: "Take with or without food in the morning. Monitor home BP.",
          },
          {
            name: "Amlodipine Besylate",
            dosage: "5 mg",
            frequency: "Once daily (Evening)",
            duration: "90 days",
            instructions: "Take before bedtime. Report any lower extremity swelling.",
          },
        ],
        notes: "Follow up in 4 weeks with home blood pressure logs. Avoid high sodium intake.",
      },
      {
        prescriptionId: "RX-8821",
        appointmentId: "APT-2026-001",
        patientName: "Jane Cooper",
        patientAge: 34,
        patientGender: "Female",
        date: todayStr,
        diagnosis: "Post-op Cardiac Rehab Maintenance",
        outputLanguage: "Spanish",
        status: "Active",
        medicines: [
          {
            name: "Atorvastatin",
            dosage: "20 mg",
            frequency: "Once daily at bedtime",
            duration: "30 days",
            instructions: "Take nightly. Avoid grapefruit juice.",
          },
          {
            name: "Metoprolol Succinate ER",
            dosage: "25 mg",
            frequency: "Once daily",
            duration: "30 days",
            instructions: "Take with food in the morning. Do not discontinue abruptly.",
          },
        ],
        notes: "Continue scheduled cardiac physical therapy 3 times weekly.",
      },
      {
        prescriptionId: "RX-8791",
        appointmentId: "APT-2026-003",
        patientName: "Devon Lane",
        patientAge: 42,
        patientGender: "Male",
        date: "2026-09-20",
        diagnosis: "Hypertension (ACE-inhibitor replacement)",
        outputLanguage: "French",
        status: "Active",
        medicines: [
          {
            name: "Losartan Potassium",
            dosage: "50 mg",
            frequency: "Once daily",
            duration: "60 days",
            instructions: "Switched from Lisinopril due to dry cough. Drink plenty of water.",
          },
        ],
        notes: "Check serum potassium and creatinine in 2 months.",
      },
      {
        prescriptionId: "RX-8620",
        appointmentId: "APT-2026-004",
        patientName: "Eleanor Pena",
        patientAge: 29,
        patientGender: "Female",
        date: "2026-09-15",
        diagnosis: "Episodic Migraine without Aura",
        outputLanguage: "Mandarin",
        status: "Active",
        medicines: [
          {
            name: "Sumatriptan Succinate",
            dosage: "50 mg",
            frequency: "As needed at onset of headache",
            duration: "9 tablets (PRN)",
            instructions: "Take 1 tablet at first sign of migraine. May repeat once after 2 hours if needed (max 200mg/24h).",
          },
          {
            name: "Topiramate",
            dosage: "25 mg",
            frequency: "Once daily at bedtime",
            duration: "30 days",
            instructions: "Preventative dose titration. Increase hydration.",
          },
        ],
        notes: "Maintain electronic headache trigger diary.",
      },
      {
        prescriptionId: "RX-8410",
        appointmentId: "APT-2026-005",
        patientName: "Leslie Alexander",
        patientAge: 65,
        patientGender: "Female",
        date: "2026-09-08",
        diagnosis: "Mixed Hyperlipidemia & Atherosclerosis Prophylaxis",
        outputLanguage: "English",
        status: "Completed",
        medicines: [
          {
            name: "Rosuvastatin Calcium",
            dosage: "10 mg",
            frequency: "Once daily",
            duration: "90 days",
            instructions: "Take in the evening with water.",
          },
          {
            name: "Aspirin (Enteric Coated)",
            dosage: "81 mg",
            frequency: "Once daily with breakfast",
            duration: "90 days",
            instructions: "Low dose cardioprotective therapy.",
          },
        ],
        notes: "Repeat fasting lipid panel before renewal.",
      },
    ];

    for (let i = 0; i < initialSeedData.length; i++) {
      const item = initialSeedData[i];
      const matchedPatient =
        patients.find((p) => p.name.toLowerCase() === item.patientName.toLowerCase()) ||
        patients[i % patients.length];

      const exists = await Prescription.findOne({ prescriptionId: item.prescriptionId });
      if (!exists) {
        await Prescription.create({
          ...item,
          patient: matchedPatient._id,
          doctor: doctorDoc?._id || userDoc._id,
          doctorUser: userDoc._id,
          doctorName: doctorName,
          licenseNumber: licenseNumber,
        });
      }
    }

    console.log(`Prescriptions checked/seeded successfully in MongoDB for doctor: ${doctorName}`);
  } catch (seedErr) {
    console.error("Error seeding initial prescriptions:", seedErr.message);
  }
};

// GET /api/prescriptions - Fetch prescriptions for authenticated doctor or patient
const getDoctorPrescriptions = async (req, res) => {
  try {
    const isPatient = req.user.role === "patient";

    if (isPatient) {
      const patientId = req.user.id;
      const userDoc = await User.findById(patientId);
      const query = {
        $or: [
          { patient: patientId },
          ...(userDoc?.email ? [{ patientEmail: userDoc.email }] : []),
          ...(userDoc?.name
            ? [{ patientName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      };

      const prescriptions = await Prescription.find(query)
        .populate("doctor", "name specialty")
        .sort({ createdAt: -1 });

      const formattedList = prescriptions.map((rx) => {
        return {
          _id: rx._id,
          id: rx.prescriptionId || `RX-${String(rx._id).slice(-4).toUpperCase()}`,
          prescriptionId: rx.prescriptionId,
          appointmentId: rx.appointmentId,
          patientName: rx.patientName || userDoc?.name || "Patient",
          date: rx.date,
          diagnosis: rx.diagnosis,
          outputLanguage: rx.outputLanguage || "English",
          status: rx.status || "Active",
          medicines: rx.medicines || [],
          notes: rx.notes || "",
          doctorName: rx.doctorName || "Doctor",
          licenseNumber: rx.licenseNumber || "",
          createdAt: rx.createdAt,
        };
      });

      return res.json({
        success: true,
        count: formattedList.length,
        prescriptions: formattedList,
      });
    }

    const doctorCtx = await resolveDoctorContext(req.user.id);
    await seedInitialPrescriptionsIfEmpty(doctorCtx);

    const { userDoc, doctorMatchIds, doctorName } = doctorCtx;

    const query = {
      $or: [
        { doctorUser: userDoc._id },
        { doctor: { $in: doctorMatchIds } },
        ...(doctorName
          ? [{ doctorName: { $regex: new RegExp(`^${doctorName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
          : []),
      ],
    };

    const prescriptions = await Prescription.find(query)
      .populate("patient", "name email phone language age gender bloodGroup")
      .populate("appointment", "date time reason")
      .sort({ createdAt: -1 });

    const formattedList = prescriptions.map((rx) => {
      const patientObj = rx.patient && typeof rx.patient === "object" ? rx.patient : {};
      return {
        _id: rx._id,
        id: rx.prescriptionId || `RX-${String(rx._id).slice(-4).toUpperCase()}`,
        prescriptionId: rx.prescriptionId,
        appointmentId: rx.appointmentId || (rx.appointment ? String(rx.appointment._id) : ""),
        patientId: patientObj._id ? String(patientObj._id) : (rx.patient ? String(rx.patient) : ""),
        patientName: rx.patientName || patientObj.name || "Patient",
        patientAge: rx.patientAge || patientObj.age || 35,
        patientGender: rx.patientGender || patientObj.gender || "Not specified",
        patientEmail: patientObj.email || "",
        patientLanguage: patientObj.language || rx.outputLanguage || "English",
        date: rx.date,
        diagnosis: rx.diagnosis,
        outputLanguage: rx.outputLanguage || "English",
        status: rx.status || "Active",
        medicines: rx.medicines || [],
        notes: rx.notes || "",
        doctorName: rx.doctorName || doctorName,
        licenseNumber: rx.licenseNumber || doctorCtx.licenseNumber,
        createdAt: rx.createdAt,
      };
    });

    res.json({
      success: true,
      count: formattedList.length,
      prescriptions: formattedList,
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

// POST /api/prescriptions - Create & save new prescription in MongoDB
const createPrescription = async (req, res) => {
  try {
    const doctorCtx = await resolveDoctorContext(req.user.id);
    const { userDoc, doctorDoc, doctorName, licenseNumber } = doctorCtx;

    const {
      patientId,
      patientName,
      appointmentId,
      date,
      diagnosis,
      outputLanguage,
      status,
      medicines,
      notes,
    } = req.body;

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        success: false,
        message: "Clinical diagnosis is required",
      });
    }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one prescribed medicine is required",
      });
    }

    const invalidMed = medicines.some((m) => !m.name || !m.name.trim() || !m.dosage || !m.dosage.trim());
    if (invalidMed) {
      return res.status(400).json({
        success: false,
        message: "Each medication must include a name and dosage",
      });
    }

    // Resolve Patient User
    let patientUser = null;
    if (patientId) {
      // Check if patientId is valid ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(patientId)) {
        patientUser = await User.findById(patientId);
      }
    }

    if (!patientUser && patientName) {
      patientUser = await User.findOne({
        name: { $regex: new RegExp(`^${patientName.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") },
        role: "patient",
      });
    }

    // If patient not in DB, create one or fallback
    if (!patientUser) {
      const generatedEmail = `patient.${Date.now()}@healtalk.com`;
      patientUser = await User.create({
        name: patientName ? patientName.trim() : "Patient",
        email: generatedEmail,
        password: "DefaultPatient123!",
        role: "patient",
        status: "approved",
        language: outputLanguage || "English",
        age: 35,
        gender: "Not specified",
      });
    }

    // Generate unique prescription ID
    let generatedRxId = `RX-${Math.floor(1000 + Math.random() * 9000)}`;
    let collisionCheck = await Prescription.findOne({ prescriptionId: generatedRxId });
    while (collisionCheck) {
      generatedRxId = `RX-${Math.floor(1000 + Math.random() * 9000)}`;
      collisionCheck = await Prescription.findOne({ prescriptionId: generatedRxId });
    }

    const formattedMedicines = medicines.map((m) => ({
      name: m.name.trim(),
      dosage: m.dosage.trim(),
      frequency: m.frequency ? m.frequency.trim() : "Once daily",
      duration: m.duration ? m.duration.trim() : "30 days",
      instructions: m.instructions ? m.instructions.trim() : "Take as directed",
    }));

    // Find linked appointment if any
    let linkedAppointment = null;
    if (appointmentId && /^[0-9a-fA-F]{24}$/.test(appointmentId)) {
      linkedAppointment = await Appointment.findById(appointmentId);
    }

    const newPrescription = await Prescription.create({
      prescriptionId: generatedRxId,
      doctor: doctorDoc?._id || userDoc._id,
      doctorUser: userDoc._id,
      doctorName: doctorName,
      licenseNumber: licenseNumber,
      patient: patientUser._id,
      patientName: patientUser.name || patientName || "Patient",
      patientAge: patientUser.age || 35,
      patientGender: patientUser.gender || "Not specified",
      appointment: linkedAppointment?._id,
      appointmentId: appointmentId || (linkedAppointment ? String(linkedAppointment._id) : `APT-2026-${Math.floor(100 + Math.random() * 900)}`),
      date: date || new Date().toISOString().split("T")[0],
      diagnosis: diagnosis.trim(),
      outputLanguage: outputLanguage || patientUser.language || "Spanish",
      status: status || "Active",
      medicines: formattedMedicines,
      notes: notes ? notes.trim() : "",
    });

    // If appointment is present, optionally update appointment status & clinical notes
    if (linkedAppointment) {
      if (linkedAppointment.status !== "Completed") {
        linkedAppointment.status = "Completed";
      }
      if (notes) {
        linkedAppointment.notes = linkedAppointment.notes
          ? `${linkedAppointment.notes} | Rx Issued: ${generatedRxId}`
          : `Rx Issued: ${generatedRxId} (${diagnosis.trim()})`;
      }
      await linkedAppointment.save();
    }

    const responsePayload = {
      _id: newPrescription._id,
      id: newPrescription.prescriptionId,
      prescriptionId: newPrescription.prescriptionId,
      appointmentId: newPrescription.appointmentId,
      patientId: String(patientUser._id),
      patientName: newPrescription.patientName,
      patientAge: newPrescription.patientAge,
      patientGender: newPrescription.patientGender,
      patientLanguage: patientUser.language || newPrescription.outputLanguage,
      date: newPrescription.date,
      diagnosis: newPrescription.diagnosis,
      outputLanguage: newPrescription.outputLanguage,
      status: newPrescription.status,
      medicines: newPrescription.medicines,
      notes: newPrescription.notes,
      doctorName: newPrescription.doctorName,
      licenseNumber: newPrescription.licenseNumber,
      createdAt: newPrescription.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Prescription issued and saved to MongoDB successfully",
      prescription: responsePayload,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to issue prescription",
      error: error.message,
    });
  }
};

// GET /api/prescriptions/:id - Get single prescription with authorization check
const getPrescriptionById = async (req, res) => {
  try {
    const rxId = req.params.id;
    const doctorCtx = await resolveDoctorContext(req.user.id);
    const { userDoc, doctorMatchIds, doctorName } = doctorCtx;

    let prescription = null;
    if (/^[0-9a-fA-F]{24}$/.test(rxId)) {
      prescription = await Prescription.findById(rxId).populate("patient", "name email language age gender");
    }

    if (!prescription) {
      prescription = await Prescription.findOne({ prescriptionId: rxId }).populate("patient", "name email language age gender");
    }

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Security Check: prevent doctor from viewing another doctor's prescriptions unless admin
    const isAdmin = req.user.role === "admin";
    const isPatient = String(prescription.patient?._id || prescription.patient) === String(req.user.id);
    const isDoctorOwner =
      String(prescription.doctorUser) === String(userDoc._id) ||
      doctorMatchIds.some((id) => String(id) === String(prescription.doctor)) ||
      (prescription.doctorName && prescription.doctorName.toLowerCase() === doctorName.toLowerCase());

    if (!isAdmin && !isPatient && !isDoctorOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied: this prescription belongs to another healthcare provider",
      });
    }

    res.json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error("Error fetching prescription details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
};

// PATCH /api/prescriptions/:id/status - Update prescription status
const updatePrescriptionStatus = async (req, res) => {
  try {
    const rxId = req.params.id;
    const { status } = req.body;
    const doctorCtx = await resolveDoctorContext(req.user.id);
    const { userDoc, doctorMatchIds, doctorName } = doctorCtx;

    let prescription = null;
    if (/^[0-9a-fA-F]{24}$/.test(rxId)) {
      prescription = await Prescription.findById(rxId);
    }
    if (!prescription) {
      prescription = await Prescription.findOne({ prescriptionId: rxId });
    }

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    // Ownership check
    const isDoctorOwner =
      String(prescription.doctorUser) === String(userDoc._id) ||
      doctorMatchIds.some((id) => String(id) === String(prescription.doctor)) ||
      (prescription.doctorName && prescription.doctorName.toLowerCase() === doctorName.toLowerCase());

    if (!isDoctorOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (status) {
      prescription.status = status;
      await prescription.save();
    }

    res.json({
      success: true,
      message: "Prescription status updated",
      prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update prescription status",
      error: error.message,
    });
  }
};

module.exports = {
  getDoctorPrescriptions,
  createPrescription,
  getPrescriptionById,
  updatePrescriptionStatus,
};
