# ============================================================================
# FILE: backend/app.py
# LANCELY - Simple Flask Backend  (with Chat Feature)
# ============================================================================
"""
LANCELY - Simple Flask Backend
Everything in ONE file for easy understanding!

RUN: python3 app.py
API runs on: http://localhost:5001

WHAT THIS DOES:
- User registration and login
- Job posting
- Job browsing
- Proposals
- Reviews
- CHAT between clients and contractors   <-- NEW
- Everything stored in SQLite database

NO complex structure, NO blueprints, NO migrations
Just simple Python you can understand!
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os

# ============================================================================
# STEP 1: CREATE FLASK APP
# ============================================================================

app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'),
    static_url_path=''
)

# Configuration (all in one place)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this!
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lancely.db'  # Database file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS (so React can talk to Flask)
CORS(app)

# Create database connection
db = SQLAlchemy(app)


# ============================================================================
# STEP 2: DEFINE DATABASE MODELS (Tables)
# ============================================================================

class User(db.Model):
    """User accounts - stores registered users"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'client' or 'freelancer'
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships (connect to other tables)
    jobs = db.relationship('Job', foreign_keys='Job.client_id', backref='client', lazy=True)
    proposals = db.relationship('Proposal', foreign_keys='Proposal.freelancer_id', backref='freelancer', lazy=True)

    def set_password(self, password):
        """Hash password before storing"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)


class Category(db.Model):
    """Job categories (Plumbing, Electrical, etc.)"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    icon = db.Column(db.String(10), default='🔧')

    jobs = db.relationship('Job', backref='category', lazy=True)


class Job(db.Model):
    """Job postings"""
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)

    location_city = db.Column(db.String(100))
    location_state = db.Column(db.String(50))

    budget_amount = db.Column(db.Float, nullable=False)
    budget_type = db.Column(db.String(20), default='fixed')  # 'fixed' or 'hourly'

    status = db.Column(db.String(20), default='open')  # 'open', 'assigned', 'completed'
    is_urgent = db.Column(db.Boolean, default=False)
    views_count = db.Column(db.Integer, default=0)

    # NEW: Track which freelancer was hired so chat knows who to message
    assigned_freelancer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    proposals = db.relationship('Proposal', backref='job', lazy=True)
    messages = db.relationship('Message', backref='job', lazy=True)  # NEW
    assigned_freelancer = db.relationship(
        'User',
        foreign_keys=[assigned_freelancer_id],
        backref='assigned_jobs',
        lazy=True
    )


class Proposal(db.Model):
    """Freelancer proposals/bids on jobs"""
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    freelancer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    cover_letter = db.Column(db.Text, nullable=False)
    proposed_amount = db.Column(db.Float, nullable=False)

    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'rejected'
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)


class Review(db.Model):
    """Reviews and ratings"""
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500))  # Optional image for the review
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships to access user and job info easily
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])
    reviewee = db.relationship('User', foreign_keys=[reviewee_id])
    job = db.relationship('Job', foreign_keys=[job_id])

# ============================================================================
# NEW: MESSAGE MODEL
# ============================================================================

class Message(db.Model):
    """
    Chat messages between a client and contractor about a specific job.

    Every message is tied to a job so both parties always have context.
    is_read tracks whether the recipient has seen the message —
    this is what drives the unread badge on the frontend.
    """
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # These let us do message.sender.username without extra queries
    sender = db.relationship('User', foreign_keys=[sender_id])
    receiver = db.relationship('User', foreign_keys=[receiver_id])


# ============================================================================
# STEP 3: HELPER FUNCTIONS
# ============================================================================

def create_token(user_id):
    """Create JWT token for authentication"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)  # Token expires in 24 hours
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token


def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except:
        return None


def get_current_user():
    """Get current logged-in user from token"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)

    if not user_id:
        return None

    return User.query.get(user_id)


# ============================================================================
# STEP 4: API ROUTES (Endpoints)
# ============================================================================

# --- AUTHENTICATION ROUTES ---

@app.route('/api/register', methods=['POST'])
def register():
    """Register new user - SAVES TO DATABASE"""
    data = request.json

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    # Create new user
    user = User(
        email=data['email'],
        username=data['username'],
        user_type=data['user_type'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    user.set_password(data['password'])

    # Save to database
    db.session.add(user)
    db.session.commit()

    # Create token
    token = create_token(user.id)

    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type
        }
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    """Login user - CHECKS DATABASE"""
    data = request.json

    # Find user in database
    user = User.query.filter_by(email=data['email']).first()

    # Verify user exists and password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Create token
    token = create_token(user.id)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type
        }
    }), 200


@app.route('/api/me', methods=['GET'])
def get_me():
    """Get current user info"""
    user = get_current_user()

    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type
        }
    }), 200


# --- JOB ROUTES ---

@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create new job - SAVES TO DATABASE"""
    user = get_current_user()

    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    if user.user_type != 'client':
        return jsonify({'error': 'Only clients can post jobs'}), 403

    data = request.json

    # Create job
    job = Job(
        client_id=user.id,
        title=data['title'],
        description=data['description'],
        category_id=data.get('category_id'),
        location_city=data.get('location_city'),
        location_state=data.get('location_state'),
        budget_amount=float(data['budget_amount']),
        budget_type=data.get('budget_type', 'fixed'),
        is_urgent=data.get('is_urgent', False)
    )

    # Save to database
    db.session.add(job)
    db.session.commit()

    return jsonify({
        'message': 'Job created successfully',
        'job': {'id': job.id, 'title': job.title}
    }), 201


@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all jobs - QUERIES DATABASE"""
    # Get filter parameters
    query = request.args.get('query', '')
    status = request.args.get('status', 'open')

    # Query database
    jobs_query = Job.query.filter_by(status=status)

    # Search by keyword if provided
    if query:
        jobs_query = jobs_query.filter(
            (Job.title.contains(query)) | (Job.description.contains(query))
        )

    # Get all jobs
    jobs = jobs_query.order_by(Job.created_at.desc()).all()

    # Convert to JSON
    jobs_data = []
    for job in jobs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'description': job.description,
            'budget_amount': job.budget_amount,
            'budget_type': job.budget_type,
            'location_city': job.location_city,
            'location_state': job.location_state,
            'status': job.status,
            'is_urgent': job.is_urgent,
            'views_count': job.views_count,
            'created_at': job.created_at.isoformat(),
            'client': {
                'id': job.client.id,
                'username': job.client.username
            },
            'assigned_freelancer_id': job.assigned_freelancer_id,  # NEW
            'category': {
                'id': job.category.id,
                'name': job.category.name,
                'icon': job.category.icon
            } if job.category else None,
            'proposal_count': len(job.proposals)
        })

    return jsonify({'jobs': jobs_data}), 200


@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get single job - FETCHES FROM DATABASE"""
    job = Job.query.get_or_404(job_id)

    # Increment view counter
    job.views_count += 1
    db.session.commit()

    return jsonify({
        'job': {
            'id': job.id,
            'title': job.title,
            'description': job.description,
            'budget_amount': job.budget_amount,
            'budget_type': job.budget_type,
            'location_city': job.location_city,
            'location_state': job.location_state,
            'status': job.status,
            'is_urgent': job.is_urgent,
            'views_count': job.views_count,
            'created_at': job.created_at.isoformat(),
            'assigned_freelancer_id': job.assigned_freelancer_id,  # NEW
            'client': {
                'id': job.client.id,
                'username': job.client.username,
                'first_name': job.client.first_name,
                'last_name': job.client.last_name
            },
            'category': {
                'id': job.category.id,
                'name': job.category.name,
                'icon': job.category.icon
            } if job.category else None,
            'proposal_count': len(job.proposals)
        }
    }), 200


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all job categories"""
    categories = Category.query.all()

    return jsonify({
        'categories': [
            {'id': c.id, 'name': c.name, 'icon': c.icon}
            for c in categories
        ]
    }), 200


@app.route('/api/my-jobs', methods=['GET'])
def get_my_jobs():
    """Get jobs and reservations for the logged-in user"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    if user.user_type == 'client':
        jobs = Job.query.filter_by(client_id=user.id).order_by(Job.created_at.desc()).all()
    else:
        jobs = Job.query.filter_by(assigned_freelancer_id=user.id).order_by(Job.created_at.desc()).all()

    jobs_data = []
    for job in jobs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'description': job.description,
            'budget_amount': job.budget_amount,
            'budget_type': job.budget_type,
            'category': {
                'id': job.category.id,
                'name': job.category.name,
                'icon': job.category.icon
            } if job.category else None,
            'status': job.status,
            'assigned_freelancer': {
                'id': job.assigned_freelancer.id,
                'username': job.assigned_freelancer.username
            } if job.assigned_freelancer else None,
            'client': {
                'id': job.client.id,
                'username': job.client.username
            } if job.client else None
        })

    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'user_type': user.user_type
        },
        'jobs': jobs_data
    }), 200


# --- PROPOSAL ROUTES ---

@app.route('/api/proposals', methods=['POST'])
def submit_proposal():
    """Submit proposal - SAVES TO DATABASE"""
    user = get_current_user()

    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    if user.user_type != 'freelancer':
        return jsonify({'error': 'Only freelancers can submit proposals'}), 403

    data = request.json

    # Create proposal
    proposal = Proposal(
        job_id=data['job_id'],
        freelancer_id=user.id,
        cover_letter=data['cover_letter'],
        proposed_amount=float(data['proposed_amount'])
    )

    # Save to database
    db.session.add(proposal)
    db.session.commit()

    return jsonify({
        'message': 'Proposal submitted successfully',
        'proposal': {'id': proposal.id}
    }), 201


@app.route('/api/proposals/<int:job_id>', methods=['GET'])
def get_proposals(job_id):
    """Get proposals for a job"""
    proposals = Proposal.query.filter_by(job_id=job_id).all()

    proposals_data = []
    for p in proposals:
        proposals_data.append({
            'id': p.id,
            'freelancer': {
                'id': p.freelancer.id,
                'username': p.freelancer.username
            },
            'cover_letter': p.cover_letter,
            'proposed_amount': p.proposed_amount,
            'status': p.status,
            'submitted_at': p.submitted_at.isoformat()
        })

    return jsonify({'proposals': proposals_data}), 200


@app.route('/api/proposals/<int:proposal_id>/accept', methods=['POST'])
def accept_proposal(proposal_id):
    """Accept a proposal - UPDATES DATABASE"""
    user = get_current_user()

    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    proposal = Proposal.query.get_or_404(proposal_id)

    # Verify user owns the job
    if proposal.job.client_id != user.id:
        return jsonify({'error': 'Not authorized'}), 403

    # Update proposal status
    proposal.status = 'accepted'

    # Update job status
    proposal.job.status = 'assigned'

    # NEW: Record which freelancer was hired so chat can address them
    proposal.job.assigned_freelancer_id = proposal.freelancer_id

    # Save changes
    db.session.commit()

    return jsonify({'message': 'Proposal accepted'}), 200





@app.route('/api/jobs/<int:job_id>/request-completion', methods=['POST'])
def request_job_completion(job_id):
    """Client requests completion for an assigned job."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    job = Job.query.get_or_404(job_id)
    if job.client_id != user.id:
        return jsonify({'error': 'Not authorized'}), 403

    if job.status != 'assigned':
        return jsonify({'error': 'Only assigned jobs can be marked as done'}), 400

    job.status = 'pending_completion'
    db.session.commit()

    return jsonify({'message': 'Completion requested'}), 200


@app.route('/api/jobs/<int:job_id>/confirm-completion', methods=['POST'])
def confirm_job_completion(job_id):
    """Freelancer confirms a job is completed after client requests it."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    job = Job.query.get_or_404(job_id)
    if job.assigned_freelancer_id != user.id:
        return jsonify({'error': 'Not authorized'}), 403

    if job.status != 'pending_completion':
        return jsonify({'error': 'Only jobs pending completion can be confirmed'}), 400

    job.status = 'completed'
    db.session.commit()

    return jsonify({'message': 'Job completed successfully'}), 200

# --- REVIEW ROUTES ---

# REVIEW routes are defined below with full validation and authorization checks.

# ============================================================================
# NEW: CHAT / MESSAGE ROUTES
# ============================================================================

@app.route('/api/messages', methods=['POST'])
def send_message():
    """
    Send a message - SAVES TO DATABASE

    Body: { job_id, receiver_id, content }
    The sender is whoever is logged in (the JWT token user).
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json

    # Basic validation
    if not data.get('content', '').strip():
        return jsonify({'error': 'Message cannot be empty'}), 400

    if not data.get('job_id') or not data.get('receiver_id'):
        return jsonify({'error': 'job_id and receiver_id are required'}), 400

    # Make sure the job exists
    job = Job.query.get(data['job_id'])
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Only allow messaging if the logged-in user is the client or the
    # assigned freelancer for this job
    is_client = job.client_id == user.id
    is_freelancer = job.assigned_freelancer_id == user.id

    if not is_client and not is_freelancer:
        return jsonify({'error': 'You are not a participant in this job'}), 403

    message = Message(
        job_id=data['job_id'],
        sender_id=user.id,
        receiver_id=data['receiver_id'],
        content=data['content'].strip()
    )

    db.session.add(message)
    db.session.commit()

    return jsonify({
        'message': 'Message sent',
        'id': message.id,
        'created_at': message.created_at.isoformat()
    }), 201


@app.route('/api/messages/<int:job_id>', methods=['GET'])
def get_messages(job_id):
    """
    Get all messages for a job thread - QUERIES DATABASE

    Returns messages in chronological order (oldest first).
    Both the client and freelancer for this job can read the thread.
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    job = Job.query.get_or_404(job_id)

    # Only participants can read the thread
    is_client = job.client_id == user.id
    is_freelancer = job.assigned_freelancer_id == user.id

    if not is_client and not is_freelancer:
        return jsonify({'error': 'Not authorized to view this conversation'}), 403

    messages = Message.query.filter_by(job_id=job_id) \
        .order_by(Message.created_at.asc()).all()

    return jsonify({
        'messages': [{
            'id': m.id,
            'sender_id': m.sender_id,
            'sender_username': m.sender.username,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'is_read': m.is_read,
            'created_at': m.created_at.isoformat()
        } for m in messages]
    }), 200


@app.route('/api/messages/unread', methods=['GET'])
def get_unread_count():
    """
    Get count of unread messages for the logged-in user.

    The frontend polls this every 5 seconds to update the navbar badge.
    Returns 0 instead of 401 if not logged in — safe for unauthenticated polls.
    """
    user = get_current_user()
    if not user:
        return jsonify({'count': 0}), 200

    count = Message.query.filter_by(
        receiver_id=user.id,
        is_read=False
    ).count()

    return jsonify({'count': count}), 200


@app.route('/api/messages/read', methods=['POST'])
def mark_messages_read():
    """
    Mark all messages in a job thread as read for the logged-in user.

    Called when the user opens a ChatWindow so the badge clears.
    Body: { job_id }
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    job_id = data.get('job_id')

    if not job_id:
        return jsonify({'error': 'job_id is required'}), 400

    # Only mark messages WHERE this user is the receiver
    Message.query.filter_by(
        job_id=job_id,
        receiver_id=user.id,
        is_read=False
    ).update({'is_read': True})

    db.session.commit()

    return jsonify({'message': 'Messages marked as read'}), 200


# REVIEW ROUTES


@app.route('/api/reviews', methods=['POST'])
def create_review():
    """
    Create a review for a completed job - SAVES TO DATABASE
    
    Both clients and freelancers can leave reviews for each other.
    Body: { job_id, reviewee_id, rating, comment, image_url (optional) }
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ['job_id', 'reviewee_id', 'rating', 'comment']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    job_id = data['job_id']
    reviewee_id = data['reviewee_id']
    rating = data['rating']
    comment = data['comment']
    image_url = data.get('image_url', '')
    
    # Validate rating is 1-5
    if rating not in [1, 2, 3, 4, 5]:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    # Check if job exists
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Only allow reviews if job is completed
    if job.status != 'completed':
        return jsonify({'error': 'Can only review completed jobs'}), 400
    
    # Verify the user is part of this job
    is_client = job.client_id == user.id
    is_freelancer = job.assigned_freelancer_id == user.id
    
    if not is_client and not is_freelancer:
        return jsonify({'error': 'You are not a participant in this job'}), 403
    
    # Check if review already exists
    existing_review = Review.query.filter_by(
        job_id=job_id,
        reviewer_id=user.id,
        reviewee_id=reviewee_id
    ).first()
    
    if existing_review:
        return jsonify({'error': 'You have already reviewed this person for this job'}), 400
    
    # Create the review
    review = Review(
        job_id=job_id,
        reviewer_id=user.id,
        reviewee_id=reviewee_id,
        rating=rating,
        comment=comment.strip(),
        image_url=image_url.strip() if image_url else None
    )
    
    db.session.add(review)
    db.session.commit()
    
    return jsonify({
        'message': 'Review created successfully',
        'review_id': review.id
    }), 201


@app.route('/api/reviews/user/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    """
    Get all reviews for a specific user - QUERIES DATABASE
    
    Returns all reviews where the user is the reviewee,
    along with average rating and total count.
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get all reviews for this user
    reviews = Review.query.filter_by(reviewee_id=user_id)\
        .order_by(Review.created_at.desc()).all()
    
    # Calculate average rating
    total_rating = sum(r.rating for r in reviews)
    avg_rating = total_rating / len(reviews) if reviews else 0
    
    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': user.user_type
        },
        'average_rating': round(avg_rating, 1),
        'total_reviews': len(reviews),
        'reviews': [{
            'id': r.id,
            'rating': r.rating,
            'comment': r.comment,
            'image_url': r.image_url,
            'created_at': r.created_at.isoformat(),
            'job': {
                'id': r.job.id,
                'title': r.job.title
            },
            'reviewer': {
                'id': r.reviewer.id,
                'username': r.reviewer.username,
                'first_name': r.reviewer.first_name,
                'last_name': r.reviewer.last_name
            }
        } for r in reviews]
    }), 200


@app.route('/api/reviews/job/<int:job_id>', methods=['GET'])
def get_job_reviews(job_id):
    """
    Get all reviews for a specific job - QUERIES DATABASE
    
    Returns reviews left by both client and freelancer for this job.
    """
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    reviews = Review.query.filter_by(job_id=job_id).all()
    
    return jsonify({
        'job': {
            'id': job.id,
            'title': job.title,
            'status': job.status
        },
        'reviews': [{
            'id': r.id,
            'rating': r.rating,
            'comment': r.comment,
            'image_url': r.image_url,
            'created_at': r.created_at.isoformat(),
            'reviewer': {
                'id': r.reviewer.id,
                'username': r.reviewer.username,
                'user_type': r.reviewer.user_type
            },
            'reviewee': {
                'id': r.reviewee.id,
                'username': r.reviewee.username,
                'user_type': r.reviewee.user_type
            }
        } for r in reviews]
    }), 200


@app.route('/api/reviews/pending', methods=['GET'])
def get_pending_reviews():
    """
    Get jobs where the logged-in user can leave a review - QUERIES DATABASE
    
    Returns completed jobs where:
    - User is either client or freelancer
    - User hasn't left a review yet
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Find completed jobs where user is involved
    if user.user_type == 'client':
        jobs = Job.query.filter_by(
            client_id=user.id,
            status='completed'
        ).all()
    else:
        jobs = Job.query.filter_by(
            assigned_freelancer_id=user.id,
            status='completed'
        ).all()
    
    pending = []
    for job in jobs:
        # Determine who to review
        if user.user_type == 'client':
            reviewee_id = job.assigned_freelancer_id
        else:
            reviewee_id = job.client_id
        
        if not reviewee_id:
            continue
        
        # Check if review already exists
        existing = Review.query.filter_by(
            job_id=job.id,
            reviewer_id=user.id,
            reviewee_id=reviewee_id
        ).first()
        
        if not existing:
            reviewee = User.query.get(reviewee_id)
            pending.append({
                'job_id': job.id,
                'job_title': job.title,
                'reviewee': {
                    'id': reviewee.id,
                    'username': reviewee.username,
                    'user_type': reviewee.user_type
                }
            })
    
    return jsonify({'pending_reviews': pending}), 200


@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """
    Get a list of jobs that have an active chat thread for the logged-in user.

    Used by the MessagesPage to show a list of conversations.
    Returns jobs where the user is either the client or the assigned freelancer,
    and at least one message has been sent.
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    # Find job IDs that have messages involving this user
    sent = db.session.query(Message.job_id).filter_by(sender_id=user.id)
    received = db.session.query(Message.job_id).filter_by(receiver_id=user.id)
    job_ids = sent.union(received).all()
    job_ids = [j[0] for j in job_ids]

    conversations = []
    for job_id in job_ids:
        job = Job.query.get(job_id)
        if not job:
            continue

        # Count unread messages for this job
        unread = Message.query.filter_by(
            job_id=job_id,
            receiver_id=user.id,
            is_read=False
        ).count()

        # Get the last message for preview
        last_msg = Message.query.filter_by(job_id=job_id) \
            .order_by(Message.created_at.desc()).first()

        # Determine who the other person is
        if job.client_id == user.id and job.assigned_freelancer_id:
            other_user = User.query.get(job.assigned_freelancer_id)
        else:
            other_user = User.query.get(job.client_id)

        conversations.append({
            'job_id': job.id,
            'job_title': job.title,
            'other_user': {
                'id': other_user.id,
                'username': other_user.username
            } if other_user else None,
            'unread_count': unread,
            'last_message': last_msg.content[:60] + '...' if last_msg and len(last_msg.content) > 60 else (last_msg.content if last_msg else ''),
            'last_message_at': last_msg.created_at.isoformat() if last_msg else None,
            'assigned_freelancer_id': job.assigned_freelancer_id,
            'client_id': job.client_id
        })

    # Sort by most recent message first
    conversations.sort(key=lambda x: x['last_message_at'] or '', reverse=True)

    return jsonify({'conversations': conversations}), 200


# ============================================================================
# STEP 5: INITIALIZE DATABASE & SEED DATA
# ============================================================================

def init_db():
    """Create database tables and add initial data"""
    with app.app_context():
        # Create all tables (including the new Message table)
        db.create_all()

        # Add categories if they don't exist
        if Category.query.count() == 0:
            categories = [
                Category(name='Plumbing', icon='🔧'),
                Category(name='Electrical', icon='⚡'),
                Category(name='Carpentry', icon='🔨'),
                Category(name='Painting', icon='🎨'),
                Category(name='HVAC', icon='❄️'),
                Category(name='Landscaping', icon='🏡'),
            ]

            for cat in categories:
                db.session.add(cat)

            db.session.commit()
            print("✅ Categories created!")

        print("✅ Message table ready!")


# Serve React build files for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != '' and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file('index.html')


# ============================================================================
# STEP 6: RUN THE APP
# ============================================================================

if __name__ == '__main__':
    # Initialize database on first run
    init_db()

    print("=" * 60)
    print("🚀 LANCELY API RUNNING")
    print("=" * 60)
    print("Backend: http://localhost:5001")
    print("Chat endpoints:")
    print("  POST   /api/messages          - send a message")
    print("  GET    /api/messages/<job_id> - get thread")
    print("  GET    /api/messages/unread   - unread count (badge)")
    print("  POST   /api/messages/read     - mark as read")
    print("  GET    /api/conversations     - list conversations")
    print("Review endpoints:")
    print("  POST   /api/reviews           - create review")
    print("  GET    /api/reviews/user/<id> - get user's reviews")
    print("  GET    /api/reviews/job/<id>  - get job's reviews")
    print("  GET    /api/reviews/pending   - pending reviews to write")
    print("=" * 60)

    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5001)

    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5001)

