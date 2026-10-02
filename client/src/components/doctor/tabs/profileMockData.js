// TEMP: replace with API call (e.g. GET /api/doctor/profile and PUT /api/doctor/profile)

export const mockDoctorProfile = {
  id: "DOC-8910",
  name: "Dr. Elena Rostova",
  title: "MD, FACC (Fellow of the American College of Cardiology)",
  email: "elena.rostova@healtalk.com",
  phone: "+1 (555) 392-1084",
  specialization: "Cardiovascular Diseases & Preventative Cardiology",
  secondarySpecialty: "Internal Medicine",
  experienceYears: "14 years experience",
  licenseNumber: "MED-TX-782910",
  npiNumber: "1982048190",
  hospitalAffiliation: "Baylor St. Luke's Medical Center & HealTalk Clinical Network",
  degrees: [
    { degree: "Doctor of Medicine (MD)", institution: "Johns Hopkins University School of Medicine", year: "2012" },
    { degree: "Cardiovascular Disease Fellowship", institution: "Cleveland Clinic Foundation", year: "2015" },
    { degree: "Bachelor of Science in Biology", institution: "Stanford University", year: "2008" },
  ],
  languagesSpoken: ["English", "Spanish", "French"],
  consultationFee: "$85.00 / 30-min session",
  verificationStatus: "Verified Doctor", // Verified Doctor, Pending, Under Review
  verifiedBadgeDate: "Verified Aug 2025",
  rating: 4.9,
  totalReviews: 142,
  bio: "Dr. Elena Rostova is a board-certified Cardiologist with over 14 years of clinical experience diagnosing and managing complex cardiovascular conditions, hypertension, lipid disorders, and arrhythmias. Fluent in English, Spanish, and French, she is deeply committed to bridging language gaps in telemedicine and delivering compassionate, evidence-based care.",
  clinicAddress: {
    street: "6624 Fannin St, Suite 2100",
    city: "Houston",
    state: "Texas",
    zipCode: "77030",
    country: "United States",
  },
  emergencyContact: "+1 (555) 911-0021",
};

export const mockAvailableSpecializations = [
  "Cardiovascular Diseases & Preventative Cardiology",
  "General Internal Medicine",
  "Endocrinology & Diabetes",
  "Neurology",
  "Pediatrics & Adolescent Medicine",
  "Dermatology",
  "Psychiatry & Behavioral Health",
  "Pulmonology & Respiratory Care",
  "Family Medicine",
  "Orthopedics & Sports Medicine",
];

export const mockSupportedLanguages = [
  "English",
  "Spanish",
  "French",
  "Mandarin Chinese",
  "Hindi",
  "Arabic",
  "Portuguese",
  "German",
  "Russian",
  "Italian",
  "Vietnamese",
  "Korean",
];
