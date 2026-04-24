// ============================================================================
// FILE: frontend/src/App.jsx
// LANCELY — Full Frontend
// Features: redesigned UI, calendar, OpenStreetMap location search, bug fixes
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_URL        = '/api';
const NOMINATIM_URL  = 'https://nominatim.openstreetmap.org';
const LEAFLET_CSS    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// ─── API Helper ───────────────────────────────────────────────────────────────
const api = {
  post: async (url, data) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  get: async (url) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${url}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    return res.json();
  },
  delete: async (url) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    return res.json();
  },
};

// ─── Tiny utilities ───────────────────────────────────────────────────────────
function Spinner({ size = 'md' }) {
  return <div className={`spinner spinner-${size}`} />;
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const icon = { success: '✓', error: '✕', info: 'ℹ' }[type] || 'ℹ';
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icon}</span>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

function Stars({ rating, size = 'sm' }) {
  return (
    <span className={`stars stars-${size}`}>
      {[1,2,3,4,5].map(s => <span key={s} className={s <= Math.round(rating) ? 'star filled' : 'star'}>★</span>)}
    </span>
  );
}

function StatusPill({ status }) {
  const map = { open: 'Open', assigned: 'Assigned', pending_completion: 'Pending', completed: 'Done' };
  return <span className={`pill pill-${status}`}>{map[status] || status}</span>;
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
    </div>
  );
}

// ─── Nominatim location autocomplete hook ────────────────────────────────────
function useLocationSearch() {
  const [query, setQuery]         = useState('');
  const [suggestions, setSugs]    = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState(null);
  const debounce = useRef(null);

  const onChange = (val) => {
    setQuery(val);
    if (selected) setSelected(null);
    clearTimeout(debounce.current);
    if (val.length < 3) { setSugs([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${NOMINATIM_URL}/search?q=${encodeURIComponent(val)}&format=json&limit=5&countrycodes=us`);
        setSugs(await r.json());
      } catch { setSugs([]); }
      setSearching(false);
    }, 400);
  };

  const onSelect = (place) => {
    const parts = place.display_name.split(',');
    setQuery(parts.slice(0, 2).join(',').trim());
    setSugs([]);
    setSelected({ lat: parseFloat(place.lat), lon: parseFloat(place.lon), displayName: place.display_name, city: parts[0]?.trim() });
  };

  const clear = () => { setQuery(''); setSelected(null); setSugs([]); };

  return { query, suggestions, searching, selected, onChange, onSelect, clear };
}

// ─── Leaflet loader (load once) ───────────────────────────────────────────────
let leafletLoading = false;
let leafletReady   = false;
const leafletCallbacks = [];

function loadLeaflet(cb) {
  if (leafletReady) { cb(); return; }
  leafletCallbacks.push(cb);
  if (leafletLoading) return;
  leafletLoading = true;
  // CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
  document.head.appendChild(link);
  // JS
  const script = document.createElement('script');
  script.src = LEAFLET_JS;
  script.onload = () => {
    leafletReady = true;
    leafletCallbacks.forEach(fn => fn());
    leafletCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

// ─── OpenStreetMap component ──────────────────────────────────────────────────
function OSMap({ jobs, onJobClick, center, zoom = 10, mini = false }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);

  const addMarkers = useCallback(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    jobs.forEach(job => {
      if (!job.location_city) return;
      fetch(`${NOMINATIM_URL}/search?q=${encodeURIComponent(job.location_city + ', ' + (job.location_state || '') + ', USA')}&format=json&limit=1`)
        .then(r => r.json()).then(data => {
          if (!data[0] || !mapRef.current) return;
          const lat = parseFloat(data[0].lat) + (Math.random() - 0.5) * 0.008;
          const lon = parseFloat(data[0].lon) + (Math.random() - 0.5) * 0.008;
          const icon = L.divIcon({
            className: '',
            html: `<div class="map-pin${job.is_urgent ? ' map-pin-urgent' : ''}">$${job.budget_amount}</div>`,
            iconSize: [64, 28], iconAnchor: [32, 14],
          });
          const marker = L.marker([lat, lon], { icon }).addTo(mapRef.current);
          if (!mini) {
            marker.bindPopup(`
              <div class="map-popup">
                <strong>${job.title}</strong>
                <p>${job.location_city}, ${job.location_state} · $${job.budget_amount} ${job.budget_type}</p>
                <button onclick="window.__lpJobClick(${job.id})">View Job →</button>
              </div>`);
          } else {
            marker.bindPopup(`${job.location_city}, ${job.location_state}`).openPopup();
          }
          markersRef.current.push(marker);
        }).catch(() => {});
    });
    // global handler for popup button
    window.__lpJobClick = (id) => { const j = jobs.find(x => x.id === id); if (j) onJobClick(j); };
  }, [jobs, mini, onJobClick]);

  useEffect(() => {
    loadLeaflet(() => {
      if (mapRef.current || !containerRef.current) return;
      const L = window.L;
      const defaultCenter = center ? [center.lat, center.lon] : [43.0481, -76.1474];
      const map = L.map(containerRef.current, { zoomControl: !mini, attributionControl: !mini }).setView(defaultCenter, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: mini ? '' : '© OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
      addMarkers();
    });
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && window.L) {
      addMarkers();
      if (center) mapRef.current.setView([center.lat, center.lon], zoom);
    }
  }, [jobs, center, addMarkers]);

  const h = mini ? 200 : 440;
  return <div ref={containerRef} style={{ width: '100%', height: h, borderRadius: 12, zIndex: 0 }} />;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser]           = useState(null);
  const [view, setView]           = useState('home');
  const [jobs, setJobs]           = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [categories, setCategories]   = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const [toast, setToast]         = useState(null);
  const [menuOpen, setMenuOpen]   = useState(false);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type, id: Date.now() }), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) api.get('/me').then(d => { if (d.user) setUser(d.user); }).catch(() => localStorage.removeItem('token'));
    api.get('/categories').then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const poll = () => api.get('/messages/unread').then(d => setUnreadCount(d.count || 0)).catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [user]);

  const go = (v) => { setView(v); setMenuOpen(false); };
  const loadJobs = async () => { const d = await api.get('/jobs'); setJobs(d.jobs || []); };
  const showJobs    = () => { go('jobs'); loadJobs(); };
  const showHome    = () => go('home');
  const openChat    = (job, rid) => { setSelectedChat({ job, rid }); go('chat'); };
  const showProfile = (uid) => { setSelectedJob({ userId: uid }); go('profile'); };
  const logout      = () => { localStorage.removeItem('token'); setUser(null); setUnreadCount(0); go('home'); showToast('Logged out', 'info'); };

  return (
    <div className="App">
      {toast && <Toast key={toast.id} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* NAV */}
      <nav className="navbar">
        <div className="nav-brand" onClick={showHome}>
          <div className="nav-logo">L</div>
          <span className="nav-wordmark">Lancely</span>
        </div>

        <div className="nav-center">
          <button className="nav-link" onClick={showJobs}>Browse Jobs</button>
          {user && <>
            <button className="nav-link" onClick={() => go('calendar')}>📅 Calendar</button>
            <button className="nav-link nav-msg" onClick={() => go('messages')}>
              💬 Messages
              {unreadCount > 0 && <span className="badge-red">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button className="nav-link" onClick={() => go('reviews')}>⭐ Reviews</button>
            {user.user_type !== 'admin' && <button className="nav-link" onClick={() => go('support')}>Support</button>}
            {user.user_type === 'admin'  && <button className="nav-link nav-admin" onClick={() => go('admin')}>🛡️ Admin</button>}
          </>}
        </div>

        <div className="nav-right">
          {user ? (<>
            {user.user_type === 'client' && <button className="btn btn-sm btn-primary" onClick={() => go('jobForm')}>+ Post Job</button>}
            <div className="nav-avatar-wrap" onClick={() => go('account')}>
              <div className="nav-avatar">{user.username[0].toUpperCase()}</div>
              <span className="nav-username">{user.username}</span>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={logout}>Logout</button>
          </>) : (<>
            <button className="btn btn-sm btn-ghost" onClick={() => go('login')}>Login</button>
            <button className="btn btn-sm btn-primary" onClick={() => go('register')}>Sign Up</button>
          </>)}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          {[
            ['Browse Jobs', showJobs],
            ...(user ? [
              ['📅 Calendar', () => go('calendar')],
              [`💬 Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`, () => go('messages')],
              ['⭐ Reviews', () => go('reviews')],
              ['👤 Account', () => go('account')],
              ...(user.user_type === 'client' ? [['+ Post Job', () => go('jobForm')]] : []),
              ['Logout', logout],
            ] : [
              ['Login', () => go('login')],
              ['Sign Up', () => go('register')],
            ]),
          ].map(([label, fn]) => (
            <button key={label} onClick={fn}>{label}</button>
          ))}
        </div>
      )}

      <main className="main-container">
        {view === 'home'         && <HomePage    showJobs={showJobs} goRegister={() => go('register')} />}
        {view === 'register'     && <RegisterPage setUser={setUser} setView={go} showToast={showToast} />}
        {view === 'login'        && <LoginPage    setUser={setUser} setView={go} showToast={showToast} />}
        {view === 'adminReg'     && <AdminRegPage setUser={setUser} setView={go} showToast={showToast} />}
        {view === 'jobs'         && <JobsPage     jobs={jobs} showJobDetail={j => { setSelectedJob(j); go('jobDetail'); }} categories={categories} />}
        {view === 'jobForm'      && <JobFormPage  categories={categories} setView={go} loadJobs={loadJobs} showToast={showToast} />}
        {view === 'jobDetail'    && <JobDetailPage job={selectedJob} user={user} openChat={openChat} showToast={showToast} />}
        {view === 'messages'     && <MessagesPage user={user} openChat={openChat} />}
        {view === 'chat'         && selectedChat && <ChatWindow job={selectedChat.job} receiverId={selectedChat.rid} user={user} setUnreadCount={setUnreadCount} goBack={() => go('messages')} />}
        {view === 'reviews'      && <ReviewsPage  user={user} showProfile={showProfile} showToast={showToast} />}
        {view === 'account'      && <AccountPage  user={user} showToast={showToast} openChat={openChat} goReviews={() => go('reviews')} />}
        {view === 'profile'      && selectedJob?.userId && <ProfilePage userId={selectedJob.userId} />}
        {view === 'calendar'     && <CalendarPage user={user} showToast={showToast} />}
        {view === 'support'      && <SupportPage  user={user} showToast={showToast} />}
        {view === 'admin'        && <AdminPage    user={user} showToast={showToast} />}
      </main>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ showJobs, goRegister }) {
  const features = [
    { icon: '🗺️', title: 'Map-Based Search',   desc: 'Find jobs near you with live OpenStreetMap integration and location autocomplete.' },
    { icon: '📅', title: 'Shared Calendar',     desc: 'Schedule site visits, deadlines, and meetings. Both parties see the same events.' },
    { icon: '💬', title: 'Real-Time Chat',      desc: 'Message clients or contractors directly within a job thread.' },
    { icon: '⭐', title: 'Verified Reviews',    desc: 'Build your reputation through honest reviews once a job is complete.' },
  ];
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-text">
          <div className="hero-eyebrow">🔧 Local Freelance Marketplace</div>
          <h1>Find skilled workers.<br /><span className="hero-accent">Get work done locally.</span></h1>
          <p className="hero-sub">Post jobs, submit proposals, schedule work, and chat — all in one place.</p>
          <div className="hero-btns">
            <button className="btn btn-primary btn-lg" onClick={showJobs}>Browse Jobs</button>
            <button className="btn btn-outline btn-lg" onClick={goRegister}>Get Started Free</button>
          </div>
          <div className="hero-stats">
            <div><strong>500+</strong><small>Jobs Posted</small></div>
            <div className="stat-sep" />
            <div><strong>200+</strong><small>Contractors</small></div>
            <div className="stat-sep" />
            <div><strong>4.8★</strong><small>Avg Rating</small></div>
          </div>
        </div>
        <div className="hero-cards">
          <div className="hero-card hc-1">
            <div className="hc-row">
              <div className="hc-av">JD</div>
              <div><strong>Plumbing Fix</strong><br /><small>$150 fixed · Syracuse, NY</small></div>
              <span className="pill-urgent">🔥 Urgent</span>
            </div>
            <div className="hc-meta">📋 3 proposals · 👁 12 views</div>
          </div>
          <div className="hero-card hc-2">
            <div className="hc-row">
              <div className="hc-av hc-green">AK</div>
              <div><strong>Proposal Accepted!</strong><br /><small>Chat now available</small></div>
            </div>
          </div>
        </div>
      </section>
      <section className="features">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feat-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function AuthCard({ children, logo, title, sub }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-logo" style={logo?.style}>{logo?.content || 'L'}</div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function RegisterPage({ setUser, setView, showToast }) {
  const [form, setForm] = useState({ email: '', username: '', password: '', user_type: 'client', first_name: '', last_name: '' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await api.post('/register', form); setBusy(false);
    if (r.error) setErr(r.error);
    else { localStorage.setItem('token', r.token); setUser(r.user); showToast('Welcome to Lancely!'); setView('jobs'); }
  };

  return (
    <AuthCard title="Create your account" sub="Join thousands of clients and contractors">
      {err && <div className="alert alert-err">{err}</div>}
      <div className="type-toggle">
        {['client','freelancer'].map(t => (
          <button key={t} className={`type-btn${form.user_type === t ? ' active' : ''}`}
            onClick={() => setForm(f => ({ ...f, user_type: t }))}>
            {t === 'client' ? '👤 I need work done' : '🔧 I do the work'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="auth-form">
        <div className="form-row-2">
          <div className="fg"><label>First Name</label><input name="first_name" value={form.first_name} onChange={set} placeholder="John" /></div>
          <div className="fg"><label>Last Name</label><input name="last_name" value={form.last_name} onChange={set} placeholder="Doe" /></div>
        </div>
        <div className="fg"><label>Username *</label><input name="username" value={form.username} onChange={set} placeholder="johndoe" required /></div>
        <div className="fg"><label>Email *</label><input type="email" name="email" value={form.email} onChange={set} placeholder="john@example.com" required /></div>
        <div className="fg"><label>Password *</label><input type="password" name="password" value={form.password} onChange={set} placeholder="••••••••" required /></div>
        <button type="submit" className="btn btn-primary btn-full mt-1" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Create Account'}</button>
      </form>
      <p className="auth-switch">Already have an account? <span className="link" onClick={() => setView('login')}>Log in</span></p>
    </AuthCard>
  );
}

function LoginPage({ setUser, setView, showToast }) {
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [err, setErr]     = useState('');
  const [busy, setBusy]   = useState(false);

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await api.post('/login', { email, password: pass }); setBusy(false);
    if (r.error) setErr(r.error);
    else { localStorage.setItem('token', r.token); setUser(r.user); showToast(`Welcome back, ${r.user.username}!`); setView('jobs'); }
  };

  return (
    <AuthCard title="Welcome back" sub="Log in to your Lancely account">
      {err && <div className="alert alert-err">{err}</div>}
      <form onSubmit={submit} className="auth-form">
        <div className="fg"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" required /></div>
        <div className="fg"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required /></div>
        <button type="submit" className="btn btn-primary btn-full mt-1" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Log In'}</button>
      </form>
      <p className="auth-switch">New here? <span className="link" onClick={() => setView('register')}>Sign up free</span></p>
      <p className="auth-admin" onClick={() => setView('adminReg')}>Admin? Register here</p>
    </AuthCard>
  );
}

function AdminRegPage({ setUser, setView, showToast }) {
  const [form, setForm] = useState({ email:'',username:'',password:'',first_name:'',last_name:'',admin_secret:'' });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const set = e => setForm(f => ({...f, [e.target.name]: e.target.value}));
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await api.post('/admin/register', form); setBusy(false);
    if (r.error) setErr(r.error);
    else { localStorage.setItem('token', r.token); setUser(r.user); setView('admin'); }
  };
  return (
    <AuthCard logo={{ content: '🛡️', style: { background: '#dc2626' } }} title="Admin Registration">
      <div className="alert alert-warn">Authorized administrators only.</div>
      {err && <div className="alert alert-err">{err}</div>}
      <form onSubmit={submit} className="auth-form">
        <div className="form-row-2">
          <div className="fg"><label>First Name</label><input name="first_name" value={form.first_name} onChange={set} /></div>
          <div className="fg"><label>Last Name</label><input name="last_name" value={form.last_name} onChange={set} /></div>
        </div>
        <div className="fg"><label>Username *</label><input name="username" value={form.username} onChange={set} required /></div>
        <div className="fg"><label>Email *</label><input type="email" name="email" value={form.email} onChange={set} required /></div>
        <div className="fg"><label>Password *</label><input type="password" name="password" value={form.password} onChange={set} required /></div>
        <div className="fg"><label>Admin Secret Key *</label><input type="password" name="admin_secret" value={form.admin_secret} onChange={set} required /></div>
        <button type="submit" className="btn btn-primary btn-full mt-1" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Create Admin Account'}</button>
        <button type="button" className="btn btn-ghost btn-full mt-05" onClick={() => setView('login')}>Back to Login</button>
      </form>
    </AuthCard>
  );
}

// ─── Jobs Page ────────────────────────────────────────────────────────────────
function JobsPage({ jobs, showJobDetail, categories }) {
  const [search, setSearch]       = useState('');
  const [cat, setCat]             = useState('');
  const [urgent, setUrgent]       = useState(false);
  const [mapView, setMapView]     = useState(false);
  const locSearch = useLocationSearch();

  const filtered = jobs.filter(j => {
    const matchText   = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !cat || (j.category && j.category.id === parseInt(cat));
    const matchUrgent = !urgent || j.is_urgent;
    const matchLoc    = !locSearch.selected || (j.location_city || '').toLowerCase().includes(locSearch.query.split(',')[0].toLowerCase().trim());
    return matchText && matchCat && matchUrgent && matchLoc;
  });

  return (
    <div className="jobs-page">
      {/* Search bar */}
      <div className="search-bar">
        <div className="search-field">
          <span className="search-prefix">🔍</span>
          <input className="search-input" placeholder="Search jobs by title or description…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="search-field location-field">
          <span className="search-prefix">📍</span>
          <input className="search-input" placeholder="City, state…" value={locSearch.query} onChange={e => locSearch.onChange(e.target.value)} />
          {locSearch.selected && <button className="loc-clear" onClick={locSearch.clear}>×</button>}
          {locSearch.searching && <Spinner size="sm" />}
          {locSearch.suggestions.length > 0 && (
            <div className="loc-dropdown">
              {locSearch.suggestions.map(s => (
                <div key={s.place_id} className="loc-option" onClick={() => locSearch.onSelect(s)}>📍 {s.display_name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="filter-row">
        <select className="filter-select" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <label className="filter-check"><input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} /> 🔥 Urgent only</label>
        <div className="view-switch">
          <button className={!mapView ? 'active' : ''} onClick={() => setMapView(false)}>⊞ Grid</button>
          <button className={mapView  ? 'active' : ''} onClick={() => setMapView(true)}>🗺️ Map</button>
        </div>
        <span className="result-count">{filtered.length} job{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Map */}
      {mapView && (
        <div className="map-wrap">
          <OSMap jobs={filtered} onJobClick={showJobDetail} center={locSearch.selected || undefined} zoom={locSearch.selected ? 12 : 10} />
        </div>
      )}

      {/* Grid */}
      {!mapView && (
        <div className="jobs-grid">
          {filtered.length === 0 && <EmptyState icon="🔍" title="No jobs found" sub="Try adjusting your search or filters" />}
          {filtered.map(job => (
            <div key={job.id} className="job-card" onClick={() => showJobDetail(job)}>
              <div className="jc-top">
                <span className="jc-cat-icon">{job.category?.icon || '📋'}</span>
                {job.is_urgent && <span className="pill-urgent">🔥 Urgent</span>}
              </div>
              <h3 className="jc-title">{job.title}</h3>
              <p className="jc-desc">{job.description.slice(0, 90)}…</p>
              <div className="jc-footer">
                <div className="jc-budget"><strong>${job.budget_amount}</strong><small>{job.budget_type === 'fixed' ? 'fixed' : '/hr'}</small></div>
                <span className="jc-loc">📍 {job.location_city}, {job.location_state}</span>
              </div>
              <div className="jc-meta">
                <span>📋 {job.proposal_count}</span>
                <span>👁 {job.views_count}</span>
                <StatusPill status={job.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Job Form Page ────────────────────────────────────────────────────────────
function JobFormPage({ categories, setView, loadJobs, showToast }) {
  const [form, setForm] = useState({ title:'', description:'', category_id:'', location_city:'', location_state:'', budget_amount:'', budget_type:'fixed', is_urgent:false });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const locSearch = useLocationSearch();

  const set = e => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm(f => ({...f, [e.target.name]: v})); };

  const pickLocation = (place) => {
    locSearch.onSelect(place);
    const parts = place.display_name.split(',');
    const city  = parts[0]?.trim() || '';
    const state = (parts.find(p => /\b[A-Z]{2}\b/.test(p.trim()))?.trim() || parts[1]?.trim() || '').slice(0, 2);
    setForm(f => ({ ...f, location_city: city, location_state: state }));
  };

  const submit = async e => {
    e.preventDefault(); setErr('');
    if (form.title.length < 10)       { setErr('Title must be at least 10 characters'); return; }
    if (form.description.length < 50) { setErr('Description must be at least 50 characters'); return; }
    setBusy(true);
    const r = await api.post('/jobs', form); setBusy(false);
    if (r.error) setErr(r.error);
    else { showToast('Job posted successfully!'); loadJobs(); setView('jobs'); }
  };

  return (
    <div className="centered-page">
      <div className="form-card">
        <h2 className="fc-title">Post a New Job</h2>
        <p className="fc-sub">Describe what you need and contractors will send proposals.</p>
        {err && <div className="alert alert-err">{err}</div>}
        <form onSubmit={submit}>
          <div className="fg">
            <label>Job Title *</label>
            <input name="title" value={form.title} onChange={set} placeholder="e.g., Fix leaking kitchen faucet" required />
            <small className={form.title.length >= 10 ? 'hint-ok' : 'hint'}>{form.title.length}/10 minimum</small>
          </div>
          <div className="fg">
            <label>Category</label>
            <select name="category_id" value={form.category_id} onChange={set}>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={set} placeholder="Describe the work in detail…" rows={5} required />
            <small className={form.description.length >= 50 ? 'hint-ok' : 'hint'}>{form.description.length}/50 minimum</small>
          </div>

          {/* Location with autocomplete */}
          <div className="fg" style={{ position: 'relative' }}>
            <label>Location</label>
            <div className="loc-input-wrap">
              <span className="loc-prefix">📍</span>
              <input className="loc-input" placeholder="Search city or address…" value={locSearch.query} onChange={e => { locSearch.onChange(e.target.value); setForm(f => ({...f, location_city:'', location_state:''})); }} />
            </div>
            {locSearch.suggestions.length > 0 && (
              <div className="loc-dropdown">
                {locSearch.suggestions.map(s => <div key={s.place_id} className="loc-option" onClick={() => pickLocation(s)}>📍 {s.display_name}</div>)}
              </div>
            )}
            {form.location_city && <small className="hint-ok">✓ {form.location_city}, {form.location_state}</small>}
          </div>

          <div className="form-row-2">
            <div className="fg">
              <label>Budget Type</label>
              <select name="budget_type" value={form.budget_type} onChange={set}>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>
            <div className="fg">
              <label>Amount ($) *</label>
              <input type="number" name="budget_amount" value={form.budget_amount} onChange={set} placeholder="150" min="1" required />
            </div>
          </div>

          <label className="check-label">
            <input type="checkbox" name="is_urgent" checked={form.is_urgent} onChange={set} />
            <span>🔥 Mark as Urgent — gets highlighted</span>
          </label>

          <button type="submit" className="btn btn-primary btn-full mt-1" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Post Job'}</button>
          <button type="button" className="btn btn-ghost btn-full mt-05" onClick={() => setView('jobs')}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

// ─── Job Detail Page ──────────────────────────────────────────────────────────
function JobDetailPage({ job, user, openChat, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [proposals, setProps]   = useState([]);
  const [letter, setLetter]     = useState('');
  const [bid, setBid]           = useState('');
  const [currentJob, setJob]    = useState(job);
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (job && user && user.id === job.client.id) api.get(`/proposals/${job.id}`).then(d => setProps(d.proposals || []));
  }, [job, user]);

  const submitProposal = async e => {
    e.preventDefault();
    if (letter.length < 50) { showToast('Cover letter must be at least 50 characters', 'error'); return; }
    setBusy(true);
    const r = await api.post('/proposals', { job_id: job.id, cover_letter: letter, proposed_amount: bid });
    setBusy(false);
    if (r.error) showToast(r.error, 'error');
    else { showToast('Proposal submitted!'); setShowForm(false); setLetter(''); setBid(''); }
  };

  const acceptProposal = async (pid, fl) => {
    if (!window.confirm(`Accept @${fl.username}'s proposal?`)) return;
    const r = await api.post(`/proposals/${pid}/accept`, {});
    if (r.message) {
      showToast('Proposal accepted! Chat is now available.');
      api.get(`/proposals/${job.id}`).then(d => setProps(d.proposals || []));
      api.get(`/jobs/${job.id}`).then(d => { if (d.job) setJob(d.job); });
    }
  };

  if (!currentJob) return <div className="centered-page"><Spinner /></div>;

  const isOwner    = user && user.id === currentJob.client.id;
  const isAssigned = user && currentJob.assigned_freelancer_id && user.id === currentJob.assigned_freelancer_id;
  const canChat    = (isOwner && currentJob.assigned_freelancer_id) || isAssigned;
  const chatRid    = isOwner ? currentJob.assigned_freelancer_id : currentJob.client.id;

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <div className="detail-header">
          <div className="detail-pills">
            <StatusPill status={currentJob.status} />
            {currentJob.is_urgent && <span className="pill-urgent">🔥 Urgent</span>}
            {currentJob.category  && <span className="pill-cat">{currentJob.category.icon} {currentJob.category.name}</span>}
          </div>
          <h1 className="detail-title">{currentJob.title}</h1>
          <div className="detail-meta">
            <span>📍 {currentJob.location_city}, {currentJob.location_state}</span>
            <span>👁 {currentJob.views_count} views</span>
            <span>📋 {currentJob.proposal_count} proposals</span>
          </div>
        </div>

        <div className="detail-card"><h3>Description</h3><p>{currentJob.description}</p></div>

        {/* Location map */}
        {currentJob.location_city && (
          <div className="detail-card">
            <h3>📍 Job Location — {currentJob.location_city}, {currentJob.location_state}</h3>
            <div style={{ marginTop: '0.75rem' }}>
              <OSMap jobs={[currentJob]} onJobClick={() => {}} mini={true}
                center={{ lat: 43.0481, lon: -76.1474 }} zoom={12} />
            </div>
          </div>
        )}

        {/* Chat */}
        {canChat && (
          <div className="detail-card">
            <button className="btn btn-chat" onClick={() => openChat(currentJob, chatRid)}>
              💬 Open Chat with {isOwner ? 'Contractor' : 'Client'}
            </button>
          </div>
        )}

        {/* Proposal form */}
        {user && user.user_type === 'freelancer' && !isOwner && currentJob.status === 'open' && (
          <div className="detail-card">
            {!showForm ? (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>Submit a Proposal</button>
            ) : (
              <form onSubmit={submitProposal}>
                <h3 style={{ marginBottom: '1rem' }}>Your Proposal</h3>
                <div className="fg"><label>Your Bid ($)</label><input type="number" value={bid} onChange={e => setBid(e.target.value)} placeholder="140" min="1" required /></div>
                <div className="fg">
                  <label>Cover Letter <small>(min 50 chars)</small></label>
                  <textarea value={letter} onChange={e => setLetter(e.target.value)} placeholder="Explain why you're the best fit…" rows={5} required />
                  <small className={letter.length >= 50 ? 'hint-ok' : 'hint'}>{letter.length}/50</small>
                </div>
                <div className="btn-row">
                  <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner size="sm" /> : 'Submit'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Proposals list */}
        {isOwner && proposals.length > 0 && (
          <div className="detail-card">
            <h3>Proposals ({proposals.length})</h3>
            <div className="proposals">
              {proposals.map(p => (
                <div key={p.id} className={`proposal-item${p.status === 'accepted' ? ' accepted' : ''}`}>
                  <div className="prop-head">
                    <div><strong>@{p.freelancer.username}</strong>{p.status === 'accepted' && <span className="pill-accepted">✓ Accepted</span>}</div>
                    <div className="prop-bid">${p.proposed_amount}</div>
                  </div>
                  <p className="prop-letter">{p.cover_letter}</p>
                  {p.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => acceptProposal(p.id, p.freelancer)}>Accept Proposal</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="detail-sidebar">
        <div className="sidebar-card">
          <div className="sb-budget">${currentJob.budget_amount}</div>
          <div className="sb-type">{currentJob.budget_type === 'fixed' ? 'Fixed Price' : 'Per Hour'}</div>
        </div>
        <div className="sidebar-card">
          <h4>Posted by</h4>
          <p><strong>{currentJob.client.first_name} {currentJob.client.last_name}</strong></p>
          <p className="muted">@{currentJob.client.username}</p>
        </div>
        {currentJob.assigned_freelancer && (
          <div className="sidebar-card">
            <h4>Assigned to</h4>
            <p><strong>@{currentJob.assigned_freelancer.username}</strong></p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Messages Page ────────────────────────────────────────────────────────────
function MessagesPage({ user, openChat }) {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get('/conversations').then(d => { setConvs(d.conversations || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  if (!user)    return <div className="centered-page"><p>Please log in.</p></div>;
  if (loading)  return <div className="centered-page"><Spinner /></div>;

  return (
    <div className="section-page">
      <div className="section-header"><h2>💬 Messages</h2><span className="muted">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</span></div>
      {convs.length === 0 && <EmptyState icon="💬" title="No conversations yet" sub="Chat opens after a proposal is accepted" />}
      <div className="conv-list">
        {convs.map(c => (
          <div key={c.job_id} className={`conv-card${c.unread_count > 0 ? ' conv-unread' : ''}`}
            onClick={() => {
              const j = { id: c.job_id, title: c.job_title, client: { id: c.client_id }, assigned_freelancer_id: c.assigned_freelancer_id };
              openChat(j, user.id === c.client_id ? c.assigned_freelancer_id : c.client_id);
            }}>
            <div className="conv-av">{c.other_user?.username?.[0]?.toUpperCase() || '?'}</div>
            <div className="conv-body">
              <div className="conv-top"><strong>@{c.other_user?.username}</strong>{c.last_message_at && <span className="muted small">{new Date(c.last_message_at).toLocaleDateString()}</span>}</div>
              <div className="conv-job muted small">{c.job_title}</div>
              {c.last_message && <p className="conv-preview">{c.last_message}</p>}
            </div>
            {c.unread_count > 0 && <div className="badge-blue">{c.unread_count}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ job, receiverId, user, setUnreadCount, goBack }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  const load = () => api.get(`/messages/${job.id}`).then(d => setMsgs(d.messages || [])).catch(() => {});
  const markRead = () => api.post('/messages/read', { job_id: job.id })
    .then(() => api.get('/messages/unread').then(d => setUnreadCount(d.count || 0))).catch(() => {});

  useEffect(() => {
    load(); markRead();
    const id = setInterval(() => { load(); markRead(); }, 5000);
    return () => clearInterval(id);
  }, [job.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    const t = text.trim(); if (!t || busy) return;
    setBusy(true);
    const r = await api.post('/messages', { job_id: job.id, receiver_id: receiverId, content: t });
    if (!r.error) { setText(''); load(); }
    setBusy(false);
  };

  const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const fmtDate = iso => new Date(iso).toLocaleDateString([], { month:'short', day:'numeric' });

  const grouped = msgs.reduce((g, m) => { const d = fmtDate(m.created_at); if (!g[d]) g[d] = []; g[d].push(m); return g; }, {});

  return (
    <div className="chat-wrap">
      <div className="chat-top">
        <button className="btn btn-ghost btn-sm" onClick={goBack}>← Back</button>
        <div className="chat-job-name"><div className="chat-job-av">{job.title[0]}</div>{job.title}</div>
      </div>
      <div className="chat-msgs">
        {msgs.length === 0 && <div className="chat-empty">💬<br />No messages yet. Say hello!</div>}
        {Object.entries(grouped).map(([date, ms]) => (
          <div key={date}>
            <div className="date-sep"><span>{date}</span></div>
            {ms.map(m => {
              const me = m.sender_id === user.id;
              return (
                <div key={m.id} className={`msg-row${me ? ' me' : ' them'}`}>
                  {!me && <div className="msg-who">{m.sender_username}</div>}
                  <div className={`bubble${me ? ' bub-me' : ' bub-them'}`}>{m.content}</div>
                  <div className={`msg-time${me ? ' t-me' : ' t-them'}`}>
                    {fmtTime(m.created_at)}
                    {me && <span className="read-tick">{m.is_read ? ' ✓✓' : ' ✓'}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-bar">
        <textarea className="chat-input" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message… (Enter to send)" rows={2} />
        <button className="send-btn" onClick={send} disabled={!text.trim() || busy}>{busy ? '…' : '➤'}</button>
      </div>
    </div>
  );
}

// ─── Calendar Page ────────────────────────────────────────────────────────────
function CalendarPage({ user, showToast }) {
  const today = new Date();
  const [curDate, setCurDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents]   = useState([]);
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);  // { day: Date }
  const [newEvt, setNewEvt]   = useState({ title:'', time:'09:00', note:'', type:'meeting', job_id:'' });

  // Load events and jobs from backend
  const loadEvents = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [evtRes, jobRes] = await Promise.all([
        api.get('/calendar/events'),
        api.get('/my-jobs'),
      ]);
      setEvents(evtRes.events || []);
      setJobs(jobRes.jobs || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, [user]);

  const addEvent = async () => {
    if (!newEvt.title.trim()) { showToast('Please add a title', 'error'); return; }
    const dateStr = modal.day.toISOString().split('T')[0];
    const r = await api.post('/calendar/events', {
      title: newEvt.title,
      event_date: dateStr,
      event_time: newEvt.time,
      event_type: newEvt.type,
      note: newEvt.note,
      job_id: newEvt.job_id || null,
    });
    if (r.error) { showToast(r.error, 'error'); return; }
    showToast('Event added!');
    setModal(null);
    setNewEvt({ title:'', time:'09:00', note:'', type:'meeting', job_id:'' });
    loadEvents();
  };

  const deleteEvent = async (id) => {
    const r = await api.delete(`/calendar/events/${id}`);
    if (r.error) { showToast(r.error, 'error'); return; }
    showToast('Event removed', 'info');
    loadEvents();
  };

  const year = curDate.getFullYear(), month = curDate.getMonth();
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const monthName    = curDate.toLocaleString('default', { month: 'long' });
  const todayStr     = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const getEvtsForDay = (day) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.event_date === ds);
  };

  const typeColor = { meeting:'#3b82f6', deadline:'#ef4444', reminder:'#f59e0b', job:'#10b981' };
  const cells = Array.from({length: firstDay}, ()=>null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1));

  const modalEvts = modal ? getEvtsForDay(modal.day.getDate()) : [];
  const activeJobs = jobs.filter(j => j.status === 'assigned' || j.status === 'pending_completion');

  if (!user)   return <div className="centered-page"><p>Please log in to view your calendar.</p></div>;
  if (loading) return <div className="centered-page"><Spinner /></div>;

  return (
    <div className="cal-page">
      <div className="section-header">
        <h2>📅 Calendar</h2>
        <p className="muted">Schedule and track work commitments with your team</p>
      </div>

      <div className="cal-layout">
        {/* Grid */}
        <div className="cal-main">
          <div className="cal-nav">
            <button className="cal-arrow" onClick={() => setCurDate(new Date(year, month-1, 1))}>‹</button>
            <h3>{monthName} {year}</h3>
            <button className="cal-arrow" onClick={() => setCurDate(new Date(year, month+1, 1))}>›</button>
          </div>
          <div className="cal-grid">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} className="cal-cell cal-empty" />;
              const dayEvts = getEvtsForDay(day);
              const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              return (
                <div key={day} className={`cal-cell${ds === todayStr ? ' cal-today' : ''}${dayEvts.length > 0 ? ' cal-has-evts' : ''}`}
                  onClick={() => setModal({ day: new Date(year, month, day) })}>
                  <span className={`cal-num${ds === todayStr ? ' cal-num-today' : ''}`}>{day}</span>
                  <div className="cal-dots">
                    {dayEvts.slice(0,3).map(e => <span key={e.id} className="cal-dot" style={{ background: typeColor[e.event_type] || '#888' }} />)}
                    {dayEvts.length > 3 && <span className="cal-dot-more">+{dayEvts.length-3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="cal-sidebar">
          <h3>Upcoming Events</h3>
          {events.filter(e => e.event_date >= todayStr).slice(0,8).map(e => (
            <div key={e.id} className="cal-evt-row">
              <span className="cal-evt-dot" style={{ background: typeColor[e.event_type] || '#888' }} />
              <div className="cal-evt-info">
                <strong>{e.title}</strong>
                <small className="muted">{new Date(e.event_date+'T00:00').toLocaleDateString([],{month:'short',day:'numeric'})} at {e.event_time}</small>
                {e.job_title && <small className="muted"> · {e.job_title}</small>}
              </div>
              {e.creator_id === user?.id && <button className="x-btn" onClick={() => deleteEvent(e.id)}>×</button>}
            </div>
          ))}
          {events.filter(e => e.event_date >= todayStr).length === 0 && <p className="muted small">No upcoming events. Click any day to add one.</p>}

          {activeJobs.length > 0 && (
            <>
              <h3 style={{ marginTop:'1.5rem' }}>Active Jobs</h3>
              {activeJobs.map(j => (
                <div key={j.id} className="cal-evt-row">
                  <span className="cal-evt-dot" style={{ background:'#10b981' }} />
                  <div className="cal-evt-info">
                    <strong style={{ fontSize:'0.82rem' }}>{j.title}</strong>
                    <small><StatusPill status={j.status} /></small>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Day modal */}
      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modal.day.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}</h3>
              <button className="x-btn" onClick={() => setModal(null)}>×</button>
            </div>

            {/* Existing events for this day */}
            {modalEvts.length > 0 && (
              <div className="modal-events">
                {modalEvts.map(e => (
                  <div key={e.id} className="modal-evt-row">
                    <span className="cal-evt-dot" style={{ background: typeColor[e.event_type] }} />
                    <div className="cal-evt-info">
                      <strong>{e.title}</strong> <small className="muted">at {e.event_time}</small>
                      {e.note && <p className="small muted">{e.note}</p>}
                      {e.job_title && <small className="muted">📋 {e.job_title}</small>}
                    </div>
                    {e.creator_id === user?.id && <button className="x-btn" onClick={() => { deleteEvent(e.id); }}>×</button>}
                  </div>
                ))}
              </div>
            )}

            {/* Add new event */}
            <div className="modal-add">
              <h4>Add Event</h4>
              <div className="fg"><label>Title *</label><input value={newEvt.title} onChange={e => setNewEvt(n => ({...n,title:e.target.value}))} placeholder="e.g., Site visit" /></div>
              <div className="form-row-2">
                <div className="fg"><label>Time</label><input type="time" value={newEvt.time} onChange={e => setNewEvt(n => ({...n,time:e.target.value}))} /></div>
                <div className="fg">
                  <label>Type</label>
                  <select value={newEvt.type} onChange={e => setNewEvt(n => ({...n,type:e.target.value}))}>
                    <option value="meeting">📅 Meeting</option>
                    <option value="deadline">🔴 Deadline</option>
                    <option value="reminder">🔔 Reminder</option>
                    <option value="job">🔧 Job Work</option>
                  </select>
                </div>
              </div>
              {activeJobs.length > 0 && (
                <div className="fg">
                  <label>Link to Job (optional)</label>
                  <select value={newEvt.job_id} onChange={e => setNewEvt(n => ({...n,job_id:e.target.value}))}>
                    <option value="">No job</option>
                    {activeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
              )}
              <div className="fg"><label>Note</label><input value={newEvt.note} onChange={e => setNewEvt(n => ({...n,note:e.target.value}))} placeholder="Optional…" /></div>
              <button className="btn btn-primary btn-full mt-1" onClick={addEvent}>Add Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Account Page ─────────────────────────────────────────────────────────────
function AccountPage({ user, showToast, openChat, goReviews }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState(user?.user_type === 'client' ? 'open' : 'assigned');
  const [expanded, setExpanded] = useState(null);

  const load = () => { setLoading(true); api.get('/my-jobs').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { if (user) load(); }, [user]);

  const requestDone = async (id) => {
    if (!window.confirm('Mark job as done?')) return;
    const r = await api.post(`/jobs/${id}/request-completion`, {});
    if (r.error) showToast(r.error, 'error'); else { showToast('Completion requested!'); load(); }
  };
  const confirmDone = async (id) => {
    if (!window.confirm('Confirm this job is completed?')) return;
    const r = await api.post(`/jobs/${id}/confirm-completion`, {});
    if (r.error) showToast(r.error, 'error'); else { showToast('Job marked complete!'); load(); }
  };

  if (!user)    return <div className="centered-page"><p>Please log in.</p></div>;
  if (loading)  return <div className="centered-page"><Spinner /></div>;
  if (!data)    return <div className="centered-page"><p>Unable to load.</p></div>;

  const { jobs } = data;
  const tabs = user.user_type === 'client'
    ? [['open','🟢 Open'],['assigned','🔵 Assigned'],['pending_completion','🟡 Pending'],['completed','✅ Done']]
    : [['assigned','🔵 In Progress'],['pending_completion','🟡 Awaiting Approval'],['completed','✅ Done']];

  const filtered = jobs.filter(j => j.status === tab);

  return (
    <div className="section-page">
      {/* Profile header */}
      <div className="acc-header">
        <div className="acc-av">{user.username[0].toUpperCase()}</div>
        <div className="acc-info">
          <h2>{user.first_name} {user.last_name}</h2>
          <p className="muted">@{user.username}</p>
          <span className={`user-badge user-${user.user_type}`}>{user.user_type === 'client' ? '👤 Client' : '🔧 Contractor'}</span>
        </div>
        <div className="acc-stats">
          <div className="acc-stat"><strong>{jobs.length}</strong><small>Total</small></div>
          <div className="acc-stat"><strong>{jobs.filter(j=>j.status==='completed').length}</strong><small>Done</small></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(([key, label]) => (
          <button key={key} className={`tab-btn${tab===key?' active':''}`} onClick={() => setTab(key)}>
            {label} <span className="tab-ct">{jobs.filter(j=>j.status===key).length}</span>
          </button>
        ))}
      </div>

      {/* Jobs */}
      {filtered.length === 0 && <EmptyState icon="📋" title="No jobs here" sub="Jobs with this status will appear here" />}
      <div className="acc-jobs">
        {filtered.map(job => (
          <div key={job.id} className={`acc-job${expanded===job.id?' open':''}`}>
            <div className="acc-job-head" onClick={() => setExpanded(p => p===job.id?null:job.id)}>
              <div>
                <h4>{job.title}</h4>
                <div className="acc-meta">
                  <StatusPill status={job.status} />
                  <span>${job.budget_amount} {job.budget_type}</span>
                  {job.location_city && <span>📍 {job.location_city}</span>}
                </div>
              </div>
              <span className="toggle-arrow">{expanded===job.id?'▲':'▼'}</span>
            </div>
            {expanded===job.id && (
              <div className="acc-job-body">
                <p>{job.description}</p>
                {user.user_type==='client' && <p><strong>Contractor:</strong> {job.assigned_freelancer?`@${job.assigned_freelancer.username}`:'Not yet assigned'}</p>}
                {user.user_type==='freelancer' && <p><strong>Client:</strong> @{job.client.username}</p>}
                <div className="btn-row mt-1">
                  {user.user_type==='client' && job.status==='assigned' && <button className="btn btn-warning btn-sm" onClick={e=>{e.stopPropagation();requestDone(job.id);}}>✓ Mark as Done</button>}
                  {user.user_type==='freelancer' && job.status==='pending_completion' && <button className="btn btn-success btn-sm" onClick={e=>{e.stopPropagation();confirmDone(job.id);}}>✓ Confirm Complete</button>}
                  {job.status==='completed' && <button className="btn btn-outline btn-sm" onClick={e=>{e.stopPropagation();goReviews();}}>⭐ Leave Review</button>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reviews Page — BUG FIXED ─────────────────────────────────────────────────
function ReviewsPage({ user, showProfile, showToast }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(null);

  useEffect(() => {
    // BUG FIX 1: if no user, stop spinner immediately instead of hanging forever
    if (!user) { setLoading(false); return; }
    api.get('/reviews/pending')
      .then(d => setPending(d.pending_reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false)); // BUG FIX 2: always stop spinner, even on network error
  }, [user]);

  if (!user)    return <div className="centered-page"><p>Please log in.</p></div>;
  if (loading)  return <div className="centered-page"><Spinner /></div>;

  if (writing) return (
    <LeaveReviewForm review={writing} user={user} showToast={showToast}
      onCancel={() => setWriting(null)}
      onSuccess={() => {
        setWriting(null);
        showToast('Review submitted!');
        api.get('/reviews/pending').then(d => setPending(d.pending_reviews || []));
      }} />
  );

  return (
    <div className="section-page">
      <div className="section-header">
        <h2>⭐ Reviews</h2>
        <button className="btn btn-outline btn-sm" onClick={() => showProfile(user.id)}>View My Profile</button>
      </div>
      <div className="card">
        <h3>Pending Reviews</h3>
        {pending.length === 0 && <EmptyState icon="⭐" title="No pending reviews" sub="Complete a job to leave a review" />}
        <div className="pending-list">
          {pending.map(pr => (
            <div key={`${pr.job_id}-${pr.reviewee.id}`} className="pending-row">
              <div>
                <h4>{pr.job_title}</h4>
                <p className="muted small">Review <strong>@{pr.reviewee.username}</strong> ({pr.reviewee.user_type})</p>
              </div>
              <button className="btn btn-success btn-sm" onClick={() => setWriting(pr)}>Write Review →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Leave Review Form ────────────────────────────────────────────────────────
function LeaveReviewForm({ review, user, onCancel, onSuccess, showToast }) {
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [imgUrl, setImgUrl]   = useState('');
  const [busy, setBusy]       = useState(false);

  const submit = async () => {
    if (!rating)         { showToast('Please select a rating', 'error'); return; }
    if (!comment.trim()) { showToast('Please write a comment', 'error'); return; }
    setBusy(true);
    const r = await api.post('/reviews', { job_id: review.job_id, reviewee_id: review.reviewee.id, rating, comment: comment.trim(), image_url: imgUrl.trim() });
    setBusy(false);
    if (r.error) showToast(r.error, 'error'); else onSuccess();
  };

  return (
    <div className="centered-page">
      <div className="form-card">
        <h2 className="fc-title">Write a Review</h2>
        <div className="review-ctx">
          <p><strong>Job:</strong> {review.job_title}</p>
          <p><strong>Reviewing:</strong> @{review.reviewee.username} ({review.reviewee.user_type})</p>
        </div>
        <div className="fg">
          <label>Rating *</label>
          <div className="star-input-row">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`star-pick${s<=(hover||rating)?' picked':''}`}
                onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>★</span>
            ))}
          </div>
          {rating > 0 && <small className="hint-ok">{['','Terrible','Poor','Fair','Good','Excellent'][rating]}</small>}
        </div>
        <div className="fg">
          <label>Your Review *</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience…" rows={5} />
        </div>
        <div className="fg">
          <label>Image URL (optional)</label>
          <input type="url" value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://…" />
          {imgUrl && <img src={imgUrl} alt="preview" className="img-preview" onError={e => e.target.style.display='none'} />}
        </div>
        <div className="btn-row mt-1">
          <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? <Spinner size="sm" /> : 'Submit Review'}</button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get(`/reviews/user/${userId}`).then(d => { setProfile(d); setLoading(false); }); }, [userId]);
  if (loading)  return <div className="centered-page"><Spinner /></div>;
  if (!profile) return <div className="centered-page"><p>User not found.</p></div>;
  const { user, average_rating, total_reviews, reviews } = profile;
  return (
    <div className="section-page">
      <div className="profile-hero">
        <div className="profile-av">{user.username[0].toUpperCase()}</div>
        <div>
          <h2>{user.first_name} {user.last_name}</h2>
          <p className="muted">@{user.username}</p>
          <span className={`user-badge user-${user.user_type}`}>{user.user_type === 'client' ? '👤 Client' : '🔧 Contractor'}</span>
        </div>
        <div className="profile-rating">
          <div className="rating-big">{average_rating.toFixed(1)}</div>
          <Stars rating={average_rating} size="lg" />
          <div className="muted small">{total_reviews} review{total_reviews!==1?'s':''}</div>
        </div>
      </div>
      <h3 style={{ marginBottom:'1rem' }}>Reviews ({total_reviews})</h3>
      {reviews.length === 0 && <EmptyState icon="⭐" title="No reviews yet" />}
      {reviews.map(r => (
        <div key={r.id} className="review-card">
          <div className="rev-head">
            <div><strong>@{r.reviewer.username}</strong><span className="muted small"> on "{r.job.title}"</span></div>
            <div className="rev-right"><Stars rating={r.rating} /><span className="muted small">{new Date(r.created_at).toLocaleDateString()}</span></div>
          </div>
          <p className="rev-comment">{r.comment}</p>
          {r.image_url && <img src={r.image_url} alt="review" className="rev-img" onError={e=>e.target.style.display='none'} />}
        </div>
      ))}
    </div>
  );
}

// ─── Support Page ─────────────────────────────────────────────────────────────
function SupportPage({ user, showToast }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [busy, setBusy]       = useState(false);

  useEffect(() => { api.get('/support').then(d => setTickets(d.tickets||[])).catch(()=>{}); }, []);

  const send = async () => {
    if (!subject.trim()||!message.trim()) { showToast('Fill in both fields','error'); return; }
    setBusy(true);
    const r = await api.post('/support',{subject,message}); setBusy(false);
    if (r.error) showToast(r.error,'error');
    else { showToast('Request sent!'); setSubject(''); setMessage(''); api.get('/support').then(d=>setTickets(d.tickets||[])); }
  };

  if (!user) return <div className="centered-page"><p>Please log in.</p></div>;

  return (
    <div className="section-page">
      <div className="section-header"><h2>🆘 Support</h2><p className="muted">We're here to help</p></div>
      <div className="card">
        <h3>Submit a Request</h3>
        <div className="fg"><label>Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g., Problem with payment…" /></div>
        <div className="fg"><label>Message</label><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe your issue in detail…" rows={5} /></div>
        <button className="btn btn-primary mt-1" onClick={send} disabled={busy}>{busy?<Spinner size="sm"/>:'Send to Admin'}</button>
      </div>
      {tickets.length > 0 && (
        <div style={{ marginTop:'2rem' }}>
          <h3 style={{ marginBottom:'1rem' }}>Your Past Requests</h3>
          {tickets.map(t => (
            <div key={t.id} className={`ticket-card ticket-${t.status}`}>
              <div className="ticket-head"><strong>{t.subject}</strong><span className={`pill${t.status==='open'?' pill-assigned':' pill-completed'}`}>{t.status==='open'?'🟡 Open':'✅ Resolved'}</span></div>
              <p className="muted">{t.message}</p>
              <small className="muted">{new Date(t.created_at).toLocaleDateString()}</small>
              {t.admin_reply && <div className="admin-reply"><strong>Admin Reply:</strong><p>{t.admin_reply}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ user, showToast }) {
  const [tickets, setTickets] = useState([]);
  const [replies, setReplies] = useState({});
  const [filter, setFilter]   = useState('open');
  const [loading, setLoading] = useState(true);

  if (!user || user.user_type !== 'admin') return <div className="centered-page"><div className="alert alert-err">⛔ Admin access only.</div></div>;

  useEffect(() => { load(); }, []);

  const load = async () => { setLoading(true); const d = await api.get('/admin/tickets'); setTickets(d.tickets||[]); setLoading(false); };
  const reply = async (id) => {
    const r = await api.post(`/admin/tickets/${id}/reply`, { reply: replies[id] });
    if (r.error) showToast(r.error,'error'); else { showToast('Reply sent!'); setReplies(p=>({...p,[id]:''})); load(); }
  };

  const filtered = filter==='all' ? tickets : tickets.filter(t=>t.status===filter);

  return (
    <div className="section-page">
      <div className="section-header"><h2>🛡️ Admin Panel</h2><p className="muted">{tickets.length} total ticket{tickets.length!==1?'s':''}</p></div>
      <div className="tab-bar">
        {[['open','Open'],['resolved','Resolved'],['all','All']].map(([k,l]) => (
          <button key={k} className={`tab-btn${filter===k?' active':''}`} onClick={() => setFilter(k)}>
            {l} <span className="tab-ct">{k==='all'?tickets.length:tickets.filter(t=>t.status===k).length}</span>
          </button>
        ))}
      </div>
      {loading && <div className="centered-page"><Spinner /></div>}
      {!loading && filtered.length===0 && <EmptyState icon="✅" title="No tickets" />}
      {filtered.map(t => (
        <div key={t.id} className={`ticket-card ticket-${t.status}`}>
          <div className="ticket-head">
            <div><strong>{t.subject}</strong><span className="muted small"> — @{t.user.username} ({t.user.user_type})</span></div>
            <span className={`pill${t.status==='open'?' pill-assigned':' pill-completed'}`}>{t.status==='open'?'🟡 Open':'✅ Resolved'}</span>
          </div>
          <p className="muted">{t.message}</p>
          <small className="muted">{new Date(t.created_at).toLocaleString()}</small>
          {t.admin_reply && <div className="admin-reply"><strong>Your reply:</strong><p>{t.admin_reply}</p></div>}
          {t.status==='open' && (
            <div className="admin-form">
              <textarea placeholder="Type your response…" value={replies[t.id]||''} onChange={e=>setReplies(p=>({...p,[t.id]:e.target.value}))} rows={3} />
              <button className="btn btn-primary btn-sm" onClick={() => reply(t.id)} disabled={!replies[t.id]?.trim()}>Send & Resolve</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
