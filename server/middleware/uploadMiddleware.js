const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || "anon";
    const prefix = file.fieldname === "photo" || file.fieldname === "profilePhoto" ? "photo" : "cert";
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.includes("pdf") ? ".pdf" : ".jpg");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `${prefix}-${userId}-${uniqueSuffix}${ext}`);
  },
});

// Photo filter: JPEG, PNG, WEBP, GIF
const photoFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF"), false);
  }
};

// Document filter: PDF, JPEG, PNG
const docFilter = (req, file, cb) => {
  const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid document format. Allowed formats: PDF, JPG, PNG"), false);
  }
};

const uploadPhoto = multer({
  storage,
  fileFilter: photoFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadDocument = multer({
  storage,
  fileFilter: docFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = {
  uploadPhoto,
  uploadDocument,
  uploadsDir,
};
