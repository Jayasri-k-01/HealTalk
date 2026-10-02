const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const { seedDefaultAccounts } = require("./controllers/authController");

const http = require("http");
const { Server } = require("socket.io");
const initConsultationSocket = require("./socket/consultationSocket");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assistant", assistantRoutes);

app.get("/", (req, res) => {
  res.send("HealTalk Backend is running!");
});

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

initConsultationSocket(io);

connectDB().then(() => {
  seedDefaultAccounts();
});

server.listen(PORT, () => {
  console.log(`HealTalk server running on port ${PORT}`);
});