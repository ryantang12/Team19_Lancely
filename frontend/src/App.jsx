// ============================================================================
// FILE: frontend/src/App.jsx
// COMPLETE SIMPLE FRONTEND - FIXED VERSION (No Duplicates)
// ============================================================================

import React, { useState, useEffect } from 'react';
import './App.css';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = 'http://localhost:5001/api';  // Changed to 5001 for Mac

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

  const loadJobs = async () => {
    const data = await api.get('/jobs');
    setJobs(data.jobs || []);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('home');
  };

  return (
    <div className="App">
      {/* NAVIGATION */}
      <nav className="navbar">
        <h1 onClick={showHome} style={{cursor: 'pointer'}}>🔧 LANCELY</h1>
        <div>
          <button onClick={showJobs}>Browse Jobs</button>
          {user ? (
            <>
              <span>Hello, {user.username}!</span>
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
        {view === 'login' && <LoginPage setUser={setUser} setView={setView} />}
        {view === 'jobs' && <JobsPage jobs={jobs} showJobDetail={showJobDetail} />}
        {view === 'jobForm' && <JobFormPage categories={categories} setView={setView} loadJobs={loadJobs} />}
        {view === 'jobDetail' && <JobDetailPage job={selectedJob} user={user} />}
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
          type="email"
          name="email"
          placeholder="Email *"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="username"
          placeholder="Username *"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password *"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>
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
    </div>
  );
}

// ============================================================================
// JOB LIST PAGE
// ============================================================================

function JobsPage({ jobs, showJobDetail }) {
  return (
    <div>
      <h2>Available Jobs ({jobs.length})</h2>
      
      {jobs.length === 0 ? (
        <p>No jobs yet. Be the first to post!</p>
      ) : (
        <div className="job-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card" onClick={() => showJobDetail(job)}>
              {job.is_urgent && <span className="urgent-badge">🔥 URGENT</span>}
              <h3>{job.title}</h3>
              <p>{job.description.substring(0, 100)}...</p>
              {job.category && (
                <span className="category-badge">
                  {job.category.icon} {job.category.name}
                </span>
              )}
              <div className="job-footer">
                <span className="budget">${job.budget_amount}</span>
                <span>{job.location_city}, {job.location_state}</span>
              </div>
              <small>Posted by {job.client.username} • {job.proposal_count} proposals</small>
            </div>
          ))}
        </div>
      )}
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
// JOB DETAIL PAGE
// ============================================================================

function JobDetailPage({ job, user }) {
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
      alert('Proposal accepted!');
      api.get(`/proposals/${job.id}`).then(data => {
        setProposals(data.proposals || []);
      });
    }
  };

  if (!job) return <div>Loading...</div>;

  const isOwner = user && user.id === job.client.id;
  const isFreelancer = user && user.user_type === 'freelancer';

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

export default App;