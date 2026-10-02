import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarX,
} from "lucide-react";
import {
  fetchDoctorAvailability,
  updateDoctorAvailability,
} from "../../../services/doctorService";

function DoctorAvailabilityTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [initialSchedule, setInitialSchedule] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [initialBlockedDates, setInitialBlockedDates] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState({
    videoConsultation: true,
    chatConsultation: true,
  });

  // Block Date Form State
  const [newBlockDate, setNewBlockDate] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [blockError, setBlockError] = useState("");

  const [toastMessage, setToastMessage] = useState(null);

  // Fetch real availability from MongoDB
  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await fetchDoctorAvailability();
      if (data.success && data.availability) {
        const av = data.availability;
        const weekly = av.weeklySchedule || [];
        const blocked = av.blockedDates || [];
        setSchedule(weekly);
        setInitialSchedule(weekly);
        setBlockedDates(blocked);
        setInitialBlockedDates(blocked);
        if (av.consultationTypesAccepted) {
          setConsultationTypes(av.consultationTypesAccepted);
        }
      }
    } catch (err) {
      console.error("Error loading availability:", err);
      showToast("Failed to load availability from database", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleDay = (dayName) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day === dayName ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleTimeChange = (dayName, field, value) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day === dayName ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddBlockedDate = (e) => {
    e.preventDefault();
    setBlockError("");

    if (!newBlockDate.startDate) {
      setBlockError("Start date is required");
      return;
    }
    if (!newBlockDate.reason.trim()) {
      setBlockError("Please enter a reason for blocking this date");
      return;
    }

    const newEntry = {
      id: `BLK-${Date.now()}`,
      startDate: newBlockDate.startDate,
      endDate: newBlockDate.endDate || newBlockDate.startDate,
      reason: newBlockDate.reason.trim(),
    };

    setBlockedDates((prev) => [newEntry, ...prev]);
    setNewBlockDate({ startDate: "", endDate: "", reason: "" });
    showToast("Date blocked added (click 'Save Schedule Changes' to persist)");
  };

  const handleRemoveBlockedDate = (id) => {
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    showToast("Blocked date removed (click 'Save Schedule Changes' to persist)", "info");
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        weeklySchedule: schedule,
        blockedDates: blockedDates,
        consultationTypesAccepted: consultationTypes,
      };

      const res = await updateDoctorAvailability(payload);
      if (res.success && res.availability) {
        setInitialSchedule(res.availability.weeklySchedule || schedule);
        setInitialBlockedDates(res.availability.blockedDates || blockedDates);
        showToast("Weekly availability & blocked dates saved to MongoDB successfully");
      }
    } catch (err) {
      console.error("Error saving availability to MongoDB:", err);
      showToast(err.message || "Failed to save availability settings to MongoDB", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRevert = () => {
    setSchedule(initialSchedule);
    setBlockedDates(initialBlockedDates);
    showToast("Availability settings reverted to saved values", "info");
  };

  if (loading) {
    return (
      <div className="doctor-tab-loading">
        <Loader2 size={32} className="doctor-spin-icon" />
        <p>Loading clinical calendar and availability settings from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="doctor-availability-tab">
      {toastMessage && (
        <div className={`doctor-toast ${toastMessage.type === "info" ? "info" : ""}`}>
          <CheckCircle2 size={16} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="doctor-tab-header">
        <div className="doctor-tab-title-group">
          <h2>Clinical Availability & Working Hours</h2>
          <p>Configure your weekly consulting schedule, session duration, and calendar blockouts</p>
        </div>
      </div>

      <form onSubmit={handleSaveSchedule} className="doctor-availability-layout">
        {/* SECTION 1: WEEKLY SCHEDULE TABLE/EDITOR */}
        <div className="doctor-card schedule-editor-card">
          <div className="doctor-card-header">
            <div className="doctor-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon profile">
                  <Clock size={18} />
                </div>
                <div>
                  <h3>Weekly Schedule Editor</h3>
                  <p>Set active consultation days and operating hours for patient booking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="schedule-editor-body">
            <div className="schedule-days-list">
              {schedule.map((item) => (
                <div
                  key={item.day}
                  className={`schedule-day-row ${item.enabled ? "is-active" : "is-disabled"}`}
                >
                  <div className="day-toggle-col">
                    <label className="admin-switch" htmlFor={`switch-${item.day}`}>
                      <input
                        type="checkbox"
                        id={`switch-${item.day}`}
                        checked={item.enabled}
                        onChange={() => handleToggleDay(item.day)}
                      />
                      <span className="admin-slider"></span>
                    </label>
                    <span className="day-name">{item.day}</span>
                  </div>

                  {item.enabled ? (
                    <div className="day-inputs-grid">
                      <div className="time-picker-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) =>
                            handleTimeChange(item.day, "startTime", e.target.value)
                          }
                          className="settings-input time-input"
                        />
                      </div>

                      <div className="time-picker-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) =>
                            handleTimeChange(item.day, "endTime", e.target.value)
                          }
                          className="settings-input time-input"
                        />
                      </div>

                      <div className="time-picker-group">
                        <label>Max Patients</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={item.maxPatients}
                          onChange={(e) =>
                            handleTimeChange(item.day, "maxPatients", Number(e.target.value))
                          }
                          className="settings-input num-input"
                        />
                      </div>

                      <div className="time-picker-group">
                        <label>Slot Length</label>
                        <select
                          value={item.slotDuration}
                          onChange={(e) =>
                            handleTimeChange(item.day, "slotDuration", Number(e.target.value))
                          }
                          className="settings-select duration-select"
                        >
                          <option value={15}>15 mins</option>
                          <option value={20}>20 mins</option>
                          <option value={30}>30 mins</option>
                          <option value={45}>45 mins</option>
                          <option value={60}>60 mins</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="day-off-badge">
                      <span>Clinic Closed / Day Off</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: BLOCKED DATES & HOLIDAYS */}
        <div className="doctor-card blocked-dates-card">
          <div className="doctor-card-header">
            <div className="doctor-card-title-group">
              <div className="settings-section-title-with-icon">
                <div className="settings-header-icon security">
                  <CalendarX size={18} />
                </div>
                <div>
                  <h3>Blocked Dates & Vacation Leave</h3>
                  <p>Prevent patients from booking visits during conferences, holidays, or personal leave</p>
                </div>
              </div>
            </div>
          </div>

          <div className="blocked-dates-body">
            {/* Add New Block Form */}
            <div className="add-block-date-box">
              <h4>Add Out-of-Office / Blocked Period</h4>
              {blockError && (
                <span className="settings-error-text mb-2">
                  <AlertCircle size={13} /> {blockError}
                </span>
              )}
              <div className="block-inputs-row">
                <div className="settings-input-group">
                  <label>Start Date <span className="req">*</span></label>
                  <input
                    type="date"
                    value={newBlockDate.startDate}
                    onChange={(e) =>
                      setNewBlockDate((p) => ({ ...p, startDate: e.target.value }))
                    }
                    className="settings-input"
                  />
                </div>

                <div className="settings-input-group">
                  <label>End Date (Optional)</label>
                  <input
                    type="date"
                    value={newBlockDate.endDate}
                    onChange={(e) =>
                      setNewBlockDate((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="settings-input"
                  />
                </div>

                <div className="settings-input-group flex-reason">
                  <label>Reason / Out-of-Office Note <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Medical Conference, Personal Vacation, Holiday..."
                    value={newBlockDate.reason}
                    onChange={(e) =>
                      setNewBlockDate((p) => ({ ...p, reason: e.target.value }))
                    }
                    className="settings-input"
                  />
                </div>

                <div className="block-submit-col">
                  <label className="invisible-label">&nbsp;</label>
                  <button
                    type="button"
                    className="doctor-btn-primary block-submit-btn"
                    onClick={handleAddBlockedDate}
                  >
                    <Plus size={15} />
                    <span>Block Date</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of Currently Blocked Dates */}
            <div className="blocked-dates-list">
              <label className="section-label">Active Blocked Periods ({blockedDates.length})</label>
              {blockedDates.length === 0 ? (
                <div className="empty-blocks-state">
                  <div className="empty-blocks-icon-wrap">
                    <Calendar size={26} />
                  </div>
                  <div className="empty-blocks-text">
                    <h5>No Active Blocked Dates</h5>
                    <p>Your calendar follows your standard weekly schedule. Add dates above to block patient bookings during vacations or conferences.</p>
                  </div>
                </div>
              ) : (
                <div className="blocks-grid">
                  {blockedDates.map((block) => (
                    <div key={block.id} className="block-item-card">
                      <div className="block-item-meta">
                        <div className="date-badge">
                          <CalendarX size={14} />
                          <span>
                            {block.startDate} {block.endDate && block.endDate !== block.startDate ? `➔ ${block.endDate}` : ""}
                          </span>
                        </div>
                        <p className="block-reason">{block.reason}</p>
                      </div>
                      <button
                        type="button"
                        className="remove-block-btn"
                        onClick={() => handleRemoveBlockedDate(block.id)}
                        title="Remove block and open date"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="settings-card-actions">
            <button
              type="button"
              className="doctor-btn-secondary"
              onClick={handleCancelRevert}
              disabled={saving}
            >
              <RotateCcw size={15} />
              <span>Revert Changes</span>
            </button>
            <button type="submit" className="doctor-btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={15} className="doctor-spin-icon" />
                  <span>Saving to MongoDB...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Schedule Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default DoctorAvailabilityTab;
