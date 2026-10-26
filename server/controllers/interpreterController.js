const path = require("path");
const fs = require("fs");
const User = require("../models/User");

/**
 * Helper to ensure system-generated Interpreter ID
 */
const getOrGenerateInterpreterId = (user) => {
  if (user.interpreterId && user.interpreterId.trim() !== "") {
    return user.interpreterId;
  }
  return `INT-${String(user._id).slice(-6).toUpperCase()}`;
};

/**
 * GET /api/interpreter/profile
 * Retrieve the logged-in interpreter's profile
 */
const getInterpreterProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interpreter") {
      return res.status(403).json({ success: false, message: "Access restricted to certified interpreters" });
    }

    // Ensure system-generated Interpreter ID
    let modified = false;
    if (!user.interpreterId) {
      user.interpreterId = getOrGenerateInterpreterId(user);
      modified = true;
    }

    // Populate default language proficiencies if empty
    if (!user.languageProficiencies || user.languageProficiencies.length === 0) {
      const existingLangs = Array.isArray(user.languages) && user.languages.length > 0
        ? user.languages
        : (user.language ? user.language.split(",").map((l) => l.trim()) : ["Spanish", "English"]);

      user.languageProficiencies = existingLangs.map((lang, index) => ({
        language: lang,
        proficiency: index === 0 ? "Native" : "Advanced",
        sourceLanguage: "English",
        targetLanguage: lang,
        bidirectional: true,
      }));
      modified = true;
    }

    if (modified) {
      await user.save();
    }

    const profileData = {
      id: user._id,
      _id: user._id,
      interpreterId: user.interpreterId,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      profilePhoto: user.profilePhoto || user.avatar || "",
      avatar: user.avatar || user.profilePhoto || "",
      qualification: user.qualification || "Certified Medical Interpreter (CMI)",
      certificationNumber: user.certificationNumber || user.licenseNumber || "",
      experience: user.experience || "",
      specialization: user.specialization || "General Medical Interpretation",
      bio: user.bio || "",
      certificationDocument: user.certificationDocument || null,
      primaryLanguage: user.language || "Spanish",
      languages: Array.isArray(user.languages) && user.languages.length > 0
        ? user.languages
        : (user.language ? [user.language] : ["Spanish", "English"]),
      languageProficiencies: user.languageProficiencies || [],
      availabilityStatus: user.availabilityStatus || "Available",
      workingDays: Array.isArray(user.workingDays) && user.workingDays.length > 0
        ? user.workingDays
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      availableTimeSlots: Array.isArray(user.availableTimeSlots) && user.availableTimeSlots.length > 0
        ? user.availableTimeSlots
        : ["09:00 AM - 01:00 PM", "02:00 PM - 06:00 PM"],
      timeZone: user.timeZone || "UTC",
      status: user.status || "approved",
      isVerified: user.isVerified || false,
      rejectionReason: user.rejectionReason || "",
    };

    res.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    console.error("Error fetching interpreter profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve interpreter profile",
      error: error.message,
    });
  }
};

/**
 * PUT /api/interpreter/profile
 * Update editable personal, professional, language, and availability details
 */
const updateInterpreterProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interpreter") {
      return res.status(403).json({ success: false, message: "Access restricted to certified interpreters" });
    }

    const {
      name,
      phone,
      gender,
      dateOfBirth,
      qualification,
      certificationNumber,
      experience,
      specialization,
      bio,
      primaryLanguage,
      languages,
      languageProficiencies,
      availabilityStatus,
      workingDays,
      availableTimeSlots,
      timeZone,
      profilePhoto,
    } = req.body;

    // 1. Validate personal details
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "Full name is required" });
      }
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (gender !== undefined) {
      user.gender = String(gender).trim();
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = String(dateOfBirth).trim();
    }

    // 2. Validate professional details
    if (qualification !== undefined) {
      user.qualification = String(qualification).trim();
    }

    if (certificationNumber !== undefined) {
      user.certificationNumber = String(certificationNumber).trim();
      user.licenseNumber = String(certificationNumber).trim(); // Keep in sync
    }

    if (experience !== undefined) {
      user.experience = String(experience).trim();
    }

    if (specialization !== undefined) {
      user.specialization = String(specialization).trim();
    }

    if (bio !== undefined) {
      user.bio = String(bio).trim();
    }

    // 3. Validate & process Language Preferences
    // At least one language is required; prevent duplicates
    if (languageProficiencies !== undefined || languages !== undefined || primaryLanguage !== undefined) {
      let finalProficiencies = [];
      let finalLanguagesList = [];
      const seenLanguages = new Set();

      if (Array.isArray(languageProficiencies) && languageProficiencies.length > 0) {
        for (const item of languageProficiencies) {
          const langName = (item.language || "").trim();
          if (!langName) continue;
          const lower = langName.toLowerCase();
          if (seenLanguages.has(lower)) continue; // Prevent duplicates
          seenLanguages.add(lower);

          const validProficiencies = ["Basic", "Intermediate", "Advanced", "Native"];
          const prof = validProficiencies.includes(item.proficiency) ? item.proficiency : "Advanced";

          finalProficiencies.push({
            language: langName,
            proficiency: prof,
            sourceLanguage: (item.sourceLanguage || "English").trim(),
            targetLanguage: (item.targetLanguage || langName).trim(),
            bidirectional: item.bidirectional !== false,
          });
          finalLanguagesList.push(langName);
        }
      } else if (Array.isArray(languages) && languages.length > 0) {
        for (const lang of languages) {
          const langName = String(lang).trim();
          if (!langName) continue;
          const lower = langName.toLowerCase();
          if (seenLanguages.has(lower)) continue;
          seenLanguages.add(lower);

          finalLanguagesList.push(langName);
          finalProficiencies.push({
            language: langName,
            proficiency: "Advanced",
            sourceLanguage: "English",
            targetLanguage: langName,
            bidirectional: true,
          });
        }
      }

      if (finalLanguagesList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one supported language is required.",
        });
      }

      user.languages = finalLanguagesList;
      user.languageProficiencies = finalProficiencies;

      if (primaryLanguage && typeof primaryLanguage === "string" && primaryLanguage.trim()) {
        user.language = primaryLanguage.trim();
      } else if (!user.language || !finalLanguagesList.includes(user.language)) {
        user.language = finalLanguagesList[0];
      }
    }

    // 4. Validate & process Availability
    if (availabilityStatus !== undefined) {
      const allowedAvailability = ["Available", "Busy", "Offline"];
      if (!allowedAvailability.includes(availabilityStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid availability status. Must be one of: ${allowedAvailability.join(", ")}`,
        });
      }
      user.availabilityStatus = availabilityStatus;
    }

    if (workingDays !== undefined && Array.isArray(workingDays)) {
      user.workingDays = workingDays.map((d) => String(d).trim()).filter(Boolean);
    }

    if (availableTimeSlots !== undefined && Array.isArray(availableTimeSlots)) {
      user.availableTimeSlots = availableTimeSlots.map((s) => String(s).trim()).filter(Boolean);
    }

    if (timeZone !== undefined) {
      user.timeZone = String(timeZone).trim();
    }

    // 5. Profile photo if passed as URL or Base64 in JSON
    if (profilePhoto !== undefined) {
      if (typeof profilePhoto === "string" && profilePhoto.startsWith("data:image")) {
        // Base64 image payload: save to disk
        try {
          const uploadsDir = path.join(__dirname, "..", "uploads");
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

          const matches = profilePhoto.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
            const buffer = Buffer.from(matches[2], "base64");
            const filename = `photo-${user._id}-${Date.now()}.${ext}`;
            fs.writeFileSync(path.join(uploadsDir, filename), buffer);
            user.profilePhoto = `/uploads/${filename}`;
            user.avatar = `/uploads/${filename}`;
          }
        } catch (e) {
          console.warn("Base64 photo save fallback warning:", e);
        }
      } else if (typeof profilePhoto === "string") {
        user.profilePhoto = profilePhoto;
        user.avatar = profilePhoto;
      }
    }

    // Security check: NEVER alter role, isVerified, status, or interpreterId
    // Ensure interpreter ID is set
    if (!user.interpreterId) {
      user.interpreterId = getOrGenerateInterpreterId(user);
    }

    await user.save();

    res.json({
      success: true,
      message: "Interpreter profile updated successfully",
      profile: {
        id: user._id,
        interpreterId: user.interpreterId,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        profilePhoto: user.profilePhoto || user.avatar || "",
        avatar: user.avatar || user.profilePhoto || "",
        qualification: user.qualification || "",
        certificationNumber: user.certificationNumber || user.licenseNumber || "",
        experience: user.experience || "",
        specialization: user.specialization || "",
        bio: user.bio || "",
        certificationDocument: user.certificationDocument || null,
        primaryLanguage: user.language || "Spanish",
        languages: user.languages || [],
        languageProficiencies: user.languageProficiencies || [],
        availabilityStatus: user.availabilityStatus || "Available",
        workingDays: user.workingDays || [],
        availableTimeSlots: user.availableTimeSlots || [],
        timeZone: user.timeZone || "UTC",
        status: user.status || "approved",
        isVerified: user.isVerified || false,
      },
    });
  } catch (error) {
    console.error("Error updating interpreter profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update interpreter profile",
      error: error.message,
    });
  }
};

/**
 * POST /api/interpreter/profile/photo
 * Upload or update profile photo file
 */
const uploadProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interpreter") {
      return res.status(403).json({ success: false, message: "Access restricted to interpreters" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    user.profilePhoto = photoUrl;
    user.avatar = photoUrl;
    await user.save();

    res.json({
      success: true,
      message: "Profile photo uploaded successfully",
      photoUrl,
      profilePhoto: photoUrl,
    });
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile photo",
      error: error.message,
    });
  }
};

/**
 * POST /api/interpreter/profile/document
 * Upload certification document
 */
const uploadCertificationDocument = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interpreter") {
      return res.status(403).json({ success: false, message: "Access restricted to interpreters" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file provided" });
    }

    const documentInfo = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedAt: new Date(),
    };

    user.certificationDocument = documentInfo;
    // Preserves existing verification status (does NOT auto-verify)
    await user.save();

    res.json({
      success: true,
      message: "Certification document uploaded successfully. Preserving admin verification workflow.",
      certificationDocument: documentInfo,
    });
  } catch (error) {
    console.error("Error uploading certification document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload certification document",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/interpreter/availability
 * Quick update for availability status, working days, and time slots
 */
const updateAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interpreter") {
      return res.status(403).json({ success: false, message: "Access restricted to interpreters" });
    }

    const { availabilityStatus, workingDays, availableTimeSlots, timeZone } = req.body;

    if (availabilityStatus !== undefined) {
      const allowed = ["Available", "Busy", "Offline"];
      if (!allowed.includes(availabilityStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid availability status. Must be one of: ${allowed.join(", ")}`,
        });
      }
      user.availabilityStatus = availabilityStatus;
    }

    if (workingDays !== undefined && Array.isArray(workingDays)) {
      user.workingDays = workingDays.map((d) => String(d).trim()).filter(Boolean);
    }

    if (availableTimeSlots !== undefined && Array.isArray(availableTimeSlots)) {
      user.availableTimeSlots = availableTimeSlots.map((s) => String(s).trim()).filter(Boolean);
    }

    if (timeZone !== undefined) {
      user.timeZone = String(timeZone).trim();
    }

    await user.save();

    res.json({
      success: true,
      message: `Availability updated to ${user.availabilityStatus}`,
      availability: {
        availabilityStatus: user.availabilityStatus,
        workingDays: user.workingDays,
        availableTimeSlots: user.availableTimeSlots,
        timeZone: user.timeZone,
      },
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message,
    });
  }
};

module.exports = {
  getInterpreterProfile,
  updateInterpreterProfile,
  uploadProfilePhoto,
  uploadCertificationDocument,
  updateAvailability,
};
