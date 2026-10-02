// TEMP: replace with API call (e.g. GET /api/doctor/consultations/active and /api/doctor/consultation-history)

export const mockActiveConsultation = {
  id: "CONSULT-8921",
  appointmentId: "APT-2026-002",
  patient: {
    id: "PAT-002",
    name: "Robert Fox",
    age: 58,
    gender: "Male",
    bloodGroup: "O+",
    language: "Spanish",
    avatar: null,
    allergies: ["Penicillin", "Sulfa drugs"],
    chronicConditions: ["Essential Hypertension (5 yrs)", "Hyperlipidemia"],
    currentMedications: [
      { name: "Lisinopril", dose: "10 mg", freq: "Once daily" },
      { name: "Atorvastatin", dose: "20 mg", freq: "Nightly" },
      { name: "Aspirin", dose: "81 mg", freq: "Daily" },
    ],
    vitals: {
      bloodPressure: "142/90 mmHg",
      heartRate: "76 bpm",
      oxygenSat: "98%",
      temperature: "98.6 °F",
      weight: "82 kg",
      height: "178 cm",
    },
    previousNotes: [
      "Last visit (3 mos ago): BP 138/88 mmHg. Advised low sodium diet (DASH diet).",
      "ECG (6 mos ago): Normal sinus rhythm, mild LVH voltage criteria without strain pattern.",
    ],
  },
  interpreter: {
    status: "Requested", // Available, Requested, Connected, None
    language: "Spanish",
    name: "Maria Rodriguez",
    certification: "CCHI Certified Medical Interpreter",
  },
  consultationType: "Video Consultation",
  startedAt: "10:15 AM",
  duration: "12:45",
  chatMessages: [
    {
      id: "msg-1",
      sender: "system",
      text: "Encrypted telehealth consultation room opened. Compliant with HIPAA & HealTalk Telehealth Standards.",
      time: "10:15 AM",
    },
    {
      id: "msg-2",
      sender: "patient",
      senderName: "Robert Fox",
      text: "Hello Doctor, I can hear you clearly now.",
      time: "10:16 AM",
    },
    {
      id: "msg-3",
      sender: "doctor",
      senderName: "Dr. Elena Rostova",
      text: "Good morning Mr. Fox. I am reviewing your blood pressure logs from this past month.",
      time: "10:17 AM",
    },
    {
      id: "msg-4",
      sender: "patient",
      senderName: "Robert Fox",
      text: "Yes, I noticed some higher morning readings around 145/92 over the last two weeks.",
      time: "10:18 AM",
    },
  ],
};

export const mockAvailableLanguagesForInterpreter = [
  "Spanish",
  "Mandarin Chinese",
  "Hindi",
  "French",
  "Arabic",
  "Portuguese",
  "Russian",
  "German",
  "Vietnamese",
  "Tagalog",
];
