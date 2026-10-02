import { useAuth } from "../context/AuthContext";
import PatientDashboard from "../components/patient/PatientDashboard";
import DoctorDashboard from "../components/doctor/DoctorDashboard";
import DoctorPendingView from "../components/doctor/DoctorPendingView";
import InterpreterDashboard from "../components/interpreter/InterpreterDashboard";
import AdminDashboard from "../components/admin/AdminDashboard";

function Dashboard() {
  const { user } = useAuth();
  const role = (user?.role || "patient").toLowerCase();
  const status = (user?.status || "approved").toLowerCase();

  if (role === "doctor") {
    // Only approved doctors can access the full doctor dashboard
    if (status !== "approved") {
      return <DoctorPendingView user={user} />;
    }
    return <DoctorDashboard user={user} />;
  }

  if (role === "interpreter") {
    return <InterpreterDashboard user={user} />;
  }

  if (role === "admin") {
    return <AdminDashboard user={user} />;
  }

  // Default to Patient Dashboard for patient role
  return <PatientDashboard user={user} />;
}

export default Dashboard;
