const { io } = require("../client/node_modules/socket.io-client");

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

async function apiRequest(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

async function runTest() {
  console.log("=== HEALTALK VIDEO CONSULTATION END-TO-END TEST ===");

  try {
    // 1. Patient Login
    console.log("1. Logging in Patient (patient@healtalk.com)...");
    const patientLoginRes = await apiRequest("/auth/login", "POST", {
      email: "patient@healtalk.com",
      password: "Patient@123",
    });
    const patientToken = patientLoginRes.token;
    const patientUser = patientLoginRes.user;
    console.log("✓ Patient logged in:", patientUser.name, "ID:", patientUser.id);

    // 2. Doctor Login
    console.log("2. Logging in Doctor (doctor@healtalk.com)...");
    const doctorLoginRes = await apiRequest("/auth/login", "POST", {
      email: "doctor@healtalk.com",
      password: "Doctor@123",
    });
    const doctorToken = doctorLoginRes.token;
    const doctorUser = doctorLoginRes.user;
    console.log("✓ Doctor logged in:", doctorUser.name, "ID:", doctorUser.id);

    // 3. Get or Create an Appointment
    console.log("3. Fetching doctor list...");
    const doctorsRes = await apiRequest("/doctors");
    const doctorList = doctorsRes.doctors || doctorsRes;
    const targetDoc = doctorList[0];
    console.log("✓ Target Doctor:", targetDoc.name, "ID:", targetDoc._id);

    console.log("4. Booking / finding consultation slot...");
    let appointment;
    const existingApts = await apiRequest("/appointments/my", "GET", null, patientToken);

    const activeApt = (existingApts.appointments || []).find(
      (a) =>
        (a.status === "Confirmed" || a.status === "In Progress") &&
        (String(a.doctor?._id || a.doctor) === String(targetDoc._id) ||
         a.doctorName?.toLowerCase() === targetDoc.name?.toLowerCase())
    );

    if (activeApt) {
      appointment = activeApt;
      console.log("✓ Found existing eligible appointment with target doctor:", appointment._id, "Status:", appointment.status);
    } else {
      const today = new Date().toISOString().split("T")[0];
      const bookRes = await apiRequest(
        "/appointments",
        "POST",
        {
          doctorId: targetDoc._id,
          date: today,
          time: "04:30 PM",
          type: "Video Call",
          reason: "Cardiology follow up consultation",
        },
        patientToken
      );
      appointment = bookRes.appointment;
      console.log("✓ Created appointment:", appointment._id, "Status:", appointment.status);

      // Confirm appointment as doctor
      const confirmRes = await apiRequest(
        `/appointments/${appointment._id}/confirm`,
        "PUT",
        {},
        doctorToken
      );
      appointment = confirmRes.appointment;
      console.log("✓ Confirmed appointment as Doctor. Status:", appointment.status);
    }

    const appointmentId = appointment._id;

    // 5. Test WebRTC Socket.IO Signaling Flow
    console.log("\n5. Testing WebRTC Socket.IO Signaling between Patient & Doctor...");

    const patientSocket = io(SOCKET_URL, {
      auth: { token: patientToken },
      transports: ["websocket"],
    });

    const doctorSocket = io(SOCKET_URL, {
      auth: { token: doctorToken },
      transports: ["websocket"],
    });

    await new Promise((resolve) => {
      let patientConnected = false;
      let doctorConnected = false;

      patientSocket.on("connect", () => {
        console.log("✓ Patient socket connected:", patientSocket.id);
        patientConnected = true;
        if (doctorConnected) resolve();
      });

      doctorSocket.on("connect", () => {
        console.log("✓ Doctor socket connected:", doctorSocket.id);
        doctorConnected = true;
        if (patientConnected) resolve();
      });
    });

    // Patient joins consultation
    console.log("6. Patient joining room for appointment", appointmentId);
    const patientJoinPromise = new Promise((resolve, reject) => {
      patientSocket.emit(
        "join-consultation",
        {
          appointmentId,
          token: patientToken,
          role: "patient",
          userName: patientUser.name,
        },
        (res) => {
          if (res && res.success) {
            console.log("✓ Patient room joined callback received. Existing peers:", res.existingPeers.length);
            resolve(res);
          } else {
            reject(new Error(res?.message || "Join failed"));
          }
        }
      );
    });
    await patientJoinPromise;

    // Doctor joins consultation
    console.log("7. Doctor joining room for appointment", appointmentId);
    const doctorJoinedPromise = new Promise((resolve, reject) => {
      doctorSocket.emit(
        "join-consultation",
        {
          appointmentId,
          token: doctorToken,
          role: "doctor",
          userName: doctorUser.name,
        },
        (res) => {
          if (res && res.success) {
            console.log("✓ Doctor room joined callback received. Existing peers:", res.existingPeers.length);
            resolve(res);
          } else {
            reject(new Error(res?.message || "Join failed"));
          }
        }
      );
    });

    const patientPeerJoinedPromise = new Promise((resolve) => {
      patientSocket.on("peer-joined", (peer) => {
        console.log("✓ Patient received 'peer-joined' event from Doctor:", peer.userName, `(${peer.role})`);
        resolve(peer);
      });
    });

    await Promise.all([doctorJoinedPromise, patientPeerJoinedPromise]);

    // 8. Test WebRTC Signaling Exchange: Offer -> Answer -> ICE Candidate
    console.log("\n8. Testing WebRTC SDP Offer/Answer and ICE Candidate Exchange...");

    const dummyOffer = { type: "offer", sdp: "v=0\r\no=HealTalkPatient 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n" };
    const dummyAnswer = { type: "answer", sdp: "v=0\r\no=HealTalkDoctor 54321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n" };
    const dummyCandidate = { candidate: "candidate:1 1 UDP 2130706431 127.0.0.1 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 };

    const offerReceivedPromise = new Promise((resolve) => {
      doctorSocket.on("signal-offer", (data) => {
        console.log("✓ Doctor received 'signal-offer' from socket:", data.senderSocketId);
        resolve(data);
      });
    });

    patientSocket.emit("signal-offer", {
      targetSocketId: doctorSocket.id,
      offer: dummyOffer,
    });

    await offerReceivedPromise;

    const answerReceivedPromise = new Promise((resolve) => {
      patientSocket.on("signal-answer", (data) => {
        console.log("✓ Patient received 'signal-answer' from socket:", data.senderSocketId);
        resolve(data);
      });
    });

    doctorSocket.emit("signal-answer", {
      targetSocketId: patientSocket.id,
      answer: dummyAnswer,
    });

    await answerReceivedPromise;

    const candidateReceivedPromise = new Promise((resolve) => {
      doctorSocket.on("signal-ice-candidate", (data) => {
        console.log("✓ Doctor received 'signal-ice-candidate' from socket:", data.senderSocketId);
        resolve(data);
      });
    });

    patientSocket.emit("signal-ice-candidate", {
      targetSocketId: doctorSocket.id,
      candidate: dummyCandidate,
    });

    await candidateReceivedPromise;

    // 9. Test Media Toggling (Camera & Mic)
    console.log("\n9. Testing Media Toggle Signaling...");
    const mediaTogglePromise = new Promise((resolve) => {
      doctorSocket.on("peer-media-toggled", (data) => {
        console.log(`✓ Doctor received peer-media-toggled: ${data.userName} toggled ${data.type} to ${data.enabled}`);
        resolve(data);
      });
    });

    patientSocket.emit("toggle-media", {
      type: "video",
      enabled: false,
    });

    await mediaTogglePromise;

    // 10. Test In-Room Live Chat Message
    console.log("\n10. Testing In-Room Real-Time Chat Message...");
    const chatMsgPromise = new Promise((resolve) => {
      doctorSocket.on("chat-message-received", (data) => {
        console.log(`✓ Doctor received chat message from ${data.sender} (${data.role}): "${data.text}"`);
        resolve(data);
      });
    });

    patientSocket.emit("send-chat-message", {
      text: "Hello Dr. Elena, I am ready for the consultation.",
    });

    await chatMsgPromise;

    console.log("\n✓ ALL VIDEO CONSULTATION SOCKET & SIGNALING TESTS PASSED SUCCESSFULLY!");

    patientSocket.disconnect();
    doctorSocket.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    process.exit(1);
  }
}

runTest();
