const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getPatientContext,
  handleChat,
  getChatHistory,
  clearChatHistory,
} = require("../controllers/assistantController");

const router = express.Router();

router.use(protect);

router.get("/context", getPatientContext);
router.post("/chat", handleChat);
router.get("/history", getChatHistory);
router.delete("/history", clearChatHistory);

module.exports = router;
