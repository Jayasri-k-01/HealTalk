const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getMe,
  updateProfileSettings,
  updateLanguage,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile/settings", protect, updateProfileSettings);
router.put("/profile/language", protect, updateLanguage);

module.exports = router;