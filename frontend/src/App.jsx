// ============================================================================
// FILE: frontend/src/App.jsx
// LANCELY FRONTEND - with Chat Feature
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = 'http://localhost:5001/api';

// Helper to make API calls with the auth token automatically attached
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

  // Chat state: tracks unread count for the badge and which chat is open
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);

  // On startup, restore the logged-in user from the saved token
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

  // Poll for unread messages every 5 seconds while logged in
  // This keeps the navbar badge up to date without needing websockets
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
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const showHome = () => setView('home');
  const showRegister = () => setView('register');
  const showLogin = () => setView('login');
  const showJobs = () => { setView('jobs'); loadJobs(); };
  const showJobForm = () => setView('jobForm');
  const showMessages = () => setView('messages');

  const showJobDetail = (job) => {
    setSelectedJob(job);
    setView('jobDetail');
  };

  // Open a chat window for a specific job, messaging a specific user
  const openChat = (job, receiverId) => {
    setSelectedChat({ job, receiverId });
    setView('chat');
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

      <div className="container">
        {view === 'home' && (
          <HomePage showJobs={showJobs} showRegister={showRegister} />
        )}
        {view === 'register' && (
          <RegisterPage setUser={setUser} setView={setView} />
        )}
        {view === 'login' && (
          <LoginPage setUser={setUser} setView={setView} />
        )}
        {view === 'jobs' && (
          <JobsPage jobs={jobs} showJobDetail={showJobDetail} />
        )}
        {view === 'jobForm' && (
          <JobFormPage categories={categories} setView={setView} loadJobs={loadJobs} />
        )}
        {view === 'jobDetail' && (
          <JobDetailPage job={selectedJob} user={user} openChat={openChat} />
        )}
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
        <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} />
        <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} />
        <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}

// ============================================================================
// LOGIN PAGE
// ============================================================================

function LoginPage({ setUser, setView }) {
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
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
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
        <div key={job.id} className="job-card" onClick={() => showJobDetail(job)}>
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
    if (formData.title.length < 10) { setError('Title must be at least 10 characters'); return; }
    if (formData.description.length < 50) { setError('Description must be at least 50 characters'); return; }
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
        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Fix leaking kitchen faucet" required />
        <small>{formData.title.length}/10 minimum characters</small>

        <label>Category</label>
        <select name="category_id" value={formData.category_id} onChange={handleChange}>
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>

        <label>Description *</label>
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the work you need done..." rows="6" required />
        <small>{formData.description.length}/50 minimum characters</small>

        <div className="row">
          <div>
            <label>City</label>
            <input type="text" name="location_city" value={formData.location_city} onChange={handleChange} placeholder="Syracuse" />
          </div>
          <div>
            <label>State</label>
            <input type="text" name="location_state" value={formData.location_state} onChange={handleChange} placeholder="NY" maxLength="2" />
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
            <input type="number" name="budget_amount" value={formData.budget_amount} onChange={handleChange} placeholder="150" min="1" required />
          </div>
        </div>

        <label>
          <input type="checkbox" name="is_urgent" checked={formData.is_urgent} onChange={handleChange} />
          {' '}🔥 This is an urgent job
        </label>

        <button type="submit">Post Job</button>
      </form>
    </div>
  );
}

// ============================================================================
// JOB DETAIL PAGE
// ============================================================================

function JobDetailPage({ job: initialJob, user, openChat }) {
  // Store the job in local state so we can refresh it after accepting a proposal.
  // Using the prop directly would leave us with stale data (no assigned_freelancer_id)
  // until the user navigated away and back.
  const [currentJob, setCurrentJob] = useState(initialJob);
  const job = currentJob;

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');

  // Load proposals when a client views their own job
  useEffect(() => {
    if (job && user && user.id === job.client.id) {
      api.get(`/proposals/${job.id}`).then(data => {
        setProposals(data.proposals || []);
      });
    }
  }, [job, user]);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (coverLetter.length < 50) { alert('Cover letter must be at least 50 characters'); return; }
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
      // Reload both the proposals list and the job at the same time.
      // The fresh job will have assigned_freelancer_id set, which is
      // what makes the Message button appear on the accepted proposal card.
      const [proposalsData, jobData] = await Promise.all([
        api.get(`/proposals/${job.id}`),
        api.get(`/jobs/${job.id}`)
      ]);
      setProposals(proposalsData.proposals || []);
      if (jobData.job) setCurrentJob(jobData.job);
      alert('Proposal accepted! You can now message this contractor.');
    }
  };

  if (!job) return <div>Loading...</div>;

  const isOwner = user && user.id === job.client.id;
  const isFreelancer = user && user.user_type === 'freelancer';
  const isAssignedFreelancer = user && job.assigned_freelancer_id && user.id === job.assigned_freelancer_id;

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

      {/* Chat button for the hired freelancer — lets them message the client */}
      {isAssignedFreelancer && (
        <div className="detail-section">
          <button className="chat-btn" onClick={() => openChat(job, job.client.id)}>
            💬 Message Client
          </button>
        </div>
      )}

      {/* Proposal form — only for freelancers on open jobs */}
      {isFreelancer && !isOwner && job.status === 'open' && (
        <div className="detail-section">
          {!showProposalForm ? (
            <button onClick={() => setShowProposalForm(true)}>Submit Proposal</button>
          ) : (
            <form onSubmit={handleSubmitProposal}>
              <h3>Submit Your Proposal</h3>
              <label>Your Bid ($)</label>
              <input type="number" value={proposedAmount} onChange={(e) => setProposedAmount(e.target.value)} placeholder="140" min="1" required />
              <label>Cover Letter (min 50 characters)</label>
              <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Explain why you're perfect for this job..." rows="5" required />
              <small>{coverLetter.length}/50 characters</small>
              <button type="submit">Submit Proposal</button>
              <button type="button" onClick={() => setShowProposalForm(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {/* Proposals list — only visible to the job owner */}
      {isOwner && proposals.length > 0 && (
        <div className="detail-section">
          <h3>Proposals ({proposals.length})</h3>
          {proposals.map(p => (
            <div key={p.id} className="proposal-card">
              <h4>{p.freelancer.username}</h4>
              <p>Bid: <strong>${p.proposed_amount}</strong></p>
              <p>{p.cover_letter}</p>
              <small>Status: {p.status}</small>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {/* Accept button — shown while the proposal is still pending */}
                {p.status === 'pending' && (
                  <button onClick={() => handleAcceptProposal(p.id)}>Accept</button>
                )}
                {/* Message button — replaces Accept once the proposal is accepted */}
                {p.status === 'accepted' && (
                  <button className="chat-btn" onClick={() => openChat(job, p.freelancer.id)}>
                    💬 Message {p.freelancer.username}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MESSAGES PAGE — list of all conversations for the logged-in user
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
    return <div className="form-page"><p>Please log in to view your messages.</p></div>;
  }

  if (loading) return <div className="form-page"><p>Loading conversations...</p></div>;

  return (
    <div className="messages-page">
      <h2>💬 Messages</h2>

      {conversations.length === 0 && (
        <div className="empty-state">
          <p>No conversations yet.</p>
          <small>Chat becomes available after a client accepts a proposal.</small>
        </div>
      )}

      {conversations.map(conv => (
        <div
          key={conv.job_id}
          className={`conversation-card ${conv.unread_count > 0 ? 'has-unread' : ''}`}
          onClick={() => {
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
// CHAT WINDOW — the actual messaging interface
// ============================================================================

function ChatWindow({ job, receiverId, user, setUnreadCount, goBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = () => {
    api.get(`/messages/${job.id}`).then(data => {
      setMessages(data.messages || []);
    }).catch(() => {});
  };

  const markRead = () => {
    api.post('/messages/read', { job_id: job.id }).then(() => {
      api.get('/messages/unread').then(data => {
        setUnreadCount(data.count || 0);
      });
    }).catch(() => {});
  };

  // Load messages immediately, then refresh every 5 seconds
  useEffect(() => {
    loadMessages();
    markRead();
    const interval = setInterval(() => {
      loadMessages();
      markRead();
    }, 5000);
    return () => clearInterval(interval);
  }, [job.id]);

  // Scroll to the bottom whenever new messages arrive
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

  // Enter sends, Shift+Enter adds a new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  // Group messages by date to show date separator labels between them
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={goBack}>← Back</button>
        <div className="chat-title">💬 {job.title}</div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>No messages yet.</p>
            <small>Send the first message to get started!</small>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-separator">
              <span>{date}</span>
            </div>
            {msgs.map(msg => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`message-row ${isMe ? 'me' : 'them'}`}>
                  {!isMe && <div className="msg-sender">{msg.sender_username}</div>}
                  <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                    {msg.content}
                  </div>
                  <div className={`msg-time ${isMe ? 'time-me' : 'time-them'}`}>
                    {formatTime(msg.created_at)}
                    {isMe && (
                      <span className="read-receipt">{msg.is_read ? ' ✓✓' : ' ✓'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

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

export default App;