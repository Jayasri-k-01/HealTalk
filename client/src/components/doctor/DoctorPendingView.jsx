import { useAuth } from "../../context/AuthContext";
import Navbar from "../Navbar";
import {
  Clock,
  AlertCircle,
  Stethoscope,
  Building,
  FileCheck,
  Mail,
  Phone,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

function DoctorPendingView({ user }) {
  const { logout } = useAuth();
  const isRejected = user?.status === "rejected";

  return (
    <div className="dashboard-container" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: "720px", margin: "40px auto", padding: "0 20px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: isRejected ? "1px solid #fee2e2" : "1px solid #ccfbf1",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
            padding: "36px",
            textAlign: "center",
          }}
        >
          {/* Header Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: isRejected ? "#fee2e2" : "#ccfbf1",
              color: isRejected ? "#dc2626" : "#0f766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            {isRejected ? <AlertCircle size={32} /> : <Clock size={32} />}
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            {isRejected
              ? "Doctor Application Not Approved"
              : "Doctor Account Pending Verification"}
          </h2>

          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            {isRejected
              ? "Your Doctor application was not approved by the HealTalk Medical Review Board. Please see details below."
              : "Thank you for applying to provide medical services on HealTalk. Your credentials and medical license are currently under review by our administrative team."}
          </p>

          {/* Status Details Card */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "left",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <strong style={{ fontSize: "15px", color: "#0f172a" }}>{user?.name}</strong>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{user?.email}</div>
              </div>
              <span
                className={`user-status-badge ${isRejected ? "rejected" : "pending"}`}
              >
                <span className={`status-dot ${isRejected ? "red" : "amber"}`} />
                {isRejected ? "Application Rejected" : "Awaiting Verification"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                  Specialization
                </span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>
                  {user?.specialization || "General Medicine"}
                </span>
              </div>

              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                  Medical License No.
                </span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>
                  {user?.licenseNumber || "N/A"}
                </span>
              </div>

              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                  Hospital / Clinic
                </span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>
                  {user?.hospital || "N/A"}
                </span>
              </div>

              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                  Qualification
                </span>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>
                  {user?.qualification || "N/A"}
                </span>
              </div>
            </div>

            {/* Rejection Reason Notice */}
            {isRejected && user?.rejectionReason && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "8px",
                  color: "#991b1b",
                  fontSize: "13px",
                }}
              >
                <strong>Reason for Rejection:</strong>
                <p style={{ margin: "4px 0 0", color: "#b91c1c" }}>{user.rejectionReason}</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              onClick={logout}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DoctorPendingView;
