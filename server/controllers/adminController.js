const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// GET /api/admin/dashboard - Calculate real aggregate metrics
const getDashboardStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalInterpreters = await User.countDocuments({ role: "interpreter" });
    const totalAppointments = await Appointment.countDocuments({});

    const pendingDoctors = await User.countDocuments({
      role: "doctor",
      status: "pending",
    });

    const pendingInterpreters = await User.countDocuments({
      role: "interpreter",
      status: "pending",
    });

    res.json({
      totalPatients,
      totalDoctors,
      totalInterpreters,
      totalAppointments,
      pendingDoctors,
      pendingInterpreters,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard statistics:", error);
    res.status(500).json({
      message: "Unable to load dashboard statistics",
      error: error.message,
    });
  }
};

// GET /api/admin/users - List users with server-side search, filtering, and pagination
const getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "", status = "", page = 1, limit = 10 } = req.query;

    const query = {};

    if (role && role.toLowerCase() !== "all") {
      query.role = role.toLowerCase();
    }

    if (status && status.toLowerCase() !== "all") {
      query.status = status.toLowerCase();
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      users,
      currentPage: pageNum,
      totalPages: Math.ceil(totalUsers / limitNum) || 1,
      totalUsers,
    });
  } catch (error) {
    console.error("Error fetching admin users list:", error);
    res.status(500).json({
      message: "Unable to load users.",
      error: error.message,
    });
  }
};

// GET /api/admin/users/:id - Fetch single user details
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let doctorProfile = null;
    if (user.role === "doctor") {
      doctorProfile = await Doctor.findOne({
        $or: [{ user: user._id }, { name: user.name }],
      }).lean();
    }

    res.json({
      ...user,
      doctorProfile,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      message: "Failed to fetch user details.",
      error: error.message,
    });
  }
};

// PATCH /api/admin/users/:id/status - Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, rejectionReason } = req.body;

    const validStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status value. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.email === "admin@healtalk.com" && status === "suspended") {
      return res.status(400).json({ message: "Primary administrator account cannot be suspended." });
    }

    user.status = status;
    user.isVerified = status === "approved";
    if (status === "rejected") {
      user.rejectionReason = (rejectionReason || reason || "").trim();
    } else if (status === "approved") {
      user.rejectionReason = "";
    }
    await user.save();

    res.json({
      message: `User status updated to ${status}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      message: "Failed to update user status.",
      error: error.message,
    });
  }
};

// ============================================================================
// STEP 4: DOCTOR VERIFICATION CONTROLLERS
// ============================================================================

// GET /api/admin/doctors - List doctor applications with optional status filter (e.g. pending/approved/rejected/all)
const getDoctorApplications = async (req, res) => {
  try {
    const { status = "pending", search = "", page = 1, limit = 10 } = req.query;

    const query = { role: "doctor" };

    if (status && status.toLowerCase() !== "all") {
      query.status = status.toLowerCase();
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex },
        { licenseNumber: searchRegex },
        { hospital: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const totalApplications = await User.countDocuments(query);
    const doctors = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const pendingCount = await User.countDocuments({ role: "doctor", status: "pending" });
    const approvedCount = await User.countDocuments({ role: "doctor", status: "approved" });
    const rejectedCount = await User.countDocuments({ role: "doctor", status: "rejected" });

    res.json({
      doctors,
      currentPage: pageNum,
      totalPages: Math.ceil(totalApplications / limitNum) || 1,
      totalApplications,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        all: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor verification applications:", error);
    res.status(500).json({
      message: "Unable to load doctor applications.",
      error: error.message,
    });
  }
};

// GET /api/admin/doctors/:id - Fetch single doctor verification application details
const getDoctorVerificationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await User.findOne({ _id: id, role: "doctor" }).select("-password").lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor application not found." });
    }

    const doctorProfile = await Doctor.findOne({
      $or: [{ user: doctor._id }, { name: doctor.name }],
    }).lean();

    res.json({
      ...doctor,
      doctorProfile,
    });
  } catch (error) {
    console.error("Error fetching doctor verification details:", error);
    res.status(500).json({
      message: "Failed to load doctor application details.",
      error: error.message,
    });
  }
};

// PATCH /api/admin/doctors/:id/approve - Approve doctor application
const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: "doctor" });

    if (!user) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    user.status = "approved";
    user.isVerified = true;
    user.rejectionReason = "";
    await user.save();

    // Ensure a matching Doctor entry exists in Doctor collection for patient appointments
    await Doctor.findOneAndUpdate(
      { $or: [{ user: user._id }, { name: user.name }] },
      {
        $set: {
          user: user._id,
          name: user.name,
          specialty: user.specialization || "General Physician",
          experience: user.experience || "5 years exp",
          languages: user.language ? [user.language] : ["English"],
          rating: 4.9,
          reviews: 1,
          fee: "$45",
          bio: `${user.name} is a verified medical specialist in ${user.specialization || "General Practice"} practicing at ${user.hospital || "HealTalk Virtual Clinic"}.`,
          availableSlots: ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 3:00 PM"],
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: `Dr. ${user.name} has been approved successfully!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error approving doctor:", error);
    res.status(500).json({
      message: "Failed to approve doctor application.",
      error: error.message,
    });
  }
};

// PATCH /api/admin/doctors/:id/reject - Reject doctor application
const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const user = await User.findOne({ _id: id, role: "doctor" });

    if (!user) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    user.status = "rejected";
    user.isVerified = false;
    user.rejectionReason =
      rejectionReason?.trim() || "Application did not meet medical verification requirements.";
    await user.save();

    res.json({
      message: `Doctor application for ${user.name} has been rejected.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Error rejecting doctor:", error);
    res.status(500).json({
      message: "Failed to reject doctor application.",
      error: error.message,
    });
  }
};

// ============================================================================
// STEP 5: ADMIN DOCTORS MANAGEMENT CONTROLLERS
// ============================================================================

// GET /api/admin/doctors - Fetch verified/managed doctors with practice details & counts
const getAdminDoctors = async (req, res) => {
  try {
    const { status, search, specialty, page, limit } = req.query;

    const rawStatus = (status || "").toLowerCase().trim();
    let statusFilter = null;

    if (rawStatus === "approved" || rawStatus === "active") {
      statusFilter = "approved";
    } else if (rawStatus === "suspended" || rawStatus === "inactive") {
      statusFilter = "suspended";
    } else if (rawStatus === "pending") {
      statusFilter = "pending";
    } else if (rawStatus === "rejected") {
      statusFilter = "rejected";
    } else if (rawStatus === "all") {
      statusFilter = { $in: ["approved", "suspended"] };
    } else {
      statusFilter = { $in: ["approved", "suspended"] };
    }

    const query = { role: "doctor", status: statusFilter };

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
        { licenseNumber: searchRegex },
      ];
    }

    if (specialty && specialty.toLowerCase() !== "all" && specialty.trim() !== "") {
      query.specialization = new RegExp(specialty.trim(), "i");
    }

    let doctorUsersQuery = User.find(query).select("-password").sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      doctorUsersQuery = doctorUsersQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const doctorUsers = await doctorUsersQuery.lean();

    const userIds = doctorUsers.map((u) => u._id);
    const doctorNames = doctorUsers.map((u) => u.name);

    const doctorProfiles = await Doctor.find({
      $or: [{ user: { $in: userIds } }, { name: { $in: doctorNames } }],
    }).lean();

    const profileMapByUserId = new Map();
    const profileMapByName = new Map();
    doctorProfiles.forEach((p) => {
      if (p.user) profileMapByUserId.set(String(p.user), p);
      if (p.name) profileMapByName.set(p.name.toLowerCase().trim(), p);
    });

    const formattedDoctors = doctorUsers.map((docUser) => {
      const profile =
        profileMapByUserId.get(String(docUser._id)) ||
        profileMapByName.get((docUser.name || "").toLowerCase().trim());

      const languages =
        profile?.languages?.length > 0
          ? profile.languages
          : docUser.language
          ? [docUser.language]
          : ["English"];

      const specialtyVal =
        docUser.specialization || profile?.specialty || "General Medicine";

      // Fee: ONLY what doctor provided, never default to $45 or any arbitrary fee
      const feeVal =
        profile?.fee && String(profile.fee).trim() !== ""
          ? String(profile.fee).trim()
          : docUser.fee && String(docUser.fee).trim() !== ""
          ? String(docUser.fee).trim()
          : null;

      const expVal = docUser.experience || profile?.experience || "";
      const hospitalVal = docUser.hospital || "";
      const licenseVal = docUser.licenseNumber || "";

      return {
        _id: docUser._id,
        id: docUser._id,
        name: docUser.name,
        email: docUser.email,
        phone: docUser.phone || "",
        specialty: specialtyVal,
        specialization: specialtyVal,
        qualification: docUser.qualification || "",
        experience: expVal,
        languages: languages,
        language: languages[0] || "English",
        consultationFee: feeVal,
        fee: feeVal,
        hospital: hospitalVal,
        licenseNumber: licenseVal,
        status: docUser.status,
        isVerified: docUser.isVerified || docUser.status === "approved",
        bio: profile?.bio || docUser.bio || "",
        availableSlots: profile?.availableSlots || [],
        rating: profile?.rating || null,
        reviews: profile?.reviews || 0,
        createdAt: docUser.createdAt,
        updatedAt: docUser.updatedAt,
      };
    });

    const totalApproved = await User.countDocuments({
      role: "doctor",
      status: "approved",
    });
    const totalSuspended = await User.countDocuments({
      role: "doctor",
      status: "suspended",
    });
    const totalPending = await User.countDocuments({
      role: "doctor",
      status: "pending",
    });
    const totalRejected = await User.countDocuments({
      role: "doctor",
      status: "rejected",
    });

    const totalManaged = totalApproved + totalSuspended;

    res.json({
      success: true,
      doctors: formattedDoctors,
      totalDoctors: totalManaged,
      activeDoctors: totalApproved,
      inactiveDoctors: totalSuspended,
      counts: {
        total: totalManaged,
        active: totalApproved,
        inactive: totalSuspended,
        totalDoctors: totalManaged,
        activeDoctors: totalApproved,
        inactiveDoctors: totalSuspended,
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        all: totalManaged + totalPending + totalRejected,
      },
    });
  } catch (error) {
    console.error("Error fetching admin doctors:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load doctors list.",
      error: error.message,
    });
  }
};

// GET /api/admin/doctors/:id - Fetch single doctor full details from MongoDB
const getAdminDoctorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID format." });
    }

    const doctor = await User.findOne({ _id: id, role: "doctor" }).select("-password").lean();

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    const doctorProfile = await Doctor.findOne({
      $or: [{ user: doctor._id }, { name: doctor.name }],
    }).lean();

    const languages =
      doctorProfile?.languages?.length > 0
        ? doctorProfile.languages
        : doctor.language
        ? [doctor.language]
        : ["English"];

    const specialty =
      doctor.specialization || doctorProfile?.specialty || "General Medicine";

    // Fee: ONLY what doctor provided, never default to $45 or any fallback!
    const consultationFee =
      doctorProfile?.fee && String(doctorProfile.fee).trim() !== ""
        ? String(doctorProfile.fee).trim()
        : doctor.fee && String(doctor.fee).trim() !== ""
        ? String(doctor.fee).trim()
        : null;

    const experience =
      doctor.experience || doctorProfile?.experience || "";

    const hospital =
      doctor.hospital || "";

    const licenseNumber =
      doctor.licenseNumber || "";

    const bio =
      doctorProfile?.bio || doctor.bio || "";

    const availableSlots =
      doctorProfile?.availableSlots || [];

    res.json({
      success: true,
      _id: doctor._id,
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone || "",
      specialty,
      specialization: specialty,
      qualification: doctor.qualification || "",
      experience,
      hospital,
      licenseNumber,
      consultationFee,
      fee: consultationFee,
      status: doctor.status,
      isVerified: doctor.isVerified || doctor.status === "approved",
      languages,
      language: languages[0] || "English",
      bio,
      availableSlots,
      availability: availableSlots,
      rating: doctorProfile?.rating || null,
      reviews: doctorProfile?.reviews || 0,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      doctorProfile: doctorProfile || null,
    });
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load doctor details.",
      error: error.message,
    });
  }
};

// PATCH /api/admin/doctors/:id/status - Activate / Deactivate doctor in MongoDB
const updateDoctorStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID format." });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const rawStatus = status.toLowerCase().trim();
    let targetStatus = rawStatus;
    if (rawStatus === "active") targetStatus = "approved";
    if (rawStatus === "inactive") targetStatus = "suspended";

    const validStatuses = ["approved", "suspended", "pending", "rejected"];
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const doctor = await User.findOne({ _id: id, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    doctor.status = targetStatus;
    doctor.isVerified = targetStatus === "approved";
    await doctor.save();

    const totalApproved = await User.countDocuments({ role: "doctor", status: "approved" });
    const totalSuspended = await User.countDocuments({ role: "doctor", status: "suspended" });
    const totalManaged = totalApproved + totalSuspended;

    const actionText = targetStatus === "approved" ? "activated" : "deactivated";
    const cleanName = doctor.name ? doctor.name.replace(/^(dr\.?|doctor)\s+/i, "").trim() : "Doctor";

    res.json({
      success: true,
      message: `Dr. ${cleanName} has been successfully ${actionText}.`,
      doctor: {
        _id: doctor._id,
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        status: doctor.status,
        isVerified: doctor.isVerified,
      },
      counts: {
        total: totalManaged,
        active: totalApproved,
        inactive: totalSuspended,
        totalDoctors: totalManaged,
        activeDoctors: totalApproved,
        inactiveDoctors: totalSuspended,
      },
    });
  } catch (error) {
    console.error("Error updating doctor status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update doctor status.",
      error: error.message,
    });
  }
};

// ============================================================================
// STEP 7: ADMIN INTERPRETERS MANAGEMENT CONTROLLERS
// ============================================================================

// GET /api/admin/interpreters - Fetch verified/managed interpreters from MongoDB
const getAdminInterpreters = async (req, res) => {
  try {
    const { status, search, language, page, limit } = req.query;

    const rawStatus = (status || "").toLowerCase().trim();
    let statusFilter = null;

    if (rawStatus === "approved" || rawStatus === "active") {
      statusFilter = "approved";
    } else if (rawStatus === "suspended" || rawStatus === "inactive") {
      statusFilter = "suspended";
    } else if (rawStatus === "pending") {
      statusFilter = "pending";
    } else if (rawStatus === "rejected") {
      statusFilter = "rejected";
    } else if (rawStatus === "all") {
      statusFilter = { $in: ["approved", "suspended"] };
    } else {
      statusFilter = { $in: ["approved", "suspended"] };
    }

    const query = { role: "interpreter", status: statusFilter };

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { language: searchRegex },
        { qualification: searchRegex },
        { specialization: searchRegex },
      ];
    }

    if (language && language.toLowerCase() !== "all" && language.trim() !== "") {
      query.language = new RegExp(language.trim(), "i");
    }

    let interpreterUsersQuery = User.find(query).select("-password").sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      interpreterUsersQuery = interpreterUsersQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const interpreterUsers = await interpreterUsersQuery.lean();

    const formattedInterpreters = interpreterUsers.map((item) => {
      const languages = item.language ? [item.language] : ["English"];
      const qualification = item.qualification || item.specialization || "";

      return {
        _id: item._id,
        id: item._id,
        name: item.name,
        email: item.email,
        phone: item.phone || "",
        languages: languages,
        language: item.language || "English",
        qualification: qualification,
        certification: qualification,
        experience: item.experience || "",
        status: item.status,
        isVerified: item.isVerified || item.status === "approved",
        licenseNumber: item.licenseNumber || "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const totalApproved = await User.countDocuments({
      role: "interpreter",
      status: "approved",
    });
    const totalSuspended = await User.countDocuments({
      role: "interpreter",
      status: "suspended",
    });
    const totalPending = await User.countDocuments({
      role: "interpreter",
      status: "pending",
    });
    const totalRejected = await User.countDocuments({
      role: "interpreter",
      status: "rejected",
    });

    const totalManaged = totalApproved + totalSuspended;

    res.json({
      success: true,
      interpreters: formattedInterpreters,
      totalInterpreters: totalManaged,
      activeInterpreters: totalApproved,
      inactiveInterpreters: totalSuspended,
      counts: {
        total: totalManaged,
        active: totalApproved,
        inactive: totalSuspended,
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        all: totalManaged + totalPending + totalRejected,
      },
    });
  } catch (error) {
    console.error("Error fetching admin interpreters:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load interpreters list.",
      error: error.message,
    });
  }
};

// GET /api/admin/interpreters/:id - Fetch single interpreter details from MongoDB
const getAdminInterpreterDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid interpreter ID format." });
    }

    const interpreter = await User.findOne({ _id: id, role: "interpreter" }).select("-password").lean();

    if (!interpreter) {
      return res.status(404).json({ success: false, message: "Interpreter not found." });
    }

    const languages = interpreter.language ? [interpreter.language] : ["English"];
    const qualification = interpreter.qualification || interpreter.specialization || "";

    res.json({
      success: true,
      _id: interpreter._id,
      id: interpreter._id,
      name: interpreter.name,
      email: interpreter.email,
      phone: interpreter.phone || "",
      languages: languages,
      language: interpreter.language || "English",
      qualification: qualification,
      certification: qualification,
      experience: interpreter.experience || "",
      licenseNumber: interpreter.licenseNumber || "",
      status: interpreter.status,
      isVerified: interpreter.isVerified || interpreter.status === "approved",
      createdAt: interpreter.createdAt,
      updatedAt: interpreter.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching interpreter details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load interpreter details.",
      error: error.message,
    });
  }
};

// PATCH /api/admin/interpreters/:id/status - Update interpreter status in MongoDB
const updateInterpreterStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid interpreter ID format." });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const rawStatus = status.toLowerCase().trim();
    let targetStatus = rawStatus;
    if (rawStatus === "active") targetStatus = "approved";
    if (rawStatus === "inactive") targetStatus = "suspended";

    const validStatuses = ["approved", "suspended", "pending", "rejected"];
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const interpreter = await User.findOne({ _id: id, role: "interpreter" });
    if (!interpreter) {
      return res.status(404).json({ success: false, message: "Interpreter not found." });
    }

    interpreter.status = targetStatus;
    interpreter.isVerified = targetStatus === "approved";
    await interpreter.save();

    const totalApproved = await User.countDocuments({ role: "interpreter", status: "approved" });
    const totalSuspended = await User.countDocuments({ role: "interpreter", status: "suspended" });
    const totalManaged = totalApproved + totalSuspended;

    const actionText = targetStatus === "approved" ? "activated" : "deactivated";

    res.json({
      success: true,
      message: `${interpreter.name} has been successfully ${actionText}.`,
      interpreter: {
        _id: interpreter._id,
        id: interpreter._id,
        name: interpreter.name,
        email: interpreter.email,
        status: interpreter.status,
        isVerified: interpreter.isVerified,
      },
      counts: {
        total: totalManaged,
        active: totalApproved,
        inactive: totalSuspended,
      },
    });
  } catch (error) {
    console.error("Error updating interpreter status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update interpreter status.",
      error: error.message,
    });
  }
};

// ============================================================================
// APPOINTMENTS MANAGEMENT CONTROLLERS (ADMIN)
// ============================================================================

// Helper to convert time strings ("09:00 AM", "10:30 AM", "02:00 PM", "14:00") into minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 999999;
  const str = String(timeStr).trim().toLowerCase();
  const match = str.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
  if (!match) return 999999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period) {
    if (period.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (period.toLowerCase() === "am" && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

// GET /api/admin/appointments - Get appointments with date filter (defaults to today), status, search, and sorting
const getAdminAppointments = async (req, res) => {
  try {
    const { date, status, search, type, view } = req.query;

    // Determine target date (default to today YYYY-MM-DD if not explicitly set to 'all')
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDate = date ? date : view === "all" ? null : todayStr;

    // Build base query
    const query = {};

    if (targetDate && targetDate !== "all") {
      query.date = targetDate;
    }

    if (type && type !== "all") {
      query.type = new RegExp(`^${type}$`, "i");
    }

    // Status filter
    if (status && status !== "all") {
      if (status.toLowerCase() === "upcoming") {
        query.status = "Confirmed";
      } else {
        query.status = new RegExp(`^${status}$`, "i");
      }
    }

    // Search filter across doctor name, specialty, reason, or patient name
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchingPatients = await User.find({
        name: searchRegex,
      }).select("_id");
      const patientIds = matchingPatients.map((p) => p._id);

      query.$or = [
        { doctorName: searchRegex },
        { specialty: searchRegex },
        { reason: searchRegex },
        { patient: { $in: patientIds } },
      ];
    }

    // Fetch matching appointments from MongoDB
    const appointments = await Appointment.find(query)
      .populate("patient", "name email phone role")
      .populate("doctor", "name specialty email phone fee")
      .lean();

    // Sort today's appointments by time with earliest appointment first
    appointments.sort((a, b) => {
      // If dates differ, sort date first, then time
      if (a.date !== b.date) {
        return (a.date || "").localeCompare(b.date || "");
      }
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });

    // Compute stats for today (or the target date)
    const statsDate = targetDate && targetDate !== "all" ? targetDate : todayStr;
    const allForDate = await Appointment.find({ date: statsDate }).lean();

    const stats = {
      totalToday: allForDate.length,
      upcoming: allForDate.filter((apt) => (apt.status || "").toLowerCase() === "confirmed").length,
      completed: allForDate.filter((apt) => (apt.status || "").toLowerCase() === "completed").length,
      cancelled: allForDate.filter((apt) => (apt.status || "").toLowerCase() === "cancelled").length,
      date: statsDate,
    };

    res.json({
      success: true,
      count: appointments.length,
      appointments,
      stats,
    });
  } catch (error) {
    console.error("Error fetching admin appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments.",
      error: error.message,
    });
  }
};

// GET /api/admin/appointments/:id - Get single appointment details
const getAdminAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate("patient", "name email phone role createdAt")
      .populate("doctor", "name specialty email phone fee languages")
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment details.",
      error: error.message,
    });
  }
};

// PATCH /api/admin/appointments/:id/status - Update appointment status (Confirmed, Completed, Cancelled)
const updateAppointmentStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Confirmed", "Completed", "Cancelled"];
    const matchedStatus = validStatuses.find(
      (s) => s.toLowerCase() === (status || "").toLowerCase()
    );

    if (!matchedStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    appointment.status = matchedStatus;
    await appointment.save();

    const populated = await Appointment.findById(id)
      .populate("patient", "name email phone")
      .populate("doctor", "name specialty")
      .lean();

    res.json({
      success: true,
      message: `Appointment status updated to ${matchedStatus}.`,
      appointment: populated,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status.",
      error: error.message,
    });
  }
};

// ============================================================================
// ANALYTICS CONTROLLER (ADMIN)
// ============================================================================

// Helper to format date string to "MMM DD" (e.g. "Sep 23")
const formatChartDateLabel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

// GET /api/admin/analytics - Real-time aggregated platform intelligence from MongoDB
const getAdminAnalytics = async (req, res) => {
  try {
    const { timeframe = "7days" } = req.query;

    // 1. DIRECT DATABASE COUNTS FOR SUMMARY CARDS
    const [totalPatients, totalDoctors, totalInterpreters, totalAppointments] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "interpreter" }),
      Appointment.countDocuments({}),
    ]);

    // Calculate real 30-day user growth
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentPatients, recentDoctors, recentInterpreters, recentAppointments] = await Promise.all([
      User.countDocuments({ role: "patient", createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ role: "doctor", createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ role: "interpreter", createdAt: { $gte: thirtyDaysAgo } }),
      Appointment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    const calcGrowth = (recent, total) => {
      if (total === 0 || recent === 0) return "+0.0%";
      const prev = total - recent;
      if (prev <= 0) return `+100%`;
      const pct = ((recent / prev) * 100).toFixed(1);
      return `+${pct}%`;
    };

    const summary = {
      totalPatients,
      totalDoctors,
      totalInterpreters,
      totalAppointments,
      patientsGrowth: calcGrowth(recentPatients, totalPatients),
      doctorsGrowth: calcGrowth(recentDoctors, totalDoctors),
      interpretersGrowth: calcGrowth(recentInterpreters, totalInterpreters),
      appointmentsGrowth: calcGrowth(recentAppointments, totalAppointments),
    };

    // 2. APPOINTMENT ANALYTICS BY STATUS (AGGREGATION PIPELINE)
    const statusAgg = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };

    statusAgg.forEach((item) => {
      if (item._id && statusMap[item._id] !== undefined) {
        statusMap[item._id] = item.count;
      }
    });

    const appointmentStatus = [
      { status: "Upcoming", count: statusMap.Confirmed, color: "#0284c7", fill: "#0284c7" },
      { status: "Completed", count: statusMap.Completed, color: "#10b981", fill: "#10b981" },
      { status: "Cancelled", count: statusMap.Cancelled, color: "#ef4444", fill: "#ef4444" },
    ];

    // 3. USER DISTRIBUTION (REAL DATABASE COUNTS & PERCENTAGES)
    const totalUsers = totalPatients + totalDoctors + totalInterpreters;
    const patientPct = totalUsers > 0 ? Math.round((totalPatients / totalUsers) * 100) : 0;
    const doctorPct = totalUsers > 0 ? Math.round((totalDoctors / totalUsers) * 100) : 0;
    const interpPct = totalUsers > 0 ? Math.max(0, 100 - patientPct - doctorPct) : 0;

    const userDistribution = [
      { name: "Patients", value: totalPatients, color: "#0284c7", fill: "#0284c7", percentage: `${patientPct}%` },
      { name: "Doctors", value: totalDoctors, color: "#0f766e", fill: "#0f766e", percentage: `${doctorPct}%` },
      { name: "Interpreters", value: totalInterpreters, color: "#7c3aed", fill: "#7c3aed", percentage: `${interpPct}%` },
    ];

    // 4. APPOINTMENT TREND OVER TIME (7-DAY AND 30-DAY CONTINUOUS BUCKETS)
    const buildTrendBuckets = async (daysCount) => {
      const buckets = [];
      const dateMap = {};

      const now = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${day}`;
        const label = formatChartDateLabel(dateStr);

        dateMap[dateStr] = {
          date: label,
          dateStr,
          total: 0,
          completed: 0,
          upcoming: 0,
          cancelled: 0,
        };
      }

      // Fetch appointments matching this window
      const dateKeys = Object.keys(dateMap);
      const appointmentsInWindow = await Appointment.find({
        date: { $in: dateKeys },
      }).lean();

      appointmentsInWindow.forEach((apt) => {
        if (dateMap[apt.date]) {
          dateMap[apt.date].total += 1;
          const s = (apt.status || "").toLowerCase();
          if (s === "completed") dateMap[apt.date].completed += 1;
          else if (s === "confirmed") dateMap[apt.date].upcoming += 1;
          else if (s === "cancelled") dateMap[apt.date].cancelled += 1;
        }
      });

      return Object.values(dateMap);
    };

    const [last7Days, last30Days] = await Promise.all([
      buildTrendBuckets(7),
      buildTrendBuckets(30),
    ]);

    // 5. MEDICAL SPECIALTY CONSULTATION BREAKDOWN (AGGREGATION)
    const specialtyAgg = await Appointment.aggregate([
      {
        $group: {
          _id: "$specialty",
          consultations: { $sum: 1 },
        },
      },
      { $sort: { consultations: -1 } },
      { $limit: 10 },
    ]);

    // Also look up average doctor fee per specialty if available
    const doctorSpecialties = await Doctor.find({}).select("specialty fee").lean();
    const feeBySpecialty = {};
    doctorSpecialties.forEach((doc) => {
      const numFee = parseInt(String(doc.fee || "").replace(/[^0-9]/g, ""), 10) || 50;
      feeBySpecialty[doc.specialty] = numFee;
    });

    const specialtyBreakdown = specialtyAgg.map((item) => {
      const specName = item._id || "General Medicine";
      const unitFee = feeBySpecialty[specName] || 50;
      const totalRev = item.consultations * unitFee;
      return {
        specialty: specName,
        consultations: item.consultations,
        revenue: `$${totalRev.toLocaleString()}`,
      };
    });

    res.json({
      success: true,
      data: {
        summary,
        appointmentStatus,
        userDistribution,
        appointmentTrends: {
          last7Days,
          last30Days,
        },
        trend: timeframe === "30days" ? last30Days : last7Days,
        specialtyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error generating admin analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate platform analytics.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getDoctorApplications,
  getDoctorVerificationDetails,
  approveDoctor,
  rejectDoctor,
  getAdminDoctors,
  getAdminDoctorDetails,
  updateDoctorStatusAdmin,
  getAdminInterpreters,
  getAdminInterpreterDetails,
  updateInterpreterStatusAdmin,
  getAdminAppointments,
  getAdminAppointmentDetails,
  updateAppointmentStatusAdmin,
  getAdminAnalytics,
};



