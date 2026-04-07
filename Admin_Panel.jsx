import { useState } from "react";

const priorityColors = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };
const statusColors = { open: "bg-blue-100 text-blue-700", "in-progress": "bg-amber-100 text-amber-700", resolved: "bg-green-100 text-green-700" };
const categoryIcons = { Payment: "💳", Dispute: "⚖️", Bug: "🐛", General: "💬", Account: "👤" };

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [issues, setIssues] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  const handleLogin = () => {
    if (email && password) {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Please enter your email and password.");
    }
  };

  const selected = issues.find(i => i.id === selectedId);

  const filtered = issues.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterType !== "all" && i.type !== filterType) return false;
    if (search && !i.subject.toLowerCase().includes(search.toLowerCase()) && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    setIssues(prev => prev.map(i => i.id === selected.id ? {
      ...i, messages: [...i.messages, { from: "admin", text: reply.trim(), time: "Just now" }],
      status: i.status === "open" ? "in-progress" : i.status
    } : i));
    setReply("");
  };

  const resolveIssue = () => {
    if (!selected) return;
    setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, status: "resolved" } : i));
  };

  const reopenIssue = () => {
    if (!selected) return;
    setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, status: "open" } : i));
  };

  const counts = { open: issues.filter(i => i.status === "open").length, inProgress: issues.filter(i => i.status === "in-progress").length, resolved: issues.filter(i => i.status === "resolved").length };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-indigo-600 mb-1">Lancely</div>
            <div className="text-sm text-gray-500">Admin Support Panel</div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="admin@lancely.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="••••••••" />
            </div>
            {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
            <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition text-sm">Sign In</button>
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
          <span className="text-xl font-bold text-indigo-600">Lancely</span>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{email}</span>
          <button onClick={() => { setLoggedIn(false); setEmail(""); setPassword(""); setSelectedId(null); }} className="text-xs text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex gap-3">
        {[["Open", counts.open, "bg-blue-500"], ["In Progress", counts.inProgress, "bg-amber-500"], ["Resolved", counts.resolved, "bg-green-500"]].map(([label, count, color]) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{count}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Issue List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col" style={{ minWidth: 280 }}>
          <div className="p-3 border-b border-gray-100 space-y-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-1.5">
              {["all","open","in-progress","resolved"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-1 rounded text-xs font-medium transition ${filterStatus === s ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>
                  {s === "all" ? "All" : s === "in-progress" ? "Active" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {["all","client","contractor"].map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-2 py-1 rounded text-xs font-medium transition ${filterType === t ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>
                  {t === "all" ? "All Users" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
                <span className="text-3xl mb-2">📭</span>
                <p className="text-xs">No issues to display</p>
              </div>
            )}
            {filtered.map(issue => (
              <div key={issue.id} onClick={() => setSelectedId(issue.id)}
                className={`px-3 py-3 border-b border-gray-50 cursor-pointer transition ${selectedId === issue.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{categoryIcons[issue.category] || "📩"}</span>
                    <span className="text-xs font-semibold text-gray-800 truncate" style={{ maxWidth: 160 }}>{issue.name}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                </div>
                <p className="text-xs text-gray-600 truncate mb-1.5">{issue.subject}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[issue.status]}`}>{issue.status}</span>
                  <span className="text-xs text-gray-400">{issue.type === "client" ? "🔵 Client" : "🟢 Contractor"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 flex flex-col bg-white">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">Select an issue to view details</p>
              <p className="text-xs mt-1">Issues from clients and contractors will appear here</p>
            </div>
          ) : (
            <>
              {/* Issue Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">{selected.subject}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">From: <strong>{selected.name}</strong> ({selected.type})</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{selected.email}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{selected.created}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[selected.status]}`}>{selected.status}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{selected.category}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {selected.status !== "resolved" ? (
                    <button onClick={resolveIssue} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">✓ Mark Resolved</button>
                  ) : (
                    <button onClick={reopenIssue} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition">↻ Reopen</button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
                {selected.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md rounded-xl px-4 py-2.5 ${msg.from === "admin" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{msg.from === "admin" ? "Admin" : selected.name}</span>
                        <span className={`text-xs ${msg.from === "admin" ? "text-indigo-200" : "text-gray-400"}`}>{msg.time}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selected.status !== "resolved" && (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()}
                      placeholder="Type your response..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <button onClick={sendReply} disabled={!reply.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40">Send</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
