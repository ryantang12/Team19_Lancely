import { useState } from "react";

export default function ActiveJobsPanel({ jobs = [], userRole = "client" }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const isContractor = userRole === "contractor";
  const accent = isContractor ? "#059669" : "#4f46e5";
  const accentLight = isContractor ? "#ecfdf5" : "#eef2ff";
  const activeJobs = jobs.filter((j) => j.status === "in_progress");

  const handleComplete = (id) => {
    // TODO: call backend API to mark job complete
    console.log("Mark complete:", id);
    setConfirmId(null);
    setSelectedJob(null);
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setPanelOpen(!panelOpen)} style={{
        position: "fixed", top: 16, right: 16, zIndex: 40, padding: "8px 16px",
        borderRadius: 8, border: "none", background: accent, color: "#fff",
        fontWeight: 600, fontSize: 13, cursor: "pointer"
      }}>
        {panelOpen ? "Close" : "Active Jobs"} ({activeJobs.length})
      </button>

      {/* Side panel */}
      {panelOpen && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: 340, height: "100vh",
          background: "#fff", borderLeft: "1px solid #e5e7eb", zIndex: 30,
          display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif"
        }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", background: accentLight }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>Active Jobs</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              {isContractor ? "Jobs you're working on" : "Jobs in progress with contractors"}
            </p>
          </div>

          {/* Job list / detail */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {selectedJob ? (
              <div>
                <button onClick={() => setSelectedJob(null)} style={{
                  background: "none", border: "none", color: "#6b7280", cursor: "pointer",
                  fontSize: 13, marginBottom: 12, padding: 0
                }}>
                  ← Back
                </button>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>{selectedJob.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px" }}>
                  {isContractor ? "Client" : "Contractor"}: <strong>{selectedJob.otherPartyName}</strong>
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px" }}>Category: {selectedJob.category}</p>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px" }}>Due: {selectedJob.dueDate}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: accent, margin: "8px 0 16px" }}>${selectedJob.price}</p>

                {confirmId === selectedJob.id ? (
                  <div style={{ background: "#fef3c7", borderRadius: 8, padding: 12, fontSize: 13 }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Confirm work is completed and payment settled?</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleComplete(selectedJob.id)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
                        background: accent, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                      }}>Yes, Complete</button>
                      <button onClick={() => setConfirmId(null)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid #d1d5db",
                        background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer"
                      }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(selectedJob.id)} style={{
                    width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                    background: accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer"
                  }}>Mark as Complete</button>
                )}
              </div>
            ) : activeJobs.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 40 }}>No active jobs</p>
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} onClick={() => setSelectedJob(job)} style={{
                  padding: 14, borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 10,
                  cursor: "pointer", borderLeft: `3px solid ${accent}`, background: "#fff"
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                    {isContractor ? "Client" : "Contractor"}: {job.otherPartyName}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                    <span>{job.category}</span>
                    <span style={{ fontWeight: 600, color: accent }}>${job.price}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
