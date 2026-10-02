const User = require("../models/User");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, language, phone, specialty } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "patient",
      language: language || "English",
      phone: phone || "",
      specialization: specialty || "",
    });

    if (user.role === "doctor") {
      await Doctor.findOneAndUpdate(
        { email: user.email },
        {
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          specialty: specialty || "General Physician",
          languages: [language || "English"],
          user: user._id,
        },
        { upsert: true, new: true }
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        phone: user.phone,
        specialization: user.specialization,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

// GET /api/auth/me - Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
  }
};

// PUT /api/auth/profile/settings - Update profile settings & health details
const updateProfileSettings = async (req, res) => {
  try {
    const {
      name,
      phone,
      language,
      age,
      gender,
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      vitals,
      autoRequestInterpreter,
      emergencyContactPhone,
      specialization,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (language) user.language = language;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (allergies !== undefined) user.allergies = allergies;
    if (chronicConditions !== undefined) user.chronicConditions = chronicConditions;
    if (currentMedications !== undefined) user.currentMedications = currentMedications;
    if (vitals !== undefined) user.vitals = vitals;
    if (autoRequestInterpreter !== undefined) user.autoRequestInterpreter = autoRequestInterpreter;
    if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone;
    if (specialization !== undefined) user.specialization = specialization;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

// PUT /api/auth/profile/language - Update preferred language
const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.language = language;
    await user.save();

    res.json({
      success: true,
      message: "Language preference updated",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update language", error: error.message });
  }
};

// Seed default demo accounts
const seedDefaultAccounts = async () => {
  try {
    // 1. Admin
    const adminExists = await User.findOne({ email: "admin@healtalk.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await User.create({
        name: "HealTalk Administrator",
        email: "admin@healtalk.com",
        password: hashedPassword,
        role: "admin",
        language: "English",
        status: "approved",
      });
      console.log("[Seed] Default Admin account created: admin@healtalk.com / Admin@123");
    }

    // 2. Doctor
    const doctorExists = await User.findOne({ email: "doctor@healtalk.com" });
    let doctorUser = doctorExists;
    if (!doctorExists) {
      const hashedPassword = await bcrypt.hash("Doctor@123", 10);
      doctorUser = await User.create({
        name: "Dr. Elena Rostova",
        email: "doctor@healtalk.com",
        password: hashedPassword,
        role: "doctor",
        language: "English",
        specialization: "Cardiologist (MD)",
        qualification: "MD, FACC - Harvard Medical School",
        hospital: "Metro Health Cardiology Center",
        status: "approved",
        isVerified: true,
      });
      console.log("[Seed] Default Doctor account created: doctor@healtalk.com / Doctor@123");
    }

    // Ensure Doctor model has record
    if (doctorUser) {
      await Doctor.findOneAndUpdate(
        { email: doctorUser.email },
        {
          name: doctorUser.name,
          email: doctorUser.email,
          specialty: "Cardiology",
          qualification: "MD, FACC",
          hospital: "Metro Health Medical Center",
          languages: ["English", "Spanish"],
          fee: "$65",
          rating: 4.9,
          reviews: 128,
          experience: "12 years exp",
          user: doctorUser._id,
        },
        { upsert: true, new: true }
      );
    }

    // 3. Patient
    const patientExists = await User.findOne({ email: "patient@healtalk.com" });
    if (!patientExists) {
      const hashedPassword = await bcrypt.hash("Patient@123", 10);
      await User.create({
        name: "Sarah Jenkins",
        email: "patient@healtalk.com",
        password: hashedPassword,
        role: "patient",
        language: "English",
        status: "approved",
        age: 34,
        gender: "Female",
        bloodGroup: "O+",
        allergies: ["Penicillin"],
        chronicConditions: ["Mild Asthma"],
        currentMedications: ["Albuterol Inhaler (PRN)"],
        vitals: {
          bloodPressure: "120/80",
          heartRate: "72",
          oxygenSat: "99",
          temperature: "98.6",
          weight: "62",
          height: "168",
        },
      });
      console.log("[Seed] Default Patient account created: patient@healtalk.com / Patient@123");
    }
  } catch (err) {
    console.error("[Seed] Error seeding default accounts:", err.message);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfileSettings,
  updateLanguage,
  seedDefaultAccounts,
};