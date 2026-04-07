import { useState } from "react";

const categories = ["Payment", "Dispute", "Bug", "Account", "General"];

export default function SupportForm() {
  const [userType, setUserType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitted, setSubmitted] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState("form");
  const [expandedId, setExpandedId] = useState(null);

  const canSubmit = userType && name.trim() && email.trim() && category && subject.trim() && message.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const ticket = {
      id: Date.now(),
      userType, name, email, category, subject, message, priority,
      status: "open",
      created: new Date().toLocaleString(),
      messages: [{ from: "user", text: message, time: new Date().toLocaleString() }]
    };
    setTickets(prev => [ticket, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSubject("");
      setMessage("");
      setCategory("");
      setPriority("medium");
    }, 3000);
  };

  const isClient = userType === "client";
  const accent = isClient ? "indigo" : "emerald";
  const accentBg = isClient ? "bg-indigo-600" : "bg-emerald-600";
  const accentHover = isClient ? "hover:bg-indigo-700" : "hover:bg-emerald-700";
  const accentRing = isClient ? "focus:ring-indigo-400" : "focus:ring-emerald-400";
  const accentLight = isClient ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700";
  const accentText = isClient ? "text-indigo-600" : "text-emerald-600";
  const statusColors = { open: "bg-blue-100 text-blue-700", "in-progress": "bg-amber-100 text-amber-700", resolved: "bg-green-100 text-green-700" };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="text-3xl font-bold text-gray-800 mb-1">Lancely</div>
          <div className="text-sm text-gray-500 mb-8">Customer Support</div>
          <p className="text-sm text-gray-600 mb-6">How are you using Lancely?</p>
          <div className="flex gap-3">
            <button onClick={() => setUserType("client")} className="flex-1 py-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 transition">
              <div className="text-2xl mb-1">🔵</div>
              <div className="text-sm font-semibold text-indigo-700">Client</div>
              <div className="text-xs text-gray-400 mt-0.5">Posting jobs</div>
            </button>
            <button onClick={() => setUserType("contractor")} className="flex-1 py-4 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition">
              <div className="text-2xl mb-1">🟢</div>
              <div className="text-sm font-semibold text-emerald-700">Contractor</div>
              <div className="text-xs text-gray-400 mt-0.5">Accepting jobs</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontSize: 14 }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${accentText}`}>Lancely</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${accentLight}`}>Support</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${accentLight}`}>{userType === "client" ? "🔵 Client" : "🟢 Contractor"}</span>
          <button onClick={() => { setUserType(""); setName(""); setEmail(""); setView("form"); }} className="text-xs text-gray-400 hover:text-red-500 transition">Switch Role</button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2">
        <button onClick={() => setView("form")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "form" ? accentLight : "text-gray-500 hover:bg-gray-100"}`}>New Request</button>
        <button onClick={() => setView("tickets")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${view === "tickets" ? accentLight : "text-gray-500 hover:bg-gray-100"}`}>
          My Tickets {tickets.length > 0 && <span className="ml-1 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{tickets.length}</span>}
        </button>
      </div>

      {view === "form" ? (
        <div className="flex-1 flex items-start justify-center p-4 pt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-6">
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">Request Submitted</h2>
                <p className="text-sm text-gray-500">Our team will review your issue and respond shortly.</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-1">How can we help?</h2>
                <p className="text-xs text-gray-500 mb-5">Describe your issue and we'll get back to you as soon as possible.</p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing}`} placeholder="Your name" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing}`} placeholder="you@email.com" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} bg-white`}>
                        <option value="">Select a category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} bg-white`}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing}`} placeholder="Brief summary of your issue" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Describe your issue</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentRing} resize-none`} placeholder="Tell us what happened and how we can help..." />
                  </div>
                  <button onClick={handleSubmit} disabled={!canSubmit} className={`w-full py-2.5 text-white rounded-lg text-sm font-medium transition disabled:opacity-40 ${accentBg} ${accentHover}`}>Submit Request</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm">No tickets yet</p>
              <p className="text-xs mt-1">Submit a request and it will appear here</p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{t.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>{t.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{t.category}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{t.created}</span>
                    </div>
                  </div>
                  {expandedId === t.id && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                      {t.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-sm rounded-xl px-3 py-2 ${msg.from === "admin" ? `${accentBg} text-white` : "bg-gray-100 text-gray-800"}`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.from === "admin" ? "opacity-60" : "text-gray-400"}`}>{msg.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
