// ============================================================================
// FILE: frontend/src/App.jsx
// LANCELY FRONTEND - with Chat Feature
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = '/api';

// Helper to make API calls
const api = {
  post: async (url, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  get: async (url) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${url}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    return response.json();
  }
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [categories, setCategories] = useState([]);

  // ── NEW: chat state ──────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null); // { job, receiverId }
  // ────────────────────────────────────────────────────────────────

  // Load on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/me').then(data => {
        if (data.user) setUser(data.user);
      }).catch(() => localStorage.removeItem('token'));
    }

    api.get('/categories').then(data => {
      setCategories(data.categories || []);
    });
  }, []);

  // ── NEW: poll unread count every 5 seconds when logged in ────────
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = () => {
      api.get('/messages/unread').then(data => {
        setUnreadCount(data.count || 0);
      }).catch(() => {});
    };
    fetchUnread(); // run immediately on login
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval); // cleanup on logout
  }, [user]);
  // ────────────────────────────────────────────────────────────────

  const showHome = () => setView('home');
  const showRegister = () => setView('register');
  const showLogin = () => setView('login');
  const showJobs = () => {
    setView('jobs');
    loadJobs();
  };
  const showJobForm = () => setView('jobForm');
  const showJobDetail = (job) => {
    setSelectedJob(job);
    setView('jobDetail');
  };

  // ── NEW: open chat for a specific job ───────────────────────────
  const openChat = (job, receiverId) => {
    setSelectedChat({ job, receiverId });
    setView('chat');
  };

  const showMessages = () => setView('messages');
  const showAccount = () => setView('account');
  // ────────────────────────────────────────────────────────────────
  
  const showReviews = () => setView('reviews');
  const showSupport = () => setView('support');
  const showAdmin = () => setView('admin');
  const showAdminRegister = () => setView('adminRegister');
  const showUserProfile = (userId) => {
    setSelectedJob({ userId }); // Reuse selectedJob to store userId
    setView('userProfile');
  };
  
  const loadJobs = async () => {
    const data = await api.get('/jobs');
    setJobs(data.jobs || []);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUnreadCount(0);
    setView('home');
  };

  return (
    <div className="App">
      {/* NAVIGATION */}
      <nav className="navbar">
        <h1 onClick={showHome} style={{ cursor: 'pointer' }}>🔧 LANCELY</h1>
        <div>
          <button onClick={showJobs}>Browse Jobs</button>
          {user ? (
            <>
              <span>Hello, {user.username}!</span>

              <button onClick={showMessages} className="msg-btn">
                💬 Messages
                {unreadCount > 0 && (
                  <span className="unread-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={showReviews}>⭐ Reviews</button>

              {/* Support button — visible to clients and freelancers only */}
              {user.user_type !== 'admin' && (
                <button onClick={showSupport}>🆘 Support</button>
              )}

              {/* Admin Panel button — only visible to admin accounts */}
              {user.user_type === 'admin' && (
                <button onClick={showAdmin}>🛡️ Admin Panel</button>
              )}

              <button onClick={showAccount}>👤 Account</button>

              {user.user_type === 'client' && (
                <button onClick={showJobForm}>Post a Job</button>
              )}
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={showLogin}>Login</button>
              <button onClick={showRegister}>Register</button>
            </>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="container">
        {view === 'home' && <HomePage showJobs={showJobs} showRegister={showRegister} />}
        {view === 'register' && <RegisterPage setUser={setUser} setView={setView} />}
        {view === 'login' && <LoginPage setUser={setUser} setView={setView} showAdminRegister={showAdminRegister} />}
        {view === 'adminRegister' && <AdminRegisterPage setUser={setUser} setView={setView} />}
        {view === 'jobs' && <JobsPage jobs={jobs} showJobDetail={showJobDetail} />}
        {view === 'jobForm' && <JobFormPage categories={categories} setView={setView} loadJobs={loadJobs} />}
        {view === 'jobDetail' && (
          <JobDetailPage
            job={selectedJob}
            user={user}
            openChat={openChat}   // NEW prop
          />
        )}
        {/* ── NEW views ── */}
        {view === 'messages' && (
          <MessagesPage user={user} openChat={openChat} />
        )}
        {view === 'chat' && selectedChat && (
          <ChatWindow
            job={selectedChat.job}
            receiverId={selectedChat.receiverId}
            user={user}
            setUnreadCount={setUnreadCount}
            goBack={() => setView('messages')}
          />
        )}
        {view === 'reviews' && (
          <ReviewsPage user={user} showUserProfile={showUserProfile} />
        )}
        {view === 'account' && (
          <AccountPage user={user} />
        )}
        {view === 'userProfile' && selectedJob?.userId && (
          <UserProfilePage userId={selectedJob.userId} currentUser={user} />
        )}
        {/* Support ticket page — for clients and freelancers */}
        {view === 'support' && <SupportPage user={user} />}
        {/* Admin panel — for admin accounts only */}
        {view === 'admin' && <AdminPage user={user} />}
        {/* ─────────────── */}
      </div>
    </div>
  );
}

// ============================================================================
// HOME PAGE
// ============================================================================

function HomePage({ showJobs, showRegister }) {
  return (
    <div className="home">
      <h1>Find Skilled Workers for Any Job</h1>
      <p>Connect with verified professionals for your projects</p>
      <button className="big-button" onClick={showJobs}>Browse Jobs</button>
      <button className="big-button" onClick={showRegister}>Get Started</button>
    </div>
  );
}

// ============================================================================
// REGISTER PAGE
// ============================================================================

function RegisterPage({ setUser, setView }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    user_type: 'client',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await api.post('/register', formData);

    if (result.error) {
      setError(result.error);
    } else {
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setView('jobs');
    }
  };

  return (
    <div className="form-page">
      <h2>Create Account</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>I am a:</label>
        <select name="user_type" value={formData.user_type} onChange={handleChange}>
          <option value="client">Client (I need work done)</option>
          <option value="freelancer">Freelancer (I do the work)</option>
        </select>

        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}

// ============================================================================
// LOGIN PAGE
// ============================================================================

function LoginPage({ setUser, setView, showAdminRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await api.post('/login', { email, password });

    if (result.error) {
      setError(result.error);
    } else {
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setView('jobs');
    }
  };

  return (
    <div className="form-page">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      {/* Hidden admin registration link at the bottom of the login page */}
      <div className="admin-register-link">
        <span onClick={showAdminRegister}>Admin? Register here</span>
      </div>
    </div>
  );
}

// ============================================================================
// JOBS PAGE
// ============================================================================

function JobsPage({ jobs, showJobDetail }) {
  return (
    <div>
      <h2>Available Jobs</h2>
      {jobs.length === 0 && <p>No jobs posted yet.</p>}
      {jobs.map(job => (
        <div
          key={job.id}
          className="job-card"
          onClick={() => showJobDetail(job)}
        >
          <div className="job-header">
            <h3>{job.title}</h3>
            {job.is_urgent && <span className="badge urgent">🔥 URGENT</span>}
          </div>
          <p>{job.description.substring(0, 100)}...</p>
          <div className="job-footer">
            <span className="budget">${job.budget_amount}</span>
            <span>{job.location_city}, {job.location_state}</span>
          </div>
          <div className="job-meta">
            <small>📋 {job.proposal_count} proposals</small>
            <small>👁 {job.views_count} views</small>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// JOB FORM PAGE
// ============================================================================

function JobFormPage({ categories, setView, loadJobs }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location_city: '',
    location_state: '',
    budget_amount: '',
    budget_type: 'fixed',
    is_urgent: false
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.length < 10) {
      setError('Title must be at least 10 characters');
      return;
    }

    if (formData.description.length < 50) {
      setError('Description must be at least 50 characters');
      return;
    }

    const result = await api.post('/jobs', formData);

    if (result.error) {
      setError(result.error);
    } else {
      alert('Job posted successfully!');
      loadJobs();
      setView('jobs');
    }
  };

  return (
    <div className="form-page">
      <h2>Post a New Job</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>Job Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Fix leaking kitchen faucet"
          required
        />
        <small>{formData.title.length}/10 minimum characters</small>

        <label>Category</label>
        <select name="category_id" value={formData.category_id} onChange={handleChange}>
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the work you need done..."
          rows="6"
          required
        />
        <small>{formData.description.length}/50 minimum characters</small>

        <div className="row">
          <div>
            <label>City</label>
            <input
              type="text"
              name="location_city"
              value={formData.location_city}
              onChange={handleChange}
              placeholder="Syracuse"
            />
          </div>
          <div>
            <label>State</label>
            <input
              type="text"
              name="location_state"
              value={formData.location_state}
              onChange={handleChange}
              placeholder="NY"
              maxLength="2"
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label>Budget Type</label>
            <select name="budget_type" value={formData.budget_type} onChange={handleChange}>
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
            </select>
          </div>
          <div>
            <label>Budget Amount ($) *</label>
            <input
              type="number"
              name="budget_amount"
              value={formData.budget_amount}
              onChange={handleChange}
              placeholder="150"
              min="1"
              required
            />
          </div>
        </div>

        <label>
          <input
            type="checkbox"
            name="is_urgent"
            checked={formData.is_urgent}
            onChange={handleChange}
          />
          🔥 This is an urgent job
        </label>

        <button type="submit">Post Job</button>
      </form>
    </div>
  );
}

// ============================================================================
// JOB DETAIL PAGE  (updated to include "Open Chat" button)
// ============================================================================

function JobDetailPage({ job, user, openChat }) {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');

  useEffect(() => {
    if (job && user && user.id === job.client.id) {
      api.get(`/proposals/${job.id}`).then(data => {
        setProposals(data.proposals || []);
      });
    }
  }, [job, user]);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();

    if (coverLetter.length < 50) {
      alert('Cover letter must be at least 50 characters');
      return;
    }

    const result = await api.post('/proposals', {
      job_id: job.id,
      cover_letter: coverLetter,
      proposed_amount: proposedAmount
    });

    if (result.error) {
      alert(result.error);
    } else {
      alert('Proposal submitted successfully!');
      setShowProposalForm(false);
      setCoverLetter('');
      setProposedAmount('');
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    if (!window.confirm('Accept this proposal?')) return;

    const result = await api.post(`/proposals/${proposalId}/accept`, {});

    if (result.message) {
      alert('Proposal accepted! You can now chat with the contractor.');
      api.get(`/proposals/${job.id}`).then(data => {
        setProposals(data.proposals || []);
      });
      // Refresh job so assigned_freelancer_id is up to date
      api.get(`/jobs/${job.id}`).then(data => {
        if (data.job) Object.assign(job, data.job);
      });
    }
  };

  if (!job) return <div>Loading...</div>;

  const isOwner = user && user.id === job.client.id;
  const isFreelancer = user && user.user_type === 'freelancer';

  // ── NEW: determine if user can chat ─────────────────────────────
  const isAssignedFreelancer =
    user && job.assigned_freelancer_id && user.id === job.assigned_freelancer_id;
  const canChat = isOwner && job.assigned_freelancer_id;

  // Work out who to message: client messages the freelancer, freelancer messages the client
  const chatReceiverId = isOwner
    ? job.assigned_freelancer_id
    : job.client.id;
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="job-detail">
      <h2>{job.title}</h2>
      <div className="badges">
        <span className="badge">{job.status}</span>
        {job.is_urgent && <span className="badge urgent">🔥 URGENT</span>}
        {job.category && <span className="badge">{job.category.icon} {job.category.name}</span>}
      </div>

      <div className="detail-section">
        <h3>Description</h3>
        <p>{job.description}</p>
      </div>

      <div className="detail-section">
        <h3>Budget</h3>
        <p className="budget-big">${job.budget_amount}</p>
        <small>{job.budget_type === 'fixed' ? 'Fixed Price' : 'Per Hour'}</small>
      </div>

      <div className="detail-section">
        <h3>Location</h3>
        <p>📍 {job.location_city}, {job.location_state}</p>
      </div>

      <div className="detail-section">
        <h3>Posted By</h3>
        <p>{job.client.first_name} {job.client.last_name} (@{job.client.username})</p>
      </div>

      <div className="detail-section">
        <small>Views: {job.views_count} | Proposals: {job.proposal_count}</small>
      </div>

      {/* ── NEW: Chat button — visible to client (after hiring) and assigned freelancer ── */}
      {(canChat || isAssignedFreelancer) && (
        <div className="detail-section">
          <button
            className="chat-btn"
            onClick={() => openChat(job, chatReceiverId)}
          >
            💬 Open Chat
          </button>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────────────────── */}

      {/* PROPOSAL FORM FOR FREELANCERS */}
      {isFreelancer && !isOwner && job.status === 'open' && (
        <div className="detail-section">
          {!showProposalForm ? (
            <button onClick={() => setShowProposalForm(true)}>Submit Proposal</button>
          ) : (
            <form onSubmit={handleSubmitProposal}>
              <h3>Submit Your Proposal</h3>
              <label>Your Bid ($)</label>
              <input
                type="number"
                value={proposedAmount}
                onChange={(e) => setProposedAmount(e.target.value)}
                placeholder="140"
                min="1"
                required
              />

              <label>Cover Letter (min 50 characters)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you're perfect for this job..."
                rows="5"
                required
              />
              <small>{coverLetter.length}/50 characters</small>

              <button type="submit">Submit Proposal</button>
              <button type="button" onClick={() => setShowProposalForm(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* PROPOSALS LIST FOR JOB OWNER */}
      {isOwner && proposals.length > 0 && (
        <div className="detail-section">
          <h3>Proposals ({proposals.length})</h3>
          {proposals.map(p => (
            <div key={p.id} className="proposal-card">
              <h4>{p.freelancer.username}</h4>
              <p>Bid: <strong>${p.proposed_amount}</strong></p>
              <p>{p.cover_letter}</p>
              <small>Status: {p.status}</small>
              {p.status === 'pending' && (
                <button onClick={() => handleAcceptProposal(p.id)}>Accept</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NEW: MESSAGES PAGE  (list of conversations)
// ============================================================================

function MessagesPage({ user, openChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/conversations').then(data => {
      setConversations(data.conversations || []);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="form-page">
        <p>Please log in to view your messages.</p>
      </div>
    );
  }

  if (loading) return <div className="form-page"><p>Loading conversations...</p></div>;

  return (
    <div className="messages-page">
      <h2>💬 Messages</h2>

      {conversations.length === 0 && (
        <div className="empty-state">
          <p>No conversations yet.</p>
          <p>
            <small>
              Chat becomes available after a client accepts a contractor's proposal.
            </small>
          </p>
        </div>
      )}

      {conversations.map(conv => (
        <div
          key={conv.job_id}
          className={`conversation-card ${conv.unread_count > 0 ? 'has-unread' : ''}`}
          onClick={() => {
            // Build a minimal job object that ChatWindow needs
            const jobObj = {
              id: conv.job_id,
              title: conv.job_title,
              client: { id: conv.client_id },
              assigned_freelancer_id: conv.assigned_freelancer_id
            };
            const receiverId = user.id === conv.client_id
              ? conv.assigned_freelancer_id
              : conv.client_id;
            openChat(jobObj, receiverId);
          }}
        >
          <div className="conv-header">
            <span className="conv-title">{conv.job_title}</span>
            {conv.unread_count > 0 && (
              <span className="unread-badge">{conv.unread_count}</span>
            )}
          </div>
          <div className="conv-meta">
            <span className="conv-other">with @{conv.other_user?.username}</span>
            {conv.last_message_at && (
              <span className="conv-time">
                {new Date(conv.last_message_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {conv.last_message && (
            <p className="conv-preview">{conv.last_message}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// NEW: CHAT WINDOW  (the actual messaging interface)
// ============================================================================

function ChatWindow({ job, receiverId, user, setUnreadCount, goBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load messages and mark them as read
  const loadMessages = () => {
    api.get(`/messages/${job.id}`).then(data => {
      setMessages(data.messages || []);
    }).catch(() => {});
  };

  const markRead = () => {
    api.post('/messages/read', { job_id: job.id }).then(() => {
      // Refresh the global unread count after marking read
      api.get('/messages/unread').then(data => {
        setUnreadCount(data.count || 0);
      });
    }).catch(() => {});
  };

  // Load on mount, then poll every 5 seconds
  useEffect(() => {
    loadMessages();
    markRead();
    const interval = setInterval(() => {
      loadMessages();
      markRead();
    }, 5000);
    return () => clearInterval(interval);
  }, [job.id]);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await api.post('/messages', {
      job_id: job.id,
      receiver_id: receiverId,
      content: trimmed
    });

    if (result.error) {
      alert(result.error);
    } else {
      setText('');
      loadMessages();
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format timestamp nicely
  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date to show date separators
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={goBack}>← Back</button>
        <div className="chat-title">
          <span>💬 {job.title}</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>No messages yet.</p>
            <p><small>Send the first message to get started!</small></p>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="date-separator">
              <span>{date}</span>
            </div>

            {msgs.map(msg => {
              const isMe = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`message-row ${isMe ? 'me' : 'them'}`}
                >
                  {/* Show sender name for their messages */}
                  {!isMe && (
                    <div className="msg-sender">{msg.sender_username}</div>
                  )}
                  <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                    {msg.content}
                  </div>
                  <div className={`msg-time ${isMe ? 'time-me' : 'time-them'}`}>
                    {formatTime(msg.created_at)}
                    {/* Show read receipt for sent messages */}
                    {isMe && <span className="read-receipt">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Invisible div to scroll to */}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// NEW: ACCOUNT PAGE (reservations, posted jobs, history)
// ============================================================================

function AccountPage({ user }) {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.user_type === 'client' ? 'open' : 'assigned');
  const [expandedJobId, setExpandedJobId] = useState(null);

  const loadAccount = () => {
    setLoading(true);
    api.get('/my-jobs').then(data => {
      setAccountData(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!user) return;
    loadAccount();
  }, [user]);

  const refreshAccount = () => {
    loadAccount();
  };

  const handleRequestCompletion = async (jobId) => {
    if (!window.confirm('Mark this job as done and request confirmation from the contractor?')) return;
    const result = await api.post(`/jobs/${jobId}/request-completion`, {});
    if (result.error) {
      alert(result.error || 'Unable to request completion.');
      return;
    }
    alert('Completion requested. Contractor can now confirm the job.');
    refreshAccount();
  };

  const handleConfirmCompletion = async (jobId) => {
    if (!window.confirm('Confirm this job is completed?')) return;
    const result = await api.post(`/jobs/${jobId}/confirm-completion`, {});
    if (result.error) {
      alert(result.error || 'Unable to confirm completion.');
      return;
    }
    alert('Job marked as completed.');
    refreshAccount();
  };

  const toggleJobDetails = (jobId) => {
    setExpandedJobId(prev => (prev === jobId ? null : jobId));
  };

  if (!user) {
    return (
      <div className="form-page">
        <p>Please log in to view your account.</p>
      </div>
    );
  }

  if (loading) return <div className="form-page"><p>Loading account...</p></div>;
  if (!accountData) return <div className="form-page"><p>Unable to load account details.</p></div>;

  const { jobs } = accountData;
  const tabs = user.user_type === 'client'
    ? [
        { key: 'open', label: 'Open Jobs' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'pending_completion', label: 'Pending Confirmation' },
        { key: 'completed', label: 'Completed' }
      ]
    : [
        { key: 'assigned', label: 'In Progress' },
        { key: 'pending_completion', label: 'Awaiting Approval' },
        { key: 'completed', label: 'Completed' }
      ];

  const filteredJobs = jobs.filter(job => job.status === activeTab);

  return (
    <div className="account-page">
      <h2>👤 My Account</h2>
      <div className="account-summary">
        <p><strong>Username:</strong> @{user.username}</p>
        <p><strong>Type:</strong> {user.user_type === 'client' ? 'Client' : 'Freelancer'}</p>
        <p><strong>Total jobs/reservations:</strong> {jobs.length}</p>
      </div>

      <div className="account-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`account-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="account-section">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <p>No jobs in this tab yet.</p>
            <p><small>Select another tab or return to the job list to start work.</small></p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div
              key={job.id}
              className={`account-card ${expandedJobId === job.id ? 'expanded' : ''}`}
              onClick={() => toggleJobDetails(job.id)}
            >
              <div className="account-card-header">
                <div>
                  <span className="job-title">{job.title}</span>
                  <div className="account-card-meta">
                    <span className={`status-tag status-${job.status}`}>{job.status.replace('_', ' ')}</span>
                    <span className="account-card-small">Budget: ${job.budget_amount} / {job.budget_type}</span>
                  </div>
                </div>
                <span className="account-card-toggle">{expandedJobId === job.id ? '▲' : '▼'}</span>
              </div>

              {expandedJobId === job.id && (
                <div className="account-card-details">
                  <p>{job.description}</p>
                  <p><strong>Category:</strong> {job.category?.name || 'N/A'}</p>
                  {user.user_type === 'client' ? (
                    <p><strong>Contractor:</strong> {job.assigned_freelancer ? `@${job.assigned_freelancer.username}` : 'Not assigned yet'}</p>
                  ) : (
                    <p><strong>Customer:</strong> @{job.client.username}</p>
                  )}

                  {user.user_type === 'client' && job.status === 'assigned' && (
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestCompletion(job.id);
                      }}
                    >
                      Mark as Done
                    </button>
                  )}

                  {user.user_type === 'freelancer' && job.status === 'pending_completion' && (
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmCompletion(job.id);
                      }}
                    >
                      Confirm Completion
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NEW: REVIEWS PAGE (list pending reviews and write reviews)
// ============================================================================

function ReviewsPage({ user, showUserProfile }) {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/reviews/pending').then(data => {
      setPendingReviews(data.pending_reviews || []);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="form-page">
        <p>Please log in to view reviews.</p>
      </div>
    );
  }

  if (selectedReview) {
    return (
      <LeaveReviewForm
        review={selectedReview}
        user={user}
        onCancel={() => setSelectedReview(null)}
        onSuccess={() => {
          setSelectedReview(null);
          // Refresh pending reviews
          api.get('/reviews/pending').then(data => {
            setPendingReviews(data.pending_reviews || []);
          });
        }}
      />
    );
  }

  if (loading) return <div className="form-page"><p>Loading...</p></div>;

  return (
    <div className="reviews-page">
      <h2>⭐ Reviews</h2>

      <div className="review-actions">
        <button 
          className="view-my-reviews-btn"
          onClick={() => showUserProfile(user.id)}
        >
          View My Reviews ({user.username})
        </button>
      </div>

      <div className="pending-section">
        <h3>Pending Reviews</h3>
        {pendingReviews.length === 0 ? (
          <div className="empty-state">
            <p>No pending reviews.</p>
            <p><small>Complete a job to leave a review!</small></p>
          </div>
        ) : (
          <div className="pending-reviews-list">
            {pendingReviews.map(pr => (
              <div key={`${pr.job_id}-${pr.reviewee.id}`} className="pending-review-card">
                <div className="pr-header">
                  <span className="pr-job-title">{pr.job_title}</span>
                </div>
                <p className="pr-reviewee">
                  Review {pr.reviewee.user_type === 'client' ? 'client' : 'freelancer'}: 
                  <strong> @{pr.reviewee.username}</strong>
                </p>
                <button
                  className="write-review-btn"
                  onClick={() => setSelectedReview(pr)}
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NEW: LEAVE REVIEW FORM
// ============================================================================

function LeaveReviewForm({ review, user, onCancel, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    setSubmitting(true);
    const result = await api.post('/reviews', {
      job_id: review.job_id,
      reviewee_id: review.reviewee.id,
      rating,
      comment: comment.trim(),
      image_url: imageUrl.trim()
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="form-page review-form">
      <h2>Write Review</h2>
      
      <div className="review-context">
        <p><strong>Job:</strong> {review.job_title}</p>
        <p>
          <strong>Reviewing:</strong> @{review.reviewee.username} 
          ({review.reviewee.user_type})
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>Rating *</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              ★
            </span>
          ))}
        </div>

        <label>Your Review *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience working with this person..."
          rows={6}
          required
        />

        <label>Image URL (Optional)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {imageUrl && (
          <div className="image-preview">
            <img src={imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// NEW: USER PROFILE PAGE (shows reviews received)
// ============================================================================

function UserProfilePage({ userId, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/reviews/user/${userId}`).then(data => {
      setProfile(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="form-page"><p>Loading profile...</p></div>;

  if (!profile) return <div className="form-page"><p>User not found</p></div>;

  const { user, average_rating, total_reviews, reviews } = profile;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>
          {user.first_name} {user.last_name}
          <span className="username-tag">@{user.username}</span>
        </h2>
        <div className="user-type-badge">
          {user.user_type === 'client' ? '👤 Client' : '🔧 Freelancer'}
        </div>
      </div>

      <div className="rating-summary">
        <div className="avg-rating">
          <div className="rating-number">{average_rating.toFixed(1)}</div>
          <div className="stars-display">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={`star ${star <= Math.round(average_rating) ? 'filled' : ''}`}>
                ★
              </span>
            ))}
          </div>
          <div className="review-count">{total_reviews} review{total_reviews !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="reviews-section">
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <div className="empty-state">
            <p>No reviews yet.</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(rev => (
              <div key={rev.id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>@{rev.reviewer.username}</strong>
                    <span className="review-date">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star ${star <= rev.rating ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="review-job">
                  <small>Job: {rev.job.title}</small>
                </div>

                <p className="review-comment">{rev.comment}</p>

                {rev.image_url && (
                  <div className="review-image">
                    <img src={rev.image_url} alt="Review" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ============================================================================
// ADMIN REGISTER PAGE — protected by secret key, linked from Login page
// ============================================================================

function AdminRegisterPage({ setUser, setView }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    admin_secret: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.username || !formData.password || !formData.admin_secret) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    const result = await api.post('/admin/register', formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Log in automatically after successful registration
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setView('admin');  // Go straight to the admin panel
    }
  };

  return (
    <div className="form-page">
      <h2>🛡️ Admin Account Registration</h2>
      <p className="admin-register-notice">
        This page is for authorized administrators only. You must have the admin secret key to create an account.
      </p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {/* The admin secret key field — only someone with the key can register */}
        <input
          type="password"
          name="admin_secret"
          placeholder="Admin Secret Key"
          value={formData.admin_secret}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating Account...' : 'Create Admin Account'}
        </button>
        <button type="button" onClick={() => setView('login')}>
          Back to Login
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// SUPPORT PAGE — for clients and freelancers to contact admin
// ============================================================================

function SupportPage({ user }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load this user's past tickets when the page opens
  useEffect(() => {
    api.get('/support').then(data => {
      setTickets(data.tickets || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Please fill in both subject and message.');
      return;
    }

    setSubmitting(true);
    const result = await api.post('/support', { subject, message });
    setSubmitting(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessMsg('✅ Your support request has been sent! Admin will reply soon.');
      setSubject('');
      setMessage('');
      // Refresh ticket list to show the new ticket
      api.get('/support').then(data => setTickets(data.tickets || []));
    }
  };

  if (!user) return <div className="form-page"><p>Please log in to contact support.</p></div>;

  return (
    <div className="support-page">
      <h2>🆘 Contact Support</h2>
      <p>Having an issue? Fill out the form below and an admin will get back to you.</p>

      {/* SUBMIT FORM */}
      <div className="support-form">
        <h3>Submit a Request</h3>

        {successMsg && <div className="support-success">{successMsg}</div>}
        {errorMsg && <div className="error">{errorMsg}</div>}

        <label>Subject</label>
        <input
          type="text"
          placeholder="e.g. Problem with a payment, Account issue..."
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />

        <label>Message</label>
        <textarea
          placeholder="Describe your issue in detail so we can help..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
        />

        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Sending...' : 'Send to Admin'}
        </button>
      </div>

      {/* PAST TICKETS — shows admin replies when they arrive */}
      {tickets.length > 0 && (
        <div className="support-history">
          <h3>Your Past Requests</h3>
          {tickets.map(t => (
            <div key={t.id} className={`ticket-card ticket-${t.status}`}>
              <div className="ticket-card-header">
                <strong>{t.subject}</strong>
                <span className={`ticket-status-badge ${t.status}`}>
                  {t.status === 'open' ? '🟡 Open' : '✅ Resolved'}
                </span>
              </div>
              <p className="ticket-message">{t.message}</p>
              <small>{new Date(t.created_at).toLocaleDateString()}</small>

              {/* Show admin's reply if one exists */}
              {t.admin_reply && (
                <div className="admin-reply-display">
                  <strong>Admin Reply:</strong>
                  <p>{t.admin_reply}</p>
                  <small>Replied {new Date(t.replied_at).toLocaleDateString()}</small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN PAGE — for admin accounts only
// ============================================================================

function AdminPage({ user }) {
  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState({});  // { ticketId: 'reply string' }
  const [filter, setFilter] = useState('open');    // 'open', 'resolved', 'all'
  const [loading, setLoading] = useState(true);

  // Block non-admins from seeing this page even if they navigate here directly
  if (!user || user.user_type !== 'admin') {
    return <div className="form-page"><p>⛔ You do not have admin access.</p></div>;
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    const data = await api.get('/admin/tickets');
    setTickets(data.tickets || []);
    setLoading(false);
  };

  const handleReply = async (ticketId) => {
    const reply = replyText[ticketId];
    if (!reply?.trim()) return;

    const result = await api.post(`/admin/tickets/${ticketId}/reply`, { reply });
    if (result.error) {
      alert(result.error);
    } else {
      // Clear the reply box for this ticket and refresh the list
      setReplyText(prev => ({ ...prev, [ticketId]: '' }));
      loadTickets();
    }
  };

  // Filter tickets based on the selected tab
  const filtered = tickets.filter(t =>
    filter === 'all' ? true : t.status === filter
  );

  return (
    <div className="admin-page">
      <h2>🛡️ Admin Panel — Support Tickets</h2>
      <p>{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</p>

      {/* FILTER TABS */}
      <div className="admin-filter-bar">
        {['open', 'resolved', 'all'].map(f => (
          <button
            key={f}
            className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p>Loading tickets...</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <p>No {filter === 'all' ? '' : filter} tickets.</p>
        </div>
      )}

      {/* TICKET LIST */}
      {filtered.map(ticket => (
        <div key={ticket.id} className={`admin-ticket-card ticket-${ticket.status}`}>

          {/* Ticket header: subject + who sent it + status badge */}
          <div className="admin-ticket-header">
            <div>
              <strong className="admin-ticket-subject">{ticket.subject}</strong>
              <span className="admin-ticket-meta">
                from <em>@{ticket.user.username}</em> ({ticket.user.email}) —{' '}
                <span className="user-type-tag">{ticket.user.user_type}</span>
              </span>
            </div>
            <span className={`ticket-status-badge ${ticket.status}`}>
              {ticket.status === 'open' ? '🟡 Open' : '✅ Resolved'}
            </span>
          </div>

          {/* The user's message */}
          <p className="admin-ticket-body">{ticket.message}</p>
          <small>Submitted {new Date(ticket.created_at).toLocaleString()}</small>

          {/* Show existing reply if already resolved */}
          {ticket.admin_reply && (
            <div className="admin-reply-display">
              <strong>Your reply:</strong>
              <p>{ticket.admin_reply}</p>
              <small>Sent {new Date(ticket.replied_at).toLocaleString()}</small>
            </div>
          )}

          {/* Reply box — only shown for open tickets */}
          {ticket.status === 'open' && (
            <div className="admin-reply-form">
              <label>Reply to this user:</label>
              <textarea
                placeholder="Type your response to help resolve this issue..."
                value={replyText[ticket.id] || ''}
                onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                rows={3}
              />
              <button
                onClick={() => handleReply(ticket.id)}
                disabled={!replyText[ticket.id]?.trim()}
              >
                Send Reply &amp; Mark Resolved
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
