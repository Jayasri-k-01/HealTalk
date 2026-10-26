const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadPhoto, uploadDocument } = require("../middleware/uploadMiddleware");
const {
  getInterpreterProfile,
  updateInterpreterProfile,
  uploadProfilePhoto,
  uploadCertificationDocument,
  updateAvailability,
} = require("../controllers/interpreterController");

// All interpreter profile endpoints require authentication
router.use(protect);

// Interpreter Profile CRUD
router.get("/profile", getInterpreterProfile);
router.put("/profile", updateInterpreterProfile);

// File uploads
router.post("/profile/photo", uploadPhoto.single("photo"), uploadProfilePhoto);
router.post("/profile/document", uploadDocument.single("document"), uploadCertificationDocument);

// Quick availability update
router.patch("/availability", updateAvailability);

module.exports = router;
