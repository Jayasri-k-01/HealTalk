const User = require("../models/User");
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");

// In-memory or persisted session storage per user
const chatHistories = new Map();

/**
 * GET /api/assistant/context - Load real authenticated patient medical profile
 */
const getPatientContext = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select(
      "name email language age gender bloodGroup allergies chronicConditions currentMedications vitals"
    );

    if (!userDoc) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const [prescriptions, appointments] = await Promise.all([
      Prescription.find({ patient: req.user.id }).sort({ createdAt: -1 }),
      Appointment.find({ patient: req.user.id }).sort({ createdAt: -1 }).limit(5),
    ]);

    const activeRx = prescriptions.filter(
      (p) => p.status === "Active" || !p.status
    );

    res.json({
      success: true,
      patient: {
        name: userDoc.name,
        email: userDoc.email,
        language: userDoc.language || "English",
        age: userDoc.age || null,
        gender: userDoc.gender || "",
        bloodGroup: userDoc.bloodGroup || "",
        allergies: userDoc.allergies || [],
        chronicConditions: userDoc.chronicConditions || [],
        currentMedications: userDoc.currentMedications || [],
        vitals: userDoc.vitals || {},
      },
      activePrescriptionsCount: activeRx.length,
      prescriptions: activeRx.slice(0, 5),
      recentAppointments: appointments,
    });
  } catch (error) {
    console.error("Error fetching patient context for AI assistant:", error);
    res.status(500).json({
      message: "Failed to fetch patient context",
      error: error.message,
    });
  }
};

/**
 * Intelligent multilingual health response generator incorporating real patient clinical context
 */
function generateClinicalGuidance(query, language, patientContext) {
  const q = (query || "").toLowerCase();
  const lang = (language || patientContext?.language || "English").toLowerCase();
  const name = patientContext?.name || "Patient";

  const hasAllergies = patientContext?.allergies && patientContext.allergies.length > 0;
  const allergiesList = hasAllergies ? patientContext.allergies.join(", ") : "";

  const hasChronic = patientContext?.chronicConditions && patientContext.chronicConditions.length > 0;
  const chronicList = hasChronic ? patientContext.chronicConditions.join(", ") : "";

  // Multilingual greetings & intros
  const isSpanish = lang.includes("spanish") || lang.includes("español");
  const isHindi = lang.includes("hindi") || lang.includes("हिन्दी");
  const isFrench = lang.includes("french") || lang.includes("français");
  const isMandarin = lang.includes("mandarin") || lang.includes("chinese");
  const isTamil = lang.includes("tamil") || lang.includes("தமிழ்");
  const isGerman = lang.includes("german") || lang.includes("deutsch");

  let advice = "";

  if (q.includes("headache") || q.includes("migraine") || q.includes("dolor de cabeza") || q.includes("सिरदर्द")) {
    if (isSpanish) {
      advice = `Para el dolor de cabeza: descanse en un ambiente tranquilo y con poca luz, manténgase bien hidratado y evite pantallas brillantes. Si el dolor es severo, repentino ("en trueno") o se acompaña de rigidez en el cuello, busque atención médica de urgencia. ${hasAllergies ? `Tenga en cuenta sus alergias registradas (${allergiesList}) al consultar cualquier medicación.` : ""}`;
    } else if (isHindi) {
      advice = `सिरदर्द के लिए: शांत और मंद रोशनी वाले कमरे में आराम करें, पर्याप्त पानी पिएं और स्क्रीन के उपयोग से बचें। यदि सिरदर्द अचानक और बहुत गंभीर हो या गर्दन में अकड़न हो, तो तुरंत डॉक्टर से परामर्श लें। ${hasAllergies ? `दवा लेते समय अपनी ज्ञात एलर्जी (${allergiesList}) का ध्यान रखें।` : ""}`;
    } else if (isFrench) {
      advice = `Pour les maux de tête: reposez-vous dans une pièce calme et sombre, hydratez-vous abondamment et évitez les écrans. Consultez immédiatement un médecin si le mal de tête est brutal et inhabituellement intense. ${hasAllergies ? `Attention à vos allergies signalées (${allergiesList}).` : ""}`;
    } else {
      advice = `For headaches: rest in a quiet, dimly lit room, stay well-hydrated with water, and reduce screen time. Tension headaches often improve with gentle neck stretches and cold/warm compresses. Seek immediate medical attention if the headache is sudden and excruciating ("thunderclap") or accompanied by high fever or neck stiffness. ${hasAllergies ? `Please be cautious of your recorded allergies (${allergiesList}) when considering over-the-counter options.` : ""}`;
    }
  } else if (q.includes("fever") || q.includes("temperature") || q.includes("fiebre") || q.includes("बुखार") || q.includes("fièvre")) {
    if (isSpanish) {
      advice = `Para la fiebre: manténgase bien hidratado, descanse adecuadamente y use ropa ligera. Monitoree su temperatura cada 4 horas. Si la fiebre supera los 39.4°C (103°F) o dura más de 3 días, consulte a su médico de HealTalk.`;
    } else if (isHindi) {
      advice = `बुखार के लिए: पर्याप्त मात्रा में पानी और तरल पदार्थ लें, पूरा आराम करें और हल्के कपड़े पहनें। हर 4 घंटे में तापमान की जांच करें। यदि बुखार 103°F (39.4°C) से अधिक हो या 3 दिन से अधिक रहे, तो तुरंत डॉक्टर से संपर्क करें।`;
    } else if (isFrench) {
      advice = `Pour la fièvre: buvez beaucoup de liquides, reposez-vous et portez des vêtements légers. Si la température dépasse 39,4°C ou persiste plus de 72 heures, consultez un médecin.`;
    } else {
      advice = `For fever management: ensure adequate hydration with water and electrolyte fluids, get ample rest, and wear lightweight, breathable clothing. Monitor your temperature every 4 to 6 hours. Seek immediate medical evaluation if fever exceeds 103°F (39.4°C), lasts more than 3 consecutive days, or is accompanied by difficulty breathing.`;
    }
  } else if (q.includes("hypertension") || q.includes("blood pressure") || q.includes("presión") || q.includes("रक्तचाप") || q.includes("tension")) {
    if (isSpanish) {
      advice = `La presión arterial saludable se mantiene por debajo de 120/80 mmHg. Reduzca la ingesta de sodio (sal), realice actividad física moderada y mantenga un registro diario de sus lecturas matutinas y nocturnas. ${hasChronic ? `Dado su historial de (${chronicList}), el seguimiento médico regular es fundamental.` : ""}`;
    } else if (isHindi) {
      advice = `सामान्य रक्तचाप 120/80 mmHg से कम होता है। नमक का सेवन कम करें, नियमित व्यायाम करें और सुबह-शाम रक्तचाप की रीडिंग नोट करें। ${hasChronic ? `आपकी स्वास्थ्य स्थिति (${chronicList}) को देखते हुए डॉक्टर से नियमित जांच आवश्यक है।` : ""}`;
    } else {
      advice = `Blood pressure management: normal readings are generally under 120/80 mmHg. Reduce dietary sodium, practice daily stress-reduction techniques, and maintain a consistent log of your morning and evening readings. ${hasChronic ? `With your recorded conditions (${chronicList}), regular monitoring with your HealTalk physician is highly recommended.` : ""}`;
    }
  } else if (q.includes("cough") || q.includes("cold") || q.includes("flu") || q.includes("tos") || q.includes("खांसी") || q.includes("toux")) {
    if (isSpanish) {
      advice = `Para tos y resfriado: beba líquidos tibios como té con miel, use inhalaciones de vapor o solución salina para despejar las vías respiratorias y descanse. Si presenta dificultad para respirar, dolor en el pecho o tos con flema sanguinolenta, consulte de inmediato.`;
    } else if (isHindi) {
      advice = `खांसी और जुकाम के लिए: गुनगुना पानी पिएं, शहद और अदरक का सेवन करें, भाप लें और आराम करें। यदि सांस लेने में कठिनाई हो या सीने में दर्द हो, तो तुरंत डॉक्टर को दिखाएं।`;
    } else {
      advice = `For cold and cough symptoms: drink warm soothing liquids (such as honey lemon tea), utilize saline nasal sprays or steam inhalation to relieve congestion, and prioritize rest. Consult your doctor promptly if you develop shortness of breath, chest pain, wheezing, or symptoms lasting longer than 10 days.`;
    }
  } else if (q.includes("appointment") || q.includes("doctor") || q.includes("question") || q.includes("pregunta") || q.includes("डॉक्टर")) {
    if (isSpanish) {
      advice = `Preguntas útiles para su próxima consulta: 1) ¿Cuál es la causa más probable de mis síntomas? 2) ¿Hay pruebas de diagnóstico recomendadas? 3) ¿Cuáles son los efectos secundarios de los medicamentos prescritos? 4) ¿Qué cambios en mi estilo de vida pueden ayudar?`;
    } else if (isHindi) {
      advice = `अपने डॉक्टर से पूछने के लिए महत्वपूर्ण प्रश्न: 1) मेरे लक्षणों का मुख्य कारण क्या है? 2) क्या किसी जांच की आवश्यकता है? 3) दवाओं के संभावित दुष्प्रभाव क्या हैं? 4) खान-पान और दिनचर्या में क्या बदलाव करने चाहिए?`;
    } else {
      advice = `Recommended questions for your consultation with your doctor: 1) What is the most likely cause of my symptoms? 2) Are there diagnostic tests or blood work required? 3) What are the potential side effects or interactions of my treatments? 4) What specific red-flag symptoms should prompt immediate emergency care?`;
    }
  } else {
    if (isSpanish) {
      advice = `Gracias por consultar sobre "${query}". Para una evaluación precisa, le sugerimos anotar la duración y gravedad de sus síntomas y compartirlos en una teleconsulta médica a través de HealTalk.`;
    } else if (isHindi) {
      advice = `आपके प्रश्न "${query}" के लिए धन्यवाद। सटीक निदान और उपचार के लिए, कृपया अपने लक्षणों के समय और तीव्रता को नोट करें और HealTalk डॉक्टर से परामर्श लें।`;
    } else if (isFrench) {
      advice = `Merci pour votre question concernant "${query}". Pour un avis médical précis adapté à votre profil, nous vous recommandons de planifier une téléconsultation avec un praticien HealTalk.`;
    } else {
      advice = `Thank you for sharing your query regarding "${query}". For comprehensive evaluation tailored to your clinical profile, consider noting when these symptoms started and their intensity, and scheduling a telemedicine review with your HealTalk physician.`;
    }
  }

  // Include safety reminder
  const disclaimer = isSpanish
    ? "\n\n*Nota: Esta orientación es informativa y no reemplaza el diagnóstico médico profesional.*"
    : isHindi
    ? "\n\n*सूचना: यह जानकारी केवल मार्गदर्शन के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।*"
    : isFrench
    ? "\n\n*Avis: Ces informations sont indicatives et ne remplacent pas un avis médical.*"
    : "\n\n*Notice: AI guidance is for preliminary information and does not replace direct diagnosis from a licensed medical practitioner.*";

  return advice + disclaimer;
}

/**
 * POST /api/assistant/chat - Process patient AI health assistant queries with JWT and clinical context
 */
const handleChat = async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Please provide a query message" });
    }

    // Fetch real patient context from MongoDB
    const userDoc = await User.findById(req.user.id).select(
      "name language age gender bloodGroup allergies chronicConditions currentMedications vitals"
    );

    const [prescriptions, appointments] = await Promise.all([
      Prescription.find({ patient: req.user.id }).sort({ createdAt: -1 }),
      Appointment.find({ patient: req.user.id }).sort({ createdAt: -1 }).limit(3),
    ]);

    const targetLang = language || userDoc?.language || "English";

    const patientContext = {
      name: userDoc?.name || "Patient",
      language: targetLang,
      age: userDoc?.age || null,
      gender: userDoc?.gender || "",
      bloodGroup: userDoc?.bloodGroup || "",
      allergies: userDoc?.allergies || [],
      chronicConditions: userDoc?.chronicConditions || [],
      currentMedications: userDoc?.currentMedications || [],
      prescriptionsCount: prescriptions.length,
      appointmentsCount: appointments.length,
    };

    const aiResponseText = generateClinicalGuidance(
      message.trim(),
      targetLang,
      patientContext
    );

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Store in session history for user
    const userId = req.user.id.toString();
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, []);
    }
    const history = chatHistories.get(userId);
    history.push(
      { id: Date.now(), sender: "user", text: message.trim(), time: timeStr },
      { id: Date.now() + 1, sender: "ai", text: aiResponseText, time: timeStr }
    );
    if (history.length > 50) history.splice(0, history.length - 50);

    res.json({
      success: true,
      response: aiResponseText,
      language: targetLang,
      patientContext: {
        name: patientContext.name,
        allergies: patientContext.allergies,
        chronicConditions: patientContext.chronicConditions,
      },
      time: timeStr,
    });
  } catch (error) {
    console.error("Error in AI health assistant chat:", error);
    res.status(500).json({
      message: "Failed to process health query",
      error: error.message,
    });
  }
};

/**
 * GET /api/assistant/history - Get patient's AI assistant conversation history
 */
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const history = chatHistories.get(userId) || [];
    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Error fetching AI assistant history:", error);
    res.status(500).json({
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/assistant/history - Clear conversation history
 */
const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    chatHistories.delete(userId);
    res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing AI assistant history:", error);
    res.status(500).json({
      message: "Failed to clear chat history",
      error: error.message,
    });
  }
};

module.exports = {
  getPatientContext,
  handleChat,
  getChatHistory,
  clearChatHistory,
};
