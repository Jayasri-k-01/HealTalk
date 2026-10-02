const mongoose = require("mongoose");

const scheduleDaySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  startTime: {
    type: String,
    default: "09:00",
  },
  endTime: {
    type: String,
    default: "17:00",
  },
  slotDuration: {
    type: Number,
    default: 30,
  },
  maxPatients: {
    type: Number,
    default: 12,
  },
  breakStart: {
    type: String,
    default: "",
  },
  breakEnd: {
    type: String,
    default: "",
  },
});

const blockedDateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    default: "",
  },
  reason: {
    type: String,
    required: true,
  },
});

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      default: "",
      trim: true,
    },
    hospital: {
      type: String,
      default: "",
      trim: true,
    },
    hospitalAffiliation: {
      type: String,
      default: "",
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: "",
      trim: true,
    },
    languages: {
      type: [String],
      required: true,
      default: ["English"],
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviews: {
      type: Number,
      default: 50,
    },
    experience: {
      type: String,
      default: "10 years exp",
    },
    fee: {
      type: String,
      default: "$45",
    },
    bio: {
      type: String,
      default: "",
    },
    availableSlots: {
      type: [String],
      default: ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"],
    },
    weeklySchedule: {
      type: [scheduleDaySchema],
      default: undefined,
    },
    blockedDates: {
      type: [blockedDateSchema],
      default: [],
    },
    consultationTypesAccepted: {
      videoConsultation: { type: Boolean, default: true },
      chatConsultation: { type: Boolean, default: true },
      emergencyTriage: { type: Boolean, default: false },
    },
    autoConfirmAppointments: {
      type: Boolean,
      default: true,
    },
    bufferBetweenSlots: {
      type: Number,
      default: 10,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);
