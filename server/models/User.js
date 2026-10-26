const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "interpreter", "admin"],
      default: "patient",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "approved",
    },

    language: {
      type: String,
      default: "English",
    },

    languages: {
      type: [String],
      default: [],
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    specialization: {
      type: String,
      default: "",
      trim: true,
    },

    qualification: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    licenseNumber: {
      type: String,
      default: "",
      trim: true,
    },

    certificationNumber: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: String,
      default: "",
    },

    interpreterId: {
      type: String,
      default: "",
      trim: true,
    },

    certificationDocument: {
      fileName: { type: String, default: "" },
      originalName: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      fileType: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: null },
    },

    languageProficiencies: {
      type: [
        {
          language: { type: String, required: true },
          proficiency: {
            type: String,
            enum: ["Basic", "Intermediate", "Advanced", "Native"],
            default: "Advanced",
          },
          sourceLanguage: { type: String, default: "English" },
          targetLanguage: { type: String, default: "" },
          bidirectional: { type: Boolean, default: true },
        },
      ],
      default: [],
    },

    availabilityStatus: {
      type: String,
      enum: ["Available", "Busy", "Offline"],
      default: "Available",
    },

    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    availableTimeSlots: {
      type: [String],
      default: ["09:00 AM - 01:00 PM", "02:00 PM - 06:00 PM"],
    },

    timeZone: {
      type: String,
      default: "UTC",
    },

    hospital: {
      type: String,
      default: "",
      trim: true,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    age: {
      type: Number,
      default: null,
    },

    gender: {
      type: String,
      default: "",
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    allergies: {
      type: [String],
      default: [],
    },

    chronicConditions: {
      type: [String],
      default: [],
    },

    currentMedications: {
      type: Array,
      default: [],
    },

    vitals: {
      type: Object,
      default: {},
    },

    autoRequestInterpreter: {
      type: Boolean,
      default: false,
    },

    emergencyContactPhone: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);