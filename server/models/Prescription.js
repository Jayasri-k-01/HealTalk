const mongoose = require("mongoose");

const medicineItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    type: String,
    required: true,
    trim: true,
  },
  frequency: {
    type: String,
    default: "Once daily",
    trim: true,
  },
  duration: {
    type: String,
    default: "30 days",
    trim: true,
  },
  instructions: {
    type: String,
    default: "Take after meals",
    trim: true,
  },
});

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false,
    },
    doctorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: "MED-782910",
      trim: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientAge: {
      type: Number,
      default: 35,
    },
    patientGender: {
      type: String,
      default: "Not specified",
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: false,
    },
    appointmentId: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    outputLanguage: {
      type: String,
      default: "Spanish",
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Refilled", "Discontinued"],
      default: "Active",
    },
    medicines: {
      type: [medicineItemSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
