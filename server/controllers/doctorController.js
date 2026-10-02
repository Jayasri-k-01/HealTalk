const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");

const SAMPLE_DOCTORS_SEED = [
  {
    name: "Dr. Rajesh Sharma",
    specialty: "Cardiology",
    languages: ["English", "Hindi", "Punjabi"],
    rating: 4.9,
    reviews: 124,
    experience: "12 years exp",
    fee: "$45",
    bio: "Senior Consultant Cardiologist specializing in preventive heart health and telemedicine.",
    availableSlots: ["Today 4:00 PM", "Today 6:30 PM", "Tomorrow 10:00 AM"],
  },
  {
    name: "Dr. Elena Rostova",
    specialty: "General Physician",
    languages: ["English", "Spanish", "Russian"],
    rating: 4.95,
    reviews: 182,
    experience: "15 years exp",
    fee: "$40",
    bio: "Primary care practitioner dedicated to family medicine and cross-language healthcare.",
    availableSlots: ["Today 4:30 PM", "Tomorrow 11:00 AM", "Tomorrow 3:00 PM"],
  },
  {
    name: "Dr. Marie Laurent",
    specialty: "Pediatrics",
    languages: ["English", "French", "Spanish"],
    rating: 4.8,
    reviews: 98,
    experience: "9 years exp",
    fee: "$50",
    bio: "Compassionate pediatrician providing multilingual care for children and toddlers.",
    availableSlots: ["Tomorrow 10:00 AM", "Tomorrow 2:00 PM", "Sep 12 9:30 AM"],
  },
  {
    name: "Dr. Sophia Chen",
    specialty: "Dermatology",
    languages: ["English", "Mandarin", "Cantonese"],
    rating: 4.9,
    reviews: 156,
    experience: "14 years exp",
    fee: "$60",
    bio: "Board-certified dermatologist expert in skin wellness, acne, and tele-dermatology.",
    availableSlots: ["Today 5:30 PM", "Tomorrow 2:30 PM", "Sep 12 11:00 AM"],
  },
  {
    name: "Dr. Alejandro Gomez",
    specialty: "Neurology",
    languages: ["English", "Spanish"],
    rating: 4.85,
    reviews: 87,
    experience: "11 years exp",
    fee: "$70",
    bio: "Neurologist focusing on headache management, nerve care, and remote diagnosis.",
    availableSlots: ["Tomorrow 1:00 PM", "Sep 12 4:00 PM"],
  },
  {
    name: "Dr. Ananya Iyer",
    specialty: "Psychiatry",
    languages: ["English", "Tamil", "Hindi"],
    rating: 4.92,
    reviews: 140,
    experience: "10 years exp",
    fee: "$55",
    bio: "Mindfulness and mental health specialist offering tele-consultations in multiple languages.",
    availableSlots: ["Today 7:00 PM", "Tomorrow 4:00 PM"],
  },
];

// Helper to seed doctors if empty
const seedDoctorsIfEmpty = async () => {
  try {
    const count = await Doctor.countDocuments();
    if (count === 0) {
      console.log("Seeding initial doctors into MongoDB...");
      await Doctor.insertMany(SAMPLE_DOCTORS_SEED);
    }
  } catch (err) {
    console.error("Auto seeding error:", err);
  }
};

// GET /api/doctors
const getDoctors = async (req, res) => {
  try {
    await seedDoctorsIfEmpty();

    const { search, specialty, language } = req.query;
    let query = {};

    if (search && search.trim() !== "") {
      const cleanSearch = search.trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: "i" } },
        { specialty: { $regex: cleanSearch, $options: "i" } },
        { bio: { $regex: cleanSearch, $options: "i" } },
      ];
    }

    if (specialty && specialty.trim() !== "" && specialty !== "All Specialties") {
      query.specialty = { $regex: specialty.trim(), $options: "i" };
    }

    if (language && language.trim() !== "" && language !== "All Languages") {
      query.languages = { $regex: language.trim(), $options: "i" };
    }

    let doctors = await Doctor.find(query).sort({ rating: -1 });

    // Also check for registered doctor users and include them if missing
    try {
      const doctorUsers = await User.find({ role: "doctor" });
      if (doctorUsers && doctorUsers.length > 0) {
        const existingNames = new Set(doctors.map((d) => d.name.toLowerCase()));
        for (const docUser of doctorUsers) {
          if (!existingNames.has(docUser.name.toLowerCase())) {
            doctors.push({
              _id: docUser._id,
              name: docUser.name,
              specialty: "General Physician",
              languages: [docUser.language || "English"],
              rating: 4.9,
              reviews: 12,
              experience: "Verified Practitioner",
              fee: "$45",
              bio: `Verified HealTalk ${docUser.language || "English"} Healthcare Practitioner.`,
              availableSlots: ["Today 4:00 PM", "Tomorrow 10:00 AM"],
            });
          }
        }
      }
    } catch (e) {
      console.error("Error reading doctor users:", e);
    }

    res.json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      message: "Failed to fetch doctors",
      error: error.message,
    });
  }
};

// GET /api/doctors/profile
const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let doctor = await Doctor.findOne({ $or: [{ user: userId }, { name: userDoc.name }] });

    if (!doctor) {
      doctor = await Doctor.create({
        user: userDoc._id,
        name: userDoc.name || "Doctor",
        specialty: userDoc.specialization || "General Physician",
        languages: userDoc.language ? [userDoc.language] : ["English"],
        experience: userDoc.experience || "10 years exp",
        fee: "$45",
        bio: `Verified HealTalk ${userDoc.language || "English"} Healthcare Practitioner.`,
        availableSlots: ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"],
      });
    } else if (!doctor.user) {
      doctor.user = userDoc._id;
      await doctor.save();
    }

    const verificationStatus =
      userDoc.status === "approved" || userDoc.isVerified
        ? "Verified Doctor"
        : userDoc.status === "rejected"
        ? "Rejected"
        : "Pending Verification";

    const languagesArray =
      Array.isArray(doctor.languages) && doctor.languages.length > 0
        ? doctor.languages
        : [userDoc.language || "English"];

    const qualificationText = userDoc.qualification || "MD";
    const specialtyText = doctor.specialty || userDoc.specialization || "General Physician";
    const hospitalText = userDoc.hospital || "HealTalk Medical Network";
    const experienceText = doctor.experience || userDoc.experience || "10 years exp";
    const feeText = doctor.fee || "$45";
    const licenseNumberText = userDoc.licenseNumber || "MED-VERIFIED";

    const profileData = {
      _id: doctor._id,
      userId: userDoc._id,
      name: doctor.name || userDoc.name,
      email: userDoc.email,
      phone: userDoc.phone || "",
      specialty: specialtyText,
      specialization: specialtyText,
      qualification: qualificationText,
      title: `${qualificationText} • ${specialtyText}`,
      experience: experienceText,
      experienceYears: experienceText.includes("exp") || experienceText.includes("year") ? experienceText : `${experienceText} years experience`,
      licenseNumber: licenseNumberText,
      npiNumber: licenseNumberText.startsWith("NPI-") ? licenseNumberText : `NPI-${licenseNumberText.replace(/[^0-9A-Za-z]/g, "") || "1982048190"}`,
      hospital: hospitalText,
      hospitalAffiliation: hospitalText,
      languages: languagesArray,
      languagesSpoken: languagesArray,
      fee: feeText,
      consultationFee: feeText.includes("$") ? feeText : `$${feeText}`,
      bio: doctor.bio || `Dr. ${userDoc.name} is a dedicated healthcare specialist specializing in ${specialtyText} at ${hospitalText}.`,
      verificationStatus,
      isVerified: userDoc.isVerified || userDoc.status === "approved",
      status: userDoc.status,
      rating: doctor.rating !== undefined ? Number(doctor.rating) : 4.8,
      reviews: doctor.reviews !== undefined ? Number(doctor.reviews) : 50,
      totalReviews: doctor.reviews !== undefined ? Number(doctor.reviews) : 50,
      availableSlots: doctor.availableSlots || ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"],
      degrees: userDoc.qualification
        ? [
            {
              degree: userDoc.qualification,
              institution: hospitalText,
              year: "Certified Practitioner",
            },
          ]
        : [
            {
              degree: "Doctor of Medicine (MD)",
              institution: hospitalText,
              year: "Certified Practitioner",
            },
          ],
    };

    res.json({ success: true, doctor: profileData });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({ message: "Failed to fetch doctor profile", error: error.message });
  }
};

// PUT /api/doctors/profile
const updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const {
      name,
      email,
      phone,
      specialty,
      specialization,
      qualification,
      experience,
      experienceYears,
      licenseNumber,
      hospital,
      hospitalAffiliation,
      fee,
      consultationFee,
      languages,
      languagesSpoken,
      bio,
      availableSlots,
    } = req.body;

    const resolvedName = (name !== undefined ? name : userDoc.name)?.trim();
    const resolvedSpecialty = (specialty || specialization || userDoc.specialization || "General Physician")?.trim();
    const resolvedExperience = (experience || experienceYears || userDoc.experience || "10 years exp")?.trim();
    const resolvedHospital = (hospital || hospitalAffiliation || userDoc.hospital || "")?.trim();
    const resolvedPhone = (phone !== undefined ? phone : userDoc.phone || "")?.trim();
    const resolvedQualification = (qualification !== undefined ? qualification : userDoc.qualification || "")?.trim();
    const resolvedLicense = (licenseNumber !== undefined ? licenseNumber : userDoc.licenseNumber || "")?.trim();
    const resolvedFee = (fee || consultationFee || "$45")?.trim();
    const rawLanguages = languagesSpoken !== undefined ? languagesSpoken : languages;

    const langArray = Array.isArray(rawLanguages)
      ? rawLanguages.map((l) => String(l).trim()).filter(Boolean)
      : typeof rawLanguages === "string"
      ? rawLanguages.split(",").map((l) => l.trim()).filter(Boolean)
      : [userDoc.language || "English"];

    const finalLanguages = langArray.length > 0 ? langArray : ["English"];

    let doctor = await Doctor.findOne({ $or: [{ user: userId }, { name: userDoc.name }] });

    if (doctor) {
      if (resolvedName) doctor.name = resolvedName;
      if (resolvedSpecialty) doctor.specialty = resolvedSpecialty;
      if (resolvedExperience) doctor.experience = resolvedExperience;
      doctor.languages = finalLanguages;
      if (resolvedFee) doctor.fee = resolvedFee;
      if (bio !== undefined) doctor.bio = bio.trim();
      if (availableSlots && Array.isArray(availableSlots) && availableSlots.length > 0) {
        doctor.availableSlots = availableSlots;
      }
      doctor.user = userId;
      await doctor.save();
    } else {
      doctor = await Doctor.create({
        user: userId,
        name: resolvedName || userDoc.name || "Doctor",
        specialty: resolvedSpecialty,
        experience: resolvedExperience,
        languages: finalLanguages,
        fee: resolvedFee,
        bio: bio !== undefined ? bio.trim() : "",
        availableSlots: availableSlots || ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"],
      });
    }

    // Update User model fields in MongoDB
    if (resolvedName) userDoc.name = resolvedName;
    if (email && email.trim()) userDoc.email = email.trim().toLowerCase();
    if (resolvedPhone !== undefined) userDoc.phone = resolvedPhone;
    if (resolvedSpecialty) userDoc.specialization = resolvedSpecialty;
    if (resolvedQualification !== undefined) userDoc.qualification = resolvedQualification;
    if (resolvedExperience) userDoc.experience = resolvedExperience;
    if (resolvedLicense !== undefined) userDoc.licenseNumber = resolvedLicense;
    if (resolvedHospital !== undefined) userDoc.hospital = resolvedHospital;
    if (finalLanguages.length > 0) userDoc.language = finalLanguages[0];

    await userDoc.save();

    const verificationStatus =
      userDoc.status === "approved" || userDoc.isVerified
        ? "Verified Doctor"
        : userDoc.status === "rejected"
        ? "Rejected"
        : "Pending Verification";

    const qualificationText = userDoc.qualification || "MD";
    const specialtyText = doctor.specialty || userDoc.specialization || "General Physician";
    const hospitalText = userDoc.hospital || "HealTalk Medical Network";
    const experienceText = doctor.experience || userDoc.experience || "10 years exp";
    const feeText = doctor.fee || "$45";
    const licenseNumberText = userDoc.licenseNumber || "MED-VERIFIED";

    const updatedProfileData = {
      _id: doctor._id,
      userId: userDoc._id,
      name: doctor.name || userDoc.name,
      email: userDoc.email,
      phone: userDoc.phone || "",
      specialty: specialtyText,
      specialization: specialtyText,
      qualification: qualificationText,
      title: `${qualificationText} • ${specialtyText}`,
      experience: experienceText,
      experienceYears: experienceText.includes("exp") || experienceText.includes("year") ? experienceText : `${experienceText} years experience`,
      licenseNumber: licenseNumberText,
      npiNumber: licenseNumberText.startsWith("NPI-") ? licenseNumberText : `NPI-${licenseNumberText.replace(/[^0-9A-Za-z]/g, "") || "1982048190"}`,
      hospital: hospitalText,
      hospitalAffiliation: hospitalText,
      languages: doctor.languages,
      languagesSpoken: doctor.languages,
      fee: feeText,
      consultationFee: feeText.includes("$") ? feeText : `$${feeText}`,
      bio: doctor.bio,
      verificationStatus,
      isVerified: userDoc.isVerified || userDoc.status === "approved",
      status: userDoc.status,
      rating: doctor.rating !== undefined ? Number(doctor.rating) : 4.8,
      reviews: doctor.reviews !== undefined ? Number(doctor.reviews) : 50,
      totalReviews: doctor.reviews !== undefined ? Number(doctor.reviews) : 50,
      availableSlots: doctor.availableSlots || ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"],
      degrees: userDoc.qualification
        ? [
            {
              degree: userDoc.qualification,
              institution: hospitalText,
              year: "Certified Practitioner",
            },
          ]
        : [
            {
              degree: "Doctor of Medicine (MD)",
              institution: hospitalText,
              year: "Certified Practitioner",
            },
          ],
    };

    res.json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor: updatedProfileData,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({ message: "Failed to update doctor profile", error: error.message });
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Doctor not found (invalid ID)" });
    }

    let doctor = await Doctor.findById(id);
    if (!doctor) {
      const docUser = await User.findOne({ _id: id, role: "doctor" });
      if (docUser) {
        doctor = {
          _id: docUser._id,
          name: docUser.name,
          specialty: "General Physician",
          languages: [docUser.language || "English"],
          rating: 4.9,
          reviews: 12,
          experience: "Verified Practitioner",
          fee: "$45",
          bio: `Verified HealTalk ${docUser.language || "English"} Healthcare Practitioner.`,
          availableSlots: ["Today 4:00 PM", "Tomorrow 10:00 AM"],
        };
      }
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor details", error: error.message });
  }
};

// POST /api/doctors/seed
const seedDoctors = async (req, res) => {
  try {
    await Doctor.deleteMany({});
    const doctors = await Doctor.insertMany(SAMPLE_DOCTORS_SEED);
    res.json({ message: "Doctors seeded successfully", count: doctors.length, doctors });
  } catch (error) {
    res.status(500).json({ message: "Seeding failed", error: error.message });
  }
};

// GET /api/doctors/dashboard-stats
const getDoctorDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);

    // Find linked Doctor record or matching doctor record by name/user
    let doctor = await Doctor.findOne({
      $or: [{ user: userId }, { name: userDoc?.name }, { _id: userId }],
    });

    const doctorMatchIds = [userId];
    if (doctor) {
      doctorMatchIds.push(doctor._id);
    }

    const doctorQuery = {
      $or: [
        { doctor: { $in: doctorMatchIds } },
        ...(userDoc?.name
          ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
          : []),
      ],
    };

    const allAppointments = await Appointment.find(doctorQuery)
      .populate("patient", "name email phone language age gender")
      .sort({ createdAt: -1 });

    // Date calculations for Today
    const todayISO = new Date().toISOString().split("T")[0]; // e.g. YYYY-MM-DD
    const todayLocale = new Date().toLocaleDateString();

    const isToday = (aptDate) => {
      if (!aptDate) return false;
      const str = String(aptDate).toLowerCase();
      if (str.includes("today")) return true;
      if (str === todayISO) return true;
      if (str === todayLocale) return true;
      try {
        const d = new Date(aptDate).toISOString().split("T")[0];
        if (d === todayISO) return true;
      } catch (e) {}
      return false;
    };

    const isUpcoming = (apt) => {
      if (apt.status === "Cancelled") return false;
      if (apt.status === "Completed") return false;
      return true;
    };

    const todayAppointments = allAppointments.filter((apt) => isToday(apt.date));
    const completedToday = todayAppointments.filter((apt) => apt.status === "Completed").length;
    const remainingToday = todayAppointments.filter((apt) => apt.status !== "Completed").length;
    const upcomingAppointments = allAppointments.filter((apt) => isUpcoming(apt));

    // Calculate unique patients seen
    const uniquePatientIds = new Set();
    allAppointments.forEach((apt) => {
      if (apt.patient && apt.patient._id) {
        uniquePatientIds.add(String(apt.patient._id));
      } else if (apt.patient) {
        uniquePatientIds.add(String(apt.patient));
      }
    });

    // Format today's schedule items cleanly for frontend
    const todaySchedule = todayAppointments.map((apt) => {
      const patientName = apt.patient?.name || "Patient";
      const patientAge = apt.patient?.age || 35;
      const patientGender = apt.patient?.gender || "Patient";
      const language = apt.patient?.language || apt.interpreterLanguage || "English";
      const isVideo = (apt.type || "Video Call").toLowerCase().includes("video");

      return {
        id: String(apt._id),
        patientId: apt.patient?._id ? String(apt.patient._id) : `PAT-${apt._id}`,
        patientName,
        patientAge,
        patientGender,
        time: apt.time,
        type: isVideo ? "video" : "chat",
        language,
        requiresInterpreter: !!apt.interpreterRequested,
        interpreterName: apt.interpreterLanguage ? `${apt.interpreterLanguage} Interpreter` : null,
        status: apt.status || "Confirmed",
        reason: apt.reason || "General Medical Consultation",
        isJoinable: apt.status === "Confirmed" || apt.status === "In Progress",
      };
    });

    // Check for active / in-progress consultation
    const activeApt = todaySchedule.find(
      (apt) => apt.status === "In Progress" || apt.isJoinable
    );

    const stats = {
      todayAppointments: todayAppointments.length,
      completedToday,
      remainingToday,
      upcomingConsultations: upcomingAppointments.length,
      totalPatientsSeen: uniquePatientIds.size,
      rating: doctor?.rating !== undefined ? Number(doctor.rating) : 4.8,
      reviews: doctor?.reviews !== undefined ? Number(doctor.reviews) : 50,
    };

    res.json({
      success: true,
      stats,
      todaySchedule,
      activeConsultation: activeApt || null,
      doctor: {
        name: doctor?.name || userDoc?.name || "Doctor",
        specialty: doctor?.specialty || userDoc?.specialization || "General Physician",
        rating: doctor?.rating !== undefined ? Number(doctor.rating) : 4.8,
        reviews: doctor?.reviews !== undefined ? Number(doctor.reviews) : 50,
      },
    });
  } catch (error) {
    console.error("Error generating doctor dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load doctor dashboard stats",
      error: error.message,
    });
  }
};

// GET /api/doctors/patients - Get all unique patients with consultation history for logged-in doctor
const getDoctorPatients = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);

    let doctor = await Doctor.findOne({
      $or: [{ user: userId }, { name: userDoc?.name }, { _id: userId }],
    });

    const doctorMatchIds = [userId];
    if (doctor) {
      doctorMatchIds.push(doctor._id);
    }

    const doctorQuery = {
      $or: [
        { doctor: { $in: doctorMatchIds } },
        ...(userDoc?.name
          ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
          : []),
      ],
    };

    const appointments = await Appointment.find(doctorQuery)
      .populate("patient", "name email phone language age gender bloodGroup allergies chronicConditions currentMedications vitals hospital createdAt")
      .sort({ createdAt: -1 });

    const patientMap = new Map();

    for (const apt of appointments) {
      if (!apt.patient) continue;
      const pObj = typeof apt.patient === "object" ? apt.patient : {};
      const patId = String(pObj._id || apt.patient);

      if (!patientMap.has(patId)) {
        patientMap.set(patId, {
          id: patId,
          name: pObj.name || "Patient",
          email: pObj.email || "Not provided",
          phone: pObj.phone || "Not provided",
          address: pObj.hospital || "Residential Location",
          age: pObj.age || 35,
          gender: pObj.gender || "Not specified",
          bloodGroup: pObj.bloodGroup || "O+",
          language: pObj.language || apt.interpreterLanguage || "English",
          primaryCondition: apt.reason || "General Consultation",
          allergies: pObj.allergies && pObj.allergies.length > 0 ? pObj.allergies : [],
          chronicConditions: pObj.chronicConditions && pObj.chronicConditions.length > 0 ? pObj.chronicConditions : [],
          currentMedications: pObj.currentMedications && pObj.currentMedications.length > 0 ? pObj.currentMedications : [],
          vitals: pObj.vitals || {},
          totalVisits: 0,
          lastVisited: apt.date || "Recent",
          pastAppointments: [],
          pastPrescriptions: [],
        });
      }

      const pEntry = patientMap.get(patId);
      pEntry.totalVisits += 1;
      pEntry.pastAppointments.push({
        id: String(apt._id),
        date: `${apt.date}${apt.time ? ` at ${apt.time}` : ""}`,
        type: apt.type || "Video Call",
        diagnosis: apt.reason || "Clinical Consultation",
        doctor: apt.doctorName || doctor?.name || userDoc?.name || "Doctor",
        status: apt.status || "Confirmed",
        notes: apt.notes || "",
      });

      if (apt.notes && apt.notes.trim() !== "") {
        pEntry.pastPrescriptions.push({
          id: `RX-${String(apt._id).slice(-4).toUpperCase()}`,
          date: apt.date,
          medicines: apt.notes,
        });
      }
    }

    // Attach real prescription records from Prescription collection
    try {
      const patientIds = Array.from(patientMap.keys());
      const doctorPrescriptions = await Prescription.find({
        patient: { $in: patientIds },
        $or: [
          { doctorUser: userId },
          { doctor: { $in: doctorMatchIds } },
          ...(userDoc?.name
            ? [{ doctorName: { $regex: new RegExp(`^${userDoc.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}$`, "i") } }]
            : []),
        ],
      }).sort({ createdAt: -1 });

      for (const rx of doctorPrescriptions) {
        const patId = String(rx.patient);
        if (patientMap.has(patId)) {
          const pEntry = patientMap.get(patId);
          const medSummary = (rx.medicines || [])
            .map((m) => `${m.name} (${m.dosage})`)
            .join(", ");
          
          // Avoid duplicate entry if already present
          const alreadyExists = pEntry.pastPrescriptions.some(
            (p) => p.id === (rx.prescriptionId || String(rx._id))
          );
          if (!alreadyExists) {
            pEntry.pastPrescriptions.unshift({
              id: rx.prescriptionId || `RX-${String(rx._id).slice(-4).toUpperCase()}`,
              date: rx.date,
              medicines: medSummary || rx.diagnosis || "Standard Rx",
            });
          }
        }
      }
    } catch (rxErr) {
      console.error("Error loading prescriptions for patient directory:", rxErr);
    }

    const patients = Array.from(patientMap.values());

    res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Error fetching doctor patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient records",
      error: error.message,
    });
  }
};

const DEFAULT_WEEKLY_SCHEDULE = [
  { day: "Monday", enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 30, maxPatients: 12, breakStart: "13:00", breakEnd: "14:00" },
  { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 30, maxPatients: 12, breakStart: "13:00", breakEnd: "14:00" },
  { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 30, maxPatients: 12, breakStart: "13:00", breakEnd: "14:00" },
  { day: "Thursday", enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 30, maxPatients: 12, breakStart: "13:00", breakEnd: "14:00" },
  { day: "Friday", enabled: true, startTime: "09:00", endTime: "15:00", slotDuration: 30, maxPatients: 8, breakStart: "12:30", breakEnd: "13:30" },
  { day: "Saturday", enabled: false, startTime: "10:00", endTime: "14:00", slotDuration: 30, maxPatients: 6, breakStart: "", breakEnd: "" },
  { day: "Sunday", enabled: false, startTime: "10:00", endTime: "14:00", slotDuration: 30, maxPatients: 4, breakStart: "", breakEnd: "" },
];

// GET /api/doctors/availability - Fetch availability for authenticated doctor
const getDoctorAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);

    let doctor = await Doctor.findOne({
      $or: [{ user: userId }, { name: userDoc?.name }, { _id: userId }],
    });

    if (!doctor && userDoc) {
      doctor = await Doctor.create({
        user: userId,
        name: userDoc.name,
        specialty: userDoc.specialization || "General Physician",
        languages: [userDoc.language || "English"],
        experience: userDoc.experience || "10 years exp",
        fee: "$45",
        bio: userDoc.bio || `Dr. ${userDoc.name}, Healthcare Practitioner.`,
        weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
        blockedDates: [],
        consultationTypesAccepted: {
          videoConsultation: true,
          chatConsultation: true,
          emergencyTriage: false,
        },
      });
    }

    if (doctor && (!doctor.weeklySchedule || doctor.weeklySchedule.length === 0)) {
      doctor.weeklySchedule = DEFAULT_WEEKLY_SCHEDULE;
      await doctor.save();
    }

    res.json({
      success: true,
      availability: {
        weeklySchedule: doctor.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
        blockedDates: doctor.blockedDates || [],
        consultationTypesAccepted: doctor.consultationTypesAccepted || {
          videoConsultation: true,
          chatConsultation: true,
          emergencyTriage: false,
        },
        autoConfirmAppointments: doctor.autoConfirmAppointments !== undefined ? doctor.autoConfirmAppointments : true,
        bufferBetweenSlots: doctor.bufferBetweenSlots || 10,
        availableSlots: doctor.availableSlots || [],
      },
    });
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor availability",
      error: error.message,
    });
  }
};

// PUT /api/doctors/availability - Update availability for authenticated doctor
const updateDoctorAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);
    const {
      weeklySchedule,
      blockedDates,
      consultationTypesAccepted,
      autoConfirmAppointments,
      bufferBetweenSlots,
    } = req.body;

    let doctor = await Doctor.findOne({
      $or: [{ user: userId }, { name: userDoc?.name }, { _id: userId }],
    });

    if (!doctor && userDoc) {
      doctor = new Doctor({
        user: userId,
        name: userDoc.name,
        specialty: userDoc.specialization || "General Physician",
        languages: [userDoc.language || "English"],
      });
    }

    if (weeklySchedule && Array.isArray(weeklySchedule)) {
      doctor.weeklySchedule = weeklySchedule;

      // Derive human-readable availableSlots strings
      const derivedSlots = [];
      for (const item of weeklySchedule) {
        if (item.enabled) {
          derivedSlots.push(`${item.day} ${item.startTime} - ${item.endTime}`);
        }
      }
      if (derivedSlots.length > 0) {
        doctor.availableSlots = derivedSlots;
      }
    }

    if (blockedDates && Array.isArray(blockedDates)) {
      doctor.blockedDates = blockedDates;
    }

    if (consultationTypesAccepted) {
      doctor.consultationTypesAccepted = {
        videoConsultation: consultationTypesAccepted.videoConsultation !== false,
        chatConsultation: consultationTypesAccepted.chatConsultation !== false,
        emergencyTriage: !!consultationTypesAccepted.emergencyTriage,
      };
    }

    if (autoConfirmAppointments !== undefined) {
      doctor.autoConfirmAppointments = autoConfirmAppointments;
    }

    if (bufferBetweenSlots !== undefined) {
      doctor.bufferBetweenSlots = Number(bufferBetweenSlots) || 10;
    }

    await doctor.save();

    res.json({
      success: true,
      message: "Availability and working hours saved to MongoDB successfully",
      availability: {
        weeklySchedule: doctor.weeklySchedule,
        blockedDates: doctor.blockedDates,
        consultationTypesAccepted: doctor.consultationTypesAccepted,
        autoConfirmAppointments: doctor.autoConfirmAppointments,
        bufferBetweenSlots: doctor.bufferBetweenSlots,
        availableSlots: doctor.availableSlots,
      },
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save availability settings",
      error: error.message,
    });
  }
};

module.exports = {
  getDoctors,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorById,
  seedDoctors,
  getDoctorDashboardStats,
  getDoctorPatients,
  getDoctorAvailability,
  updateDoctorAvailability,
};
