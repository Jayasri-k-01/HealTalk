import API from "./api";

/**
 * Fetch doctors with optional search, specialty, and language filters
 */
export const fetchDoctors = async ({ search = "", specialty = "All Specialties", language = "All Languages" } = {}) => {
  try {
    const params = {};
    if (search) params.search = search;
    if (specialty && specialty !== "All Specialties") params.specialty = specialty;
    if (language && language !== "All Languages") params.language = language;

    const response = await API.get("/doctors", { params });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load doctors";
    throw new Error(message);
  }
};

/**
 * Fetch detailed doctor info by ID
 */
export const fetchDoctorById = async (id) => {
  try {
    const response = await API.get(`/doctors/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load doctor details";
    throw new Error(message);
  }
};

/**
 * Fetch logged-in doctor's profile
 */
export const fetchDoctorProfile = async () => {
  try {
    const response = await API.get("/doctors/profile");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch doctor profile";
    throw new Error(message);
  }
};

/**
 * Fetch patients associated with logged-in doctor from MongoDB
 */
export const fetchDoctorPatients = async () => {
  try {
    const response = await API.get("/doctors/patients");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch patient directory";
    throw new Error(message);
  }
};

/**
 * Fetch authenticated doctor's clinical availability and working hours from MongoDB
 */
export const fetchDoctorAvailability = async () => {
  try {
    const response = await API.get("/doctors/availability");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch doctor availability";
    throw new Error(message);
  }
};

/**
 * Save authenticated doctor's clinical availability, working hours, and blocked dates to MongoDB
 */
export const updateDoctorAvailability = async (availabilityData) => {
  try {
    const response = await API.put("/doctors/availability", availabilityData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to save doctor availability";
    throw new Error(message);
  }
};

/**
 * Update logged-in doctor's profile
 */
export const updateDoctorProfile = async (profileData) => {
  try {
    const response = await API.put("/doctors/profile", profileData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to update doctor profile";
    throw new Error(message);
  }
};

/**
 * Fetch dynamic Doctor Dashboard stats and today's schedule from MongoDB
 */
export const fetchDoctorDashboardStats = async () => {
  try {
    const response = await API.get("/doctors/dashboard-stats");
    if (response.data && response.data.success) {
      return response.data;
    }
  } catch (err) {
    console.warn("Primary dashboard-stats endpoint returned error, computing from profile & appointments:", err.message);
  }

  // Resilient fallback: compute from /doctors/profile and /appointments/my
  try {
    const [profileRes, appointmentsRes] = await Promise.allSettled([
      API.get("/doctors/profile"),
      API.get("/appointments/my"),
    ]);

    const doctorProfile = profileRes.status === "fulfilled" ? profileRes.value.data?.doctor : null;
    const appointments = appointmentsRes.status === "fulfilled" ? (appointmentsRes.value.data?.appointments || []) : [];

    const todayISO = new Date().toISOString().split("T")[0];
    const todayLocale = new Date().toLocaleDateString();

    const isToday = (aptDate) => {
      if (!aptDate) return false;
      const str = String(aptDate).toLowerCase();
      if (str.includes("today") || str === todayISO || str === todayLocale) return true;
      try {
        const d = new Date(aptDate).toISOString().split("T")[0];
        if (d === todayISO) return true;
      } catch (e) {}
      return false;
    };

    const parseAppointmentDateTime = (dateStr, timeStr) => {
      if (!dateStr) return null;
      let year, month, day;
      if (typeof dateStr === "string" && dateStr.includes("-")) {
        const parts = dateStr.split("-");
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
      let hours = 0;
      let minutes = 0;
      if (timeStr && typeof timeStr === "string") {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
          hours = parseInt(match[1], 10);
          minutes = parseInt(match[2], 10);
          const modifier = match[3] ? match[3].toUpperCase() : null;
          if (modifier === "PM" && hours < 12) hours += 12;
          if (modifier === "AM" && hours === 12) hours = 0;
        }
      }
      return new Date(year, month, day, hours, minutes, 0);
    };

    const isUpcoming = (apt) => {
      if (!apt || apt.status === "Cancelled" || apt.status === "Completed") return false;
      const aptDate = parseAppointmentDateTime(apt.date, apt.time);
      if (!aptDate) return false;
      return aptDate.getTime() >= Date.now();
    };

    const todayAppointments = appointments.filter((apt) => isToday(apt.date));
    const completedToday = todayAppointments.filter((apt) => apt.status === "Completed").length;
    const remainingToday = todayAppointments.filter((apt) => apt.status !== "Completed").length;
    const upcomingAppointments = appointments.filter((apt) => isUpcoming(apt));

    const uniquePatients = new Set();
    appointments.forEach((apt) => {
      if (apt.patient?._id) uniquePatients.add(String(apt.patient._id));
      else if (apt.patient?.name) uniquePatients.add(apt.patient.name);
      else if (apt.patient) uniquePatients.add(String(apt.patient));
    });

    const todaySchedule = todayAppointments.map((apt) => {
      const patientName = apt.patient?.name || "Patient";
      const isVideo = (apt.type || "Video Call").toLowerCase().includes("video");
      return {
        id: String(apt._id),
        patientId: apt.patient?._id ? String(apt.patient._id) : `PAT-${apt._id}`,
        patientName,
        patientAge: apt.patient?.age || 35,
        patientGender: apt.patient?.gender || "Patient",
        time: apt.time,
        type: isVideo ? "video" : "chat",
        language: apt.patient?.language || apt.interpreterLanguage || "English",
        requiresInterpreter: !!apt.interpreterRequested,
        interpreterName: apt.interpreterLanguage ? `${apt.interpreterLanguage} Interpreter` : null,
        status: apt.status || "Confirmed",
        reason: apt.reason || "General Medical Consultation",
        isJoinable: apt.status === "Confirmed" || apt.status === "In Progress",
      };
    });

    const activeApt = todaySchedule.find(
      (apt) => apt.status === "In Progress" || apt.isJoinable
    );

    return {
      success: true,
      stats: {
        todayAppointments: todayAppointments.length,
        completedToday,
        remainingToday,
        upcomingConsultations: upcomingAppointments.length,
        totalPatientsSeen: uniquePatients.size,
        rating: doctorProfile?.rating !== undefined ? Number(doctorProfile.rating) : 4.8,
        reviews: doctorProfile?.reviews !== undefined ? Number(doctorProfile.reviews) : 50,
      },
      todaySchedule,
      activeConsultation: activeApt || null,
      doctor: {
        name: doctorProfile?.name || "Doctor",
        specialty: doctorProfile?.specialty || "General Physician",
        rating: doctorProfile?.rating !== undefined ? Number(doctorProfile.rating) : 4.8,
        reviews: doctorProfile?.reviews !== undefined ? Number(doctorProfile.reviews) : 50,
      },
    };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to fetch doctor dashboard statistics";
    throw new Error(message);
  }
};

