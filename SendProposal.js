import { useState } from "react";

// ── 1. CONTRACTOR PROFILE FORM 

function SkillTags({ skills, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !skills.includes(t)) onChange([...skills, t]);
    setInput("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {skills.map((skill) => (
          <span key={skill} style={s.skillTag}>
            {skill}
            <button onClick={() => onChange(skills.filter((sk) => sk !== skill))} style={s.tagX}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Type a skill and press Enter..."
          style={{ ...s.input, flex: 1 }}
        />
        <button onClick={add} style={s.btnSecondary}>Add</button>
      </div>
    </div>
  );
}

function PhotoUploader({ images, onChange }) {
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map((file) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res({ name: file.name, url: r.result });
          r.readAsDataURL(file);
        })
      )
    ).then((newImgs) => onChange([...images, ...newImgs]));
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {images.map((img, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img src={img.url} alt={img.name} style={s.thumb} />
          <button
            onClick={() => onChange(images.filter((_, idx) => idx !== i))}
            style={s.thumbRemove}
          >×</button>
        </div>
      ))}
      <label style={s.addPhoto}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 11 }}>Add Photo</span>
        <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      </label>
    </div>
  );
}

export function ContractorProfile({ profile, onChange, onSave }) {
  const set = (field, value) => onChange({ ...profile, [field]: value });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: hook up to DB here
    onSave?.(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Rating — read only */}
      <div style={s.ratingBox}>
        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
          Your Rating (based on customer reviews)
        </p>
        <StarRating rating={profile.rating ?? 0} reviewCount={profile.reviewCount ?? 0} />
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9CA3AF" }}>
          This is automatically calculated — you can't edit it.
        </p>
      </div>

      {/* Name + Location */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={s.label}>Full Name</label>
          <input value={profile.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith" style={s.input} />
        </div>
        <div>
          <label style={s.label}>Location</label>
          <input value={profile.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="San Diego, CA" style={s.input} />
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: 16 }}>
        <label style={s.label}>Years / Type of Experience</label>
        <input
          value={profile.experience ?? ""}
          onChange={(e) => set("experience", e.target.value)}
          placeholder="e.g. 5 years in plumbing and general contracting"
          style={s.input}
        />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: 16 }}>
        <label style={s.label}>Bio</label>
        <textarea
          value={profile.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          rows={4}
          placeholder="Tell clients about yourself..."
          style={{ ...s.input, resize: "vertical" }}
        />
      </div>

      {/* Skills */}
      <div style={{ marginBottom: 16 }}>
        <label style={s.label}>Skills</label>
        <SkillTags skills={profile.skills ?? []} onChange={(v) => set("skills", v)} />
      </div>

      {/* Portfolio Photos */}
      <div style={{ marginBottom: 24 }}>
        <label style={s.label}>Past Work Photos</label>
        <PhotoUploader images={profile.portfolioImages ?? []} onChange={(v) => set("portfolioImages", v)} />
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={handleSave} style={s.btnPrimary}>Save Profile</button>
        {saved && <span style={{ fontSize: 13, color: "#10B981" }}>✓ Saved!</span>}
      </div>
    </div>
  );
}


// ── 2. SEND PROPOSAL FORM (modal)

export function SendProposalForm({ job, onClose, onSend }) {
  const [form, setForm] = useState({ message: "", bidAmount: "", timeline: "", availableFrom: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleSubmit = () => {
    const e = {};
    if (!form.message.trim()) e.message = "Please write a message to the client.";
    if (!form.bidAmount) e.bidAmount = "Please enter your bid amount.";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const proposal = {
      jobId: job.id,
      jobTitle: job.title,
      client: job.client,
      ...form,
      status: "pending",
      sentAt: new Date().toISOString(),
    };

    // TODO: save to your DB here
    // e.g. await db.collection("proposals").add(proposal);
    console.log("Proposal:", proposal);

    onSend?.(proposal);
    setSent(true);
  };

  if (sent) {
    return (
      <div style={s.overlay}>
        <div style={{ ...s.modal, textAlign: "center", padding: "52px 40px" }}>
          <div style={{ fontSize: 50, marginBottom: 14 }}>✅</div>
          <h2 style={{ margin: "0 0 8px", color: "#166534" }}>Proposal Sent!</h2>
          <p style={{ color: "#6B7280", margin: "0 0 28px" }}>
            Your proposal for <strong>{job.title}</strong> has been sent to {job.client}.
          </p>
          <button onClick={onClose} style={s.btnPrimary}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>Send a Proposal</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
              For: <strong>{job.title}</strong> · {job.client}
            </p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Message to Client *</label>
          <textarea
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            rows={5}
            placeholder="Introduce yourself and explain why you're a great fit..."
            style={{ ...s.input, resize: "vertical", ...(errors.message ? s.errBorder : {}) }}
          />
          {errors.message && <p style={s.errText}>{errors.message}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={s.label}>Your Bid ($) *</label>
            <input
              type="number"
              value={form.bidAmount}
              onChange={(e) => set("bidAmount", e.target.value)}
              placeholder="e.g. 200"
              style={{ ...s.input, ...(errors.bidAmount ? s.errBorder : {}) }}
            />
            {errors.bidAmount && <p style={s.errText}>{errors.bidAmount}</p>}
          </div>
          <div>
            <label style={s.label}>Estimated Timeline</label>
            <input
              value={form.timeline}
              onChange={(e) => set("timeline", e.target.value)}
              placeholder="e.g. 2–3 hours"
              style={s.input}
            />
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={s.label}>Available From</label>
          <input
            type="date"
            value={form.availableFrom}
            onChange={(e) => set("availableFrom", e.target.value)}
            style={s.input}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={s.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} style={s.btnPrimary}>Send Proposal →</button>
        </div>
      </div>
    </div>
  );
}


// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const s = {
  input: {
    width: "100%", padding: "10px 12px", border: "1.5px solid #D1D5DB",
    borderRadius: 8, fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
  },
  errBorder: { borderColor: "#EF4444" },
  errText: { margin: "4px 0 0", fontSize: 12, color: "#EF4444" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  btnPrimary: {
    padding: "10px 22px", background: "#1E3A5F", color: "#fff",
    border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
  btnSecondary: {
    padding: "10px 22px", background: "#F3F4F6", color: "#374151",
    border: "1.5px solid #D1D5DB", borderRadius: 8,
    cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
  skillTag: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 10px", background: "#DBEAFE", color: "#1E40AF",
    borderRadius: 20, fontSize: 13, fontWeight: 500,
  },
  tagX: { background: "none", border: "none", cursor: "pointer", color: "#1E40AF", fontSize: 16, padding: 0 },
  thumb: { width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "2px solid #E5E7EB" },
  thumbRemove: {
    position: "absolute", top: -6, right: -6, background: "#EF4444",
    color: "#fff", border: "none", borderRadius: "50%",
    width: 20, height: 20, cursor: "pointer", fontSize: 13, lineHeight: "20px", textAlign: "center",
  },
  addPhoto: {
    width: 90, height: 90, border: "2px dashed #D1D5DB", borderRadius: 8,
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", cursor: "pointer", color: "#9CA3AF", gap: 4,
  },
  ratingBox: {
    background: "#F8FAFC", border: "1.5px solid #E2E8F0",
    borderRadius: 10, padding: 14, marginBottom: 20,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 14, padding: 32,
    width: "100%", maxWidth: 520, maxHeight: "90vh",
    overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  closeBtn: { background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#9CA3AF" },
};
