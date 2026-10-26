const jwt = require("jsonwebtoken");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

// Active participants tracked by appointmentId -> Map of socket.id -> participantData
const roomParticipants = new Map();

/**
 * Verify user JWT token and extract user details
 */
const verifyToken = (token) => {
  if (!token) return null;
  try {
    const rawToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    return jwt.verify(rawToken, process.env.JWT_SECRET);
  } catch (err) {
    console.error("Socket JWT verification failed:", err.message);
    return null;
  }
};

/**
 * Check if the user is authorized to join the consultation for this appointment
 */
const isAuthorizedForAppointment = async (appointment, userId, userRole, userName) => {
  if (!appointment || !userId) return { isAuthorized: false };
  if (userRole === "admin") return { isAuthorized: true, participantRole: "admin" };

  const userIdStr = String(userId);

  // Check if user is the assigned patient
  const patientIdStr = String(
    appointment.patient?._id || appointment.patient || ""
  );
  if (patientIdStr && patientIdStr === userIdStr) {
    return { isAuthorized: true, participantRole: "patient" };
  }

  // Check if user is the assigned doctor
  const doctorIdStr = String(
    appointment.doctor?._id || appointment.doctor || ""
  );
  if (doctorIdStr && doctorIdStr === userIdStr) {
    return { isAuthorized: true, participantRole: "doctor" };
  }

  // Check if user is the assigned interpreter
  const assignedInterpreterId = String(
    appointment.interpreter?._id || appointment.interpreter || ""
  );
  if (
    assignedInterpreterId &&
    assignedInterpreterId === userIdStr
  ) {
    return { isAuthorized: true, participantRole: "interpreter" };
  }

  // Doctor may have a separate Doctor profile referencing their User account
  const doctorDocs = await Doctor.find({
    $or: [{ user: userId }, { _id: userId }],
  });

  const matchingDocIds = doctorDocs.map((d) => String(d._id));
  if (matchingDocIds.includes(doctorIdStr)) {
    return { isAuthorized: true, participantRole: "doctor" };
  }

  // Check if doctor's name matches user's name
  if (userName && appointment.doctorName) {
    const cleanUser = userName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
    const cleanApt = appointment.doctorName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
    if (cleanUser === cleanApt) {
      return { isAuthorized: true, participantRole: "doctor" };
    }
  }

  // Check User record
  const userRecord = await User.findById(userId);
  if (userRecord && userRecord.role === "doctor") {
    if (userRecord.name && appointment.doctorName) {
      const cleanUser = userRecord.name.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
      const cleanApt = appointment.doctorName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
      if (cleanUser === cleanApt) {
        return { isAuthorized: true, participantRole: "doctor" };
      }
    }
  }

  if (userRecord && userRecord.role === "interpreter" && assignedInterpreterId === userIdStr) {
    return { isAuthorized: true, participantRole: "interpreter" };
  }

  return { isAuthorized: false };
};

function initConsultationSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Handler: Join Consultation Room
    socket.on("join-consultation", async (data, callback) => {
      try {
        const { appointmentId, token, role: clientRole, userName: clientName } = data || {};

        if (!appointmentId) {
          const err = "Appointment ID is required to join consultation";
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        // Authenticate via token
        const authData = verifyToken(token || socket.handshake.auth?.token);
        if (!authData) {
          const err = "Unauthorized: Invalid or expired authentication token";
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        const userId = authData.id;
        const userRole = authData.role || clientRole || "patient";

        // Fetch appointment details with populated references
        const appointment = await Appointment.findById(appointmentId)
          .populate("patient", "name email phone language age gender")
          .populate("doctor", "name specialty fee rating")
          .populate("interpreter", "name email language languages specialization");

        if (!appointment) {
          const err = "Appointment not found";
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        // Check participant authorization
        const authCheck = await isAuthorizedForAppointment(
          appointment,
          userId,
          userRole,
          clientName
        );

        if (!authCheck.isAuthorized) {
          const err = "Access denied: You are not a registered participant in this consultation";
          console.warn(`[Socket] Unauthorized join attempt by userId ${userId} (${userRole}) for appointment ${appointmentId}`);
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        // CRITICAL CHECK: Appointment MUST be Confirmed or In Progress to join consultation room
        if (appointment.status === "Pending") {
          const err = "Consultation room is not available: Appointment is pending doctor confirmation.";
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        if (appointment.status === "Cancelled") {
          const err = "Consultation room is closed: This appointment has been cancelled.";
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        if (appointment.status === "Completed") {
          const err = "Consultation room is closed: This appointment has already been completed.";
          if (callback) callback({ success: false, message: err });
          socket.emit("consultation-error", { message: err });
          return;
        }

        const roomKey = `appointment_${appointmentId}`;
        socket.join(roomKey);

        // Track participant in memory
        if (!roomParticipants.has(roomKey)) {
          roomParticipants.set(roomKey, new Map());
        }
        const participantsMap = roomParticipants.get(roomKey);

        const assignedRole = authCheck.participantRole || userRole;
        const resolvedName = clientName || (
          assignedRole === "doctor"
            ? appointment.doctorName
            : assignedRole === "interpreter"
            ? (appointment.interpreter?.name || "Medical Interpreter")
            : appointment.patient?.name
        ) || "Participant";

        // Deduplicate stale sockets: If this user or unique role (patient, doctor, interpreter)
        // already had an existing socket in this room, evict the stale socket!
        const staleSocketsToEvict = [];
        participantsMap.forEach((pInfo, existingSockId) => {
          if (existingSockId !== socket.id) {
            const sameUserId = String(pInfo.userId) === String(userId);
            const sameRole = assignedRole && pInfo.role === assignedRole && ["doctor", "patient", "interpreter"].includes(assignedRole);
            if (sameUserId || sameRole) {
              staleSocketsToEvict.push(existingSockId);
            }
          }
        });

        staleSocketsToEvict.forEach((staleSockId) => {
          const staleData = participantsMap.get(staleSockId);
          console.log(`[Socket] Evicting stale socket ${staleSockId} for ${staleData?.userName} (${staleData?.role}) in ${roomKey}`);
          participantsMap.delete(staleSockId);
          socket.to(roomKey).emit("peer-left", {
            socketId: staleSockId,
            userName: staleData?.userName,
            role: staleData?.role,
          });
          const staleSock = io.sockets.sockets.get(staleSockId);
          if (staleSock) {
            staleSock.leave(roomKey);
          }
        });

        const participantInfo = {
          socketId: socket.id,
          userId,
          role: assignedRole,
          userName: resolvedName,
          isVideoEnabled: true,
          isAudioEnabled: true,
          joinedAt: new Date(),
        };

        participantsMap.set(socket.id, participantInfo);
        socket.data.consultationInfo = { roomKey, appointmentId, ...participantInfo };

        // If appointment was Confirmed, transition to In Progress on live room entrance
        let modified = false;
        if (appointment.status === "Confirmed") {
          appointment.status = "In Progress";
          modified = true;
        }
        if (!appointment.consultationStartedAt) {
          appointment.consultationStartedAt = new Date();
          appointment.consultationStatus = "in_progress";
          modified = true;
        }
        if (assignedRole === "interpreter" && appointment.interpreterStatus !== "Active") {
          appointment.interpreterStatus = "Active";
          modified = true;
        }
        if (modified) {
          await appointment.save();
        }

        // Get existing peers in the room (excluding this socket)
        const existingPeers = [];
        participantsMap.forEach((info, sockId) => {
          if (sockId !== socket.id) {
            existingPeers.push(info);
          }
        });

        console.log(
          `[Socket] User ${participantInfo.userName} (${participantInfo.role}, socket: ${socket.id}) joined ${roomKey}. Existing peers: ${existingPeers.map(p => `${p.userName}[${p.role}]`).join(", ") || "none"}`
        );

        // Acknowledge to current user
        const joinPayload = {
          success: true,
          appointmentId,
          appointment,
          participant: participantInfo,
          existingPeers,
        };

        if (callback) callback(joinPayload);
        socket.emit("consultation-joined", joinPayload);

        // Notify other participants in the room
        socket.to(roomKey).emit("peer-joined", participantInfo);
      } catch (error) {
        console.error("Error in join-consultation:", error);
        if (callback) callback({ success: false, message: error.message });
        socket.emit("consultation-error", { message: error.message });
      }
    });

    // Handler: WebRTC Offer (from caller to receiver)
    socket.on("signal-offer", ({ targetSocketId, offer }) => {
      if (targetSocketId && offer) {
        const info = socket.data.consultationInfo;
        console.log(`[Socket] signal-offer from ${socket.id} (${info?.userName || info?.role || "peer"}) -> ${targetSocketId}`);
        io.to(targetSocketId).emit("signal-offer", {
          senderSocketId: socket.id,
          senderInfo: socket.data.consultationInfo,
          offer,
        });
      }
    });

    // Handler: WebRTC Answer (from receiver back to caller)
    socket.on("signal-answer", ({ targetSocketId, answer }) => {
      if (targetSocketId && answer) {
        const info = socket.data.consultationInfo;
        console.log(`[Socket] signal-answer from ${socket.id} (${info?.userName || info?.role || "peer"}) -> ${targetSocketId}`);
        io.to(targetSocketId).emit("signal-answer", {
          senderSocketId: socket.id,
          senderInfo: socket.data.consultationInfo,
          answer,
        });
      }
    });

    // Handler: WebRTC ICE Candidate Exchange
    socket.on("signal-ice-candidate", ({ targetSocketId, candidate }) => {
      if (targetSocketId && candidate) {
        io.to(targetSocketId).emit("signal-ice-candidate", {
          senderSocketId: socket.id,
          candidate,
        });
      }
    });

    // Handler: Toggle Camera / Microphone
    socket.on("toggle-media", ({ type, enabled }) => {
      const info = socket.data.consultationInfo;
      if (info && info.roomKey) {
        if (type === "video") info.isVideoEnabled = enabled;
        if (type === "audio") info.isAudioEnabled = enabled;

        const participantsMap = roomParticipants.get(info.roomKey);
        if (participantsMap && participantsMap.has(socket.id)) {
          const stored = participantsMap.get(socket.id);
          if (type === "video") stored.isVideoEnabled = enabled;
          if (type === "audio") stored.isAudioEnabled = enabled;
        }

        socket.to(info.roomKey).emit("peer-media-toggled", {
          socketId: socket.id,
          role: info.role,
          userName: info.userName,
          type,
          enabled,
        });
      }
    });

    // Handler: Consultation In-Room Live Chat
    socket.on("send-chat-message", ({ text }) => {
      const info = socket.data.consultationInfo;
      if (info && info.roomKey && text && text.trim()) {
        const msgPayload = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          sender: info.userName,
          role: info.role,
          text: text.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          socketId: socket.id,
        };

        // Broadcast to entire room including sender
        io.in(info.roomKey).emit("chat-message-received", msgPayload);
      }
    });

    // Handler: Explicit End / Complete Consultation
    socket.on("end-consultation", async ({ appointmentId, notes }) => {
      const info = socket.data.consultationInfo;
      const targetAptId = appointmentId || info?.appointmentId;

      if (targetAptId) {
        try {
          const appointment = await Appointment.findById(targetAptId);
          if (appointment) {
            appointment.consultationEndedAt = new Date();
            appointment.consultationStatus = "completed";
            if (notes) appointment.notes = notes;
            await appointment.save();
          }
        } catch (err) {
          console.error("Error updating appointment on end-consultation:", err);
        }

        if (info && info.roomKey) {
          io.in(info.roomKey).emit("consultation-ended", {
            endedBy: info.role,
            endedByName: info.userName,
            appointmentId: targetAptId,
          });
        }
      }
    });

    // Handler: Leave Consultation Room
    socket.on("leave-consultation", () => {
      handleSocketLeave(socket, io);
    });

    // Handler: Disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      handleSocketLeave(socket, io);
    });
  });
}

function handleSocketLeave(socket, io) {
  const info = socket.data.consultationInfo;
  if (!info || !info.roomKey) return;

  const { roomKey, userName, role } = info;
  socket.leave(roomKey);

  const participantsMap = roomParticipants.get(roomKey);
  if (participantsMap) {
    participantsMap.delete(socket.id);
    if (participantsMap.size === 0) {
      roomParticipants.delete(roomKey);
    }
  }

  socket.to(roomKey).emit("peer-left", {
    socketId: socket.id,
    userName,
    role,
  });

  socket.data.consultationInfo = null;
}

module.exports = initConsultationSocket;
