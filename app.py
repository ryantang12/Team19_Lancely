
# FILE: backend/app.py
# LANCELY — Flask Backend (Chat + Reviews + Calendar + Support + Admin)

"""
Run: python3 app.py
API: http://localhost:5001

Everything in one file. No blueprints, no magic.
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os


# APP SETUP


app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'),
    static_url_path=''
)

app.config['SECRET_KEY']               = 'your-secret-key-change-me'
app.config['SQLALCHEMY_DATABASE_URI']  = 'sqlite:///lancely.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['ADMIN_SECRET']             = 'lancely-admin-2024'

CORS(app)
db = SQLAlchemy(app)



# MODELS


class User(db.Model):
    """Registered users — clients, freelancers, or admins."""
    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    user_type     = db.Column(db.String(20),  nullable=False)  # client / freelancer / admin
    first_name    = db.Column(db.String(50),  default='')
    last_name     = db.Column(db.String(50),  default='')
    created_at    = db.Column(db.DateTime,    default=datetime.utcnow)

    jobs      = db.relationship('Job',      foreign_keys='Job.client_id',      backref='client',     lazy=True)
    proposals = db.relationship('Proposal', foreign_keys='Proposal.freelancer_id', backref='freelancer', lazy=True)

    def set_password(self, pw):   self.password_hash = generate_password_hash(pw)
    def check_password(self, pw): return check_password_hash(self.password_hash, pw)


class Category(db.Model):
    """Job categories (Plumbing, Electrical, …)"""
    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    icon = db.Column(db.String(10),  default='🔧')
    jobs = db.relationship('Job', backref='category', lazy=True)


class Job(db.Model):
    """Job postings created by clients."""
    id          = db.Column(db.Integer, primary_key=True)
    client_id   = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))

    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text,        nullable=False)

    location_city  = db.Column(db.String(100))
    location_state = db.Column(db.String(50))

    budget_amount = db.Column(db.Float,      nullable=False)
    budget_type   = db.Column(db.String(20), default='fixed')   # fixed / hourly
    status        = db.Column(db.String(20), default='open')     # open / assigned / pending_completion / completed
    is_urgent     = db.Column(db.Boolean,    default=False)
    views_count   = db.Column(db.Integer,    default=0)

    # Who was hired
    assigned_freelancer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    proposals = db.relationship('Proposal', backref='job',  lazy=True)
    messages  = db.relationship('Message',  backref='job',  lazy=True)
    events    = db.relationship('CalendarEvent', backref='job', lazy=True)

    assigned_freelancer = db.relationship(
        'User', foreign_keys=[assigned_freelancer_id],
        backref='assigned_jobs', lazy=True
    )


class Proposal(db.Model):
    """A freelancer's bid on a job."""
    id              = db.Column(db.Integer, primary_key=True)
    job_id          = db.Column(db.Integer, db.ForeignKey('job.id'),  nullable=False)
    freelancer_id   = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cover_letter    = db.Column(db.Text,    nullable=False)
    proposed_amount = db.Column(db.Float,   nullable=False)
    status          = db.Column(db.String(20), default='pending')  # pending / accepted / rejected
    submitted_at    = db.Column(db.DateTime,   default=datetime.utcnow)


class Review(db.Model):
    """Star rating + comment left after a job completes."""
    id          = db.Column(db.Integer, primary_key=True)
    job_id      = db.Column(db.Integer, db.ForeignKey('job.id'),  nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating      = db.Column(db.Integer, nullable=False)  # 1-5
    comment     = db.Column(db.Text,    nullable=False)
    image_url   = db.Column(db.String(500))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    reviewer = db.relationship('User', foreign_keys=[reviewer_id])
    reviewee = db.relationship('User', foreign_keys=[reviewee_id])
    job      = db.relationship('Job',  foreign_keys=[job_id])


class Message(db.Model):
    """Chat message between client and freelancer about a job."""
    id          = db.Column(db.Integer, primary_key=True)
    job_id      = db.Column(db.Integer, db.ForeignKey('job.id'),  nullable=False)
    sender_id   = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content     = db.Column(db.Text,    nullable=False)
    is_read     = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    sender   = db.relationship('User', foreign_keys=[sender_id])
    receiver = db.relationship('User', foreign_keys=[receiver_id])


class CalendarEvent(db.Model):
    """
    Scheduled event for a job — visible to both client and contractor.
    Either party can create events; both can see them.
    """
    id          = db.Column(db.Integer, primary_key=True)
    job_id      = db.Column(db.Integer, db.ForeignKey('job.id'),  nullable=False)
    creator_id  = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    event_date  = db.Column(db.String(10),  nullable=False)  # YYYY-MM-DD
    event_time  = db.Column(db.String(5),   default='09:00') # HH:MM
    event_type  = db.Column(db.String(30),  default='meeting')  # meeting / deadline / reminder / job
    note        = db.Column(db.Text,        default='')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[creator_id])


class SupportTicket(db.Model):
    """Support request from a user to admin."""
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject     = db.Column(db.String(200), nullable=False)
    message     = db.Column(db.Text,        nullable=False)
    status      = db.Column(db.String(20),  default='open')   # open / resolved
    admin_reply = db.Column(db.Text,        nullable=True)
    replied_at  = db.Column(db.DateTime,    nullable=True)
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])



# AUTH HELPERS


def create_token(user_id):
    payload = {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        return jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['user_id']
    except:
        return None

def get_current_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    uid = verify_token(token)
    return User.query.get(uid) if uid else None



# AUTH ROUTES


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        email=data['email'], username=data['username'],
        user_type=data['user_type'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Registered successfully',
        'token': create_token(user.id),
        'user': {'id': user.id, 'username': user.username, 'email': user.email, 'user_type': user.user_type}
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    return jsonify({
        'message': 'Login successful',
        'token': create_token(user.id),
        'user': {'id': user.id, 'username': user.username, 'email': user.email, 'user_type': user.user_type}
    }), 200


@app.route('/api/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify({'user': {'id': user.id, 'username': user.username, 'email': user.email, 'user_type': user.user_type}}), 200



# JOB ROUTES


@app.route('/api/jobs', methods=['POST'])
def create_job():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    if user.user_type != 'client': return jsonify({'error': 'Only clients can post jobs'}), 403

    data = request.json
    job = Job(
        client_id=user.id,
        title=data['title'], description=data['description'],
        category_id=data.get('category_id'),
        location_city=data.get('location_city', ''),
        location_state=data.get('location_state', ''),
        budget_amount=float(data['budget_amount']),
        budget_type=data.get('budget_type', 'fixed'),
        is_urgent=data.get('is_urgent', False)
    )
    db.session.add(job)
    db.session.commit()
    return jsonify({'message': 'Job created', 'job': {'id': job.id, 'title': job.title}}), 201


def _job_dict(job, include_proposals=False):
    """Serialize a Job object to dict."""
    d = {
        'id': job.id, 'title': job.title, 'description': job.description,
        'budget_amount': job.budget_amount, 'budget_type': job.budget_type,
        'location_city': job.location_city, 'location_state': job.location_state,
        'status': job.status, 'is_urgent': job.is_urgent,
        'views_count': job.views_count,
        'created_at': job.created_at.isoformat(),
        'assigned_freelancer_id': job.assigned_freelancer_id,
        'client': {
            'id': job.client.id, 'username': job.client.username,
            'first_name': job.client.first_name, 'last_name': job.client.last_name
        },
        'assigned_freelancer': {
            'id': job.assigned_freelancer.id, 'username': job.assigned_freelancer.username
        } if job.assigned_freelancer else None,
        'category': {
            'id': job.category.id, 'name': job.category.name, 'icon': job.category.icon
        } if job.category else None,
        'proposal_count': len(job.proposals)
    }
    return d


@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    jobs = Job.query.filter_by(status='open').order_by(Job.created_at.desc()).all()
    return jsonify({'jobs': [_job_dict(j) for j in jobs]}), 200


@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get_or_404(job_id)
    job.views_count += 1
    db.session.commit()
    return jsonify({'job': _job_dict(job)}), 200


@app.route('/api/categories', methods=['GET'])
def get_categories():
    cats = Category.query.all()
    return jsonify({'categories': [{'id': c.id, 'name': c.name, 'icon': c.icon} for c in cats]}), 200


@app.route('/api/my-jobs', methods=['GET'])
def get_my_jobs():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    if user.user_type == 'client':
        jobs = Job.query.filter_by(client_id=user.id).order_by(Job.created_at.desc()).all()
    else:
        jobs = Job.query.filter_by(assigned_freelancer_id=user.id).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        d = _job_dict(job)
        result.append(d)

    return jsonify({'user': {'id': user.id, 'username': user.username, 'user_type': user.user_type}, 'jobs': result}), 200



# PROPOSAL ROUTES


@app.route('/api/proposals', methods=['POST'])
def submit_proposal():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    if user.user_type != 'freelancer': return jsonify({'error': 'Only freelancers can submit proposals'}), 403

    data = request.json
    p = Proposal(
        job_id=data['job_id'], freelancer_id=user.id,
        cover_letter=data['cover_letter'],
        proposed_amount=float(data['proposed_amount'])
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({'message': 'Proposal submitted', 'proposal': {'id': p.id}}), 201


@app.route('/api/proposals/<int:job_id>', methods=['GET'])
def get_proposals(job_id):
    proposals = Proposal.query.filter_by(job_id=job_id).all()
    return jsonify({'proposals': [{
        'id': p.id,
        'freelancer': {'id': p.freelancer.id, 'username': p.freelancer.username},
        'cover_letter': p.cover_letter,
        'proposed_amount': p.proposed_amount,
        'status': p.status,
        'submitted_at': p.submitted_at.isoformat()
    } for p in proposals]}), 200


@app.route('/api/proposals/<int:proposal_id>/accept', methods=['POST'])
def accept_proposal(proposal_id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    p = Proposal.query.get_or_404(proposal_id)
    if p.job.client_id != user.id: return jsonify({'error': 'Not authorized'}), 403

    p.status = 'accepted'
    p.job.status = 'assigned'
    p.job.assigned_freelancer_id = p.freelancer_id
    db.session.commit()
    return jsonify({'message': 'Proposal accepted'}), 200


@app.route('/api/jobs/<int:job_id>/request-completion', methods=['POST'])
def request_completion(job_id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    job = Job.query.get_or_404(job_id)
    if job.client_id != user.id: return jsonify({'error': 'Not authorized'}), 403
    if job.status != 'assigned': return jsonify({'error': 'Only assigned jobs can be marked done'}), 400
    job.status = 'pending_completion'
    db.session.commit()
    return jsonify({'message': 'Completion requested'}), 200


@app.route('/api/jobs/<int:job_id>/confirm-completion', methods=['POST'])
def confirm_completion(job_id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    job = Job.query.get_or_404(job_id)
    if job.assigned_freelancer_id != user.id: return jsonify({'error': 'Not authorized'}), 403
    if job.status != 'pending_completion': return jsonify({'error': 'Job not pending completion'}), 400
    job.status = 'completed'
    db.session.commit()
    return jsonify({'message': 'Job completed'}), 200



# MESSAGE / CHAT ROUTES


@app.route('/api/messages', methods=['POST'])
def send_message():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    if not data.get('content', '').strip():     return jsonify({'error': 'Message cannot be empty'}), 400
    if not data.get('job_id'):                  return jsonify({'error': 'job_id required'}), 400
    if not data.get('receiver_id'):             return jsonify({'error': 'receiver_id required'}), 400

    job = Job.query.get(data['job_id'])
    if not job: return jsonify({'error': 'Job not found'}), 404

    if job.client_id != user.id and job.assigned_freelancer_id != user.id:
        return jsonify({'error': 'Not a participant in this job'}), 403

    msg = Message(
        job_id=data['job_id'], sender_id=user.id,
        receiver_id=data['receiver_id'], content=data['content'].strip()
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'message': 'Sent', 'id': msg.id, 'created_at': msg.created_at.isoformat()}), 201


@app.route('/api/messages/<int:job_id>', methods=['GET'])
def get_messages(job_id):
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    job = Job.query.get_or_404(job_id)
    if job.client_id != user.id and job.assigned_freelancer_id != user.id:
        return jsonify({'error': 'Not authorized'}), 403

    msgs = Message.query.filter_by(job_id=job_id).order_by(Message.created_at.asc()).all()
    return jsonify({'messages': [{
        'id': m.id, 'sender_id': m.sender_id,
        'sender_username': m.sender.username,
        'receiver_id': m.receiver_id,
        'content': m.content, 'is_read': m.is_read,
        'created_at': m.created_at.isoformat()
    } for m in msgs]}), 200


@app.route('/api/messages/unread', methods=['GET'])
def get_unread_count():
    user = get_current_user()
    if not user: return jsonify({'count': 0}), 200
    count = Message.query.filter_by(receiver_id=user.id, is_read=False).count()
    return jsonify({'count': count}), 200


@app.route('/api/messages/read', methods=['POST'])
def mark_read():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    job_id = request.json.get('job_id')
    if not job_id: return jsonify({'error': 'job_id required'}), 400
    Message.query.filter_by(job_id=job_id, receiver_id=user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Marked read'}), 200


@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    sent     = db.session.query(Message.job_id).filter_by(sender_id=user.id)
    received = db.session.query(Message.job_id).filter_by(receiver_id=user.id)
    job_ids  = [j[0] for j in sent.union(received).all()]

    convs = []
    for jid in job_ids:
        job = Job.query.get(jid)
        if not job: continue

        unread = Message.query.filter_by(job_id=jid, receiver_id=user.id, is_read=False).count()
        last   = Message.query.filter_by(job_id=jid).order_by(Message.created_at.desc()).first()

        other = User.query.get(job.assigned_freelancer_id) if job.client_id == user.id else User.query.get(job.client_id)

        convs.append({
            'job_id': job.id, 'job_title': job.title,
            'other_user': {'id': other.id, 'username': other.username} if other else None,
            'unread_count': unread,
            'last_message': (last.content[:60] + '...') if last and len(last.content) > 60 else (last.content if last else ''),
            'last_message_at': last.created_at.isoformat() if last else None,
            'assigned_freelancer_id': job.assigned_freelancer_id,
            'client_id': job.client_id
        })

    convs.sort(key=lambda x: x['last_message_at'] or '', reverse=True)
    return jsonify({'conversations': convs}), 200



# CALENDAR ROUTES — shared events for jobs


@app.route('/api/calendar/events', methods=['GET'])
def get_calendar_events():
    """
    Get all calendar events for the logged-in user.
    Returns events for jobs they are a client or assigned freelancer on.
    Also returns personal (job_id=None) events they created.
    Optional ?month=YYYY-MM filter.
    """
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    month = request.args.get('month')  # optional YYYY-MM filter

    # Find job IDs this user is involved in
    if user.user_type == 'client':
        job_ids = [j.id for j in Job.query.filter_by(client_id=user.id).all()]
    else:
        job_ids = [j.id for j in Job.query.filter_by(assigned_freelancer_id=user.id).all()]

    # Events on those jobs OR personal events created by this user (job_id=None)
    q = CalendarEvent.query.filter(
        db.or_(
            CalendarEvent.job_id.in_(job_ids),
            db.and_(CalendarEvent.creator_id == user.id, CalendarEvent.job_id == None)
        )
    )

    if month:
        q = q.filter(CalendarEvent.event_date.like(f'{month}%'))

    events = q.order_by(CalendarEvent.event_date.asc(), CalendarEvent.event_time.asc()).all()

    return jsonify({'events': [{
        'id': e.id,
        'job_id': e.job_id,
        'job_title': e.job.title if e.job else None,
        'creator_id': e.creator_id,
        'creator_username': e.creator.username,
        'title': e.title,
        'event_date': e.event_date,
        'event_time': e.event_time,
        'event_type': e.event_type,
        'note': e.note,
        'created_at': e.created_at.isoformat()
    } for e in events]}), 200


@app.route('/api/calendar/events', methods=['POST'])
def create_calendar_event():
    """
    Create a calendar event.
    Body: { job_id (optional), title, event_date, event_time, event_type, note }
    If job_id is provided, both client and freelancer on that job will see it.
    """
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    if not data.get('title', '').strip():      return jsonify({'error': 'Title required'}), 400
    if not data.get('event_date', '').strip(): return jsonify({'error': 'Date required'}), 400

    # If a job_id is given, verify user is a participant
    job_id = data.get('job_id')
    if job_id:
        job = Job.query.get(job_id)
        if not job: return jsonify({'error': 'Job not found'}), 404
        if job.client_id != user.id and job.assigned_freelancer_id != user.id:
            return jsonify({'error': 'Not a participant in this job'}), 403

    event = CalendarEvent(
        job_id=job_id,
        creator_id=user.id,
        title=data['title'].strip(),
        event_date=data['event_date'],
        event_time=data.get('event_time', '09:00'),
        event_type=data.get('event_type', 'meeting'),
        note=data.get('note', '')
    )
    db.session.add(event)
    db.session.commit()

    return jsonify({'message': 'Event created', 'event': {
        'id': event.id, 'title': event.title,
        'event_date': event.event_date, 'event_time': event.event_time,
        'event_type': event.event_type, 'job_id': event.job_id
    }}), 201


@app.route('/api/calendar/events/<int:event_id>', methods=['DELETE'])
def delete_calendar_event(event_id):
    """Delete a calendar event. Only the creator can delete it."""
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    event = CalendarEvent.query.get_or_404(event_id)
    if event.creator_id != user.id:
        return jsonify({'error': 'Only the creator can delete this event'}), 403

    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted'}), 200


@app.route('/api/calendar/job/<int:job_id>/events', methods=['GET'])
def get_job_events(job_id):
    """Get all calendar events for a specific job (visible to both parties)."""
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    job = Job.query.get_or_404(job_id)
    if job.client_id != user.id and job.assigned_freelancer_id != user.id:
        return jsonify({'error': 'Not authorized'}), 403

    events = CalendarEvent.query.filter_by(job_id=job_id)\
        .order_by(CalendarEvent.event_date.asc()).all()

    return jsonify({'events': [{
        'id': e.id, 'title': e.title,
        'event_date': e.event_date, 'event_time': e.event_time,
        'event_type': e.event_type, 'note': e.note,
        'creator_username': e.creator.username,
        'creator_id': e.creator_id
    } for e in events]}), 200



# REVIEW ROUTES


@app.route('/api/reviews', methods=['POST'])
def create_review():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    if not all(k in data for k in ['job_id', 'reviewee_id', 'rating', 'comment']):
        return jsonify({'error': 'Missing required fields'}), 400

    rating = data['rating']
    if rating not in [1, 2, 3, 4, 5]:
        return jsonify({'error': 'Rating must be 1–5'}), 400

    job = Job.query.get(data['job_id'])
    if not job: return jsonify({'error': 'Job not found'}), 404
    if job.status != 'completed': return jsonify({'error': 'Can only review completed jobs'}), 400

    if job.client_id != user.id and job.assigned_freelancer_id != user.id:
        return jsonify({'error': 'Not a participant'}), 403

    existing = Review.query.filter_by(job_id=data['job_id'], reviewer_id=user.id, reviewee_id=data['reviewee_id']).first()
    if existing: return jsonify({'error': 'Already reviewed'}), 400

    rev = Review(
        job_id=data['job_id'], reviewer_id=user.id,
        reviewee_id=data['reviewee_id'], rating=rating,
        comment=data['comment'].strip(),
        image_url=data.get('image_url', '').strip() or None
    )
    db.session.add(rev)
    db.session.commit()
    return jsonify({'message': 'Review created', 'review_id': rev.id}), 201


@app.route('/api/reviews/user/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404

    reviews = Review.query.filter_by(reviewee_id=user_id).order_by(Review.created_at.desc()).all()
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0

    return jsonify({
        'user': {'id': user.id, 'username': user.username, 'first_name': user.first_name, 'last_name': user.last_name, 'user_type': user.user_type},
        'average_rating': avg, 'total_reviews': len(reviews),
        'reviews': [{
            'id': r.id, 'rating': r.rating, 'comment': r.comment,
            'image_url': r.image_url, 'created_at': r.created_at.isoformat(),
            'job': {'id': r.job.id, 'title': r.job.title},
            'reviewer': {'id': r.reviewer.id, 'username': r.reviewer.username, 'first_name': r.reviewer.first_name, 'last_name': r.reviewer.last_name}
        } for r in reviews]
    }), 200


@app.route('/api/reviews/pending', methods=['GET'])
def get_pending_reviews():
    user = get_current_user()
    # BUG FIX: return empty list (not 401) so frontend doesn't hang on loading
    if not user: return jsonify({'pending_reviews': []}), 200

    if user.user_type == 'client':
        jobs = Job.query.filter_by(client_id=user.id, status='completed').all()
    else:
        jobs = Job.query.filter_by(assigned_freelancer_id=user.id, status='completed').all()

    pending = []
    for job in jobs:
        reviewee_id = job.assigned_freelancer_id if user.user_type == 'client' else job.client_id
        if not reviewee_id: continue
        existing = Review.query.filter_by(job_id=job.id, reviewer_id=user.id, reviewee_id=reviewee_id).first()
        if not existing:
            reviewee = User.query.get(reviewee_id)
            if reviewee:
                pending.append({
                    'job_id': job.id, 'job_title': job.title,
                    'reviewee': {'id': reviewee.id, 'username': reviewee.username, 'user_type': reviewee.user_type}
                })

    return jsonify({'pending_reviews': pending}), 200


@app.route('/api/reviews/job/<int:job_id>', methods=['GET'])
def get_job_reviews(job_id):
    job = Job.query.get(job_id)
    if not job: return jsonify({'error': 'Job not found'}), 404
    reviews = Review.query.filter_by(job_id=job_id).all()
    return jsonify({'reviews': [{
        'id': r.id, 'rating': r.rating, 'comment': r.comment,
        'created_at': r.created_at.isoformat(),
        'reviewer': {'id': r.reviewer.id, 'username': r.reviewer.username, 'user_type': r.reviewer.user_type},
        'reviewee': {'id': r.reviewee.id, 'username': r.reviewee.username, 'user_type': r.reviewee.user_type}
    } for r in reviews]}), 200



# SUPPORT ROUTES


@app.route('/api/support', methods=['POST'])
def submit_ticket():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    if user.user_type == 'admin': return jsonify({'error': 'Admins cannot submit tickets'}), 403

    data = request.json
    if not data.get('subject', '').strip(): return jsonify({'error': 'Subject required'}), 400
    if not data.get('message', '').strip(): return jsonify({'error': 'Message required'}), 400

    t = SupportTicket(user_id=user.id, subject=data['subject'].strip(), message=data['message'].strip())
    db.session.add(t)
    db.session.commit()
    return jsonify({'message': 'Ticket submitted', 'id': t.id}), 201


@app.route('/api/support', methods=['GET'])
def get_my_tickets():
    user = get_current_user()
    if not user: return jsonify({'error': 'Not authenticated'}), 401
    tickets = SupportTicket.query.filter_by(user_id=user.id).order_by(SupportTicket.created_at.desc()).all()
    return jsonify({'tickets': [{
        'id': t.id, 'subject': t.subject, 'message': t.message,
        'status': t.status, 'admin_reply': t.admin_reply,
        'replied_at': t.replied_at.isoformat() if t.replied_at else None,
        'created_at': t.created_at.isoformat()
    } for t in tickets]}), 200


@app.route('/api/admin/tickets', methods=['GET'])
def admin_get_tickets():
    user = get_current_user()
    if not user or user.user_type != 'admin': return jsonify({'error': 'Admin only'}), 403
    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    return jsonify({'tickets': [{
        'id': t.id, 'subject': t.subject, 'message': t.message,
        'status': t.status, 'admin_reply': t.admin_reply,
        'replied_at': t.replied_at.isoformat() if t.replied_at else None,
        'created_at': t.created_at.isoformat(),
        'user': {'id': t.user.id, 'username': t.user.username, 'email': t.user.email, 'user_type': t.user.user_type}
    } for t in tickets]}), 200


@app.route('/api/admin/tickets/<int:tid>/reply', methods=['POST'])
def admin_reply(tid):
    user = get_current_user()
    if not user or user.user_type != 'admin': return jsonify({'error': 'Admin only'}), 403
    t = SupportTicket.query.get_or_404(tid)
    reply = request.json.get('reply', '').strip()
    if not reply: return jsonify({'error': 'Reply cannot be empty'}), 400
    t.admin_reply = reply
    t.replied_at  = datetime.utcnow()
    t.status      = 'resolved'
    db.session.commit()
    return jsonify({'message': 'Replied and resolved'}), 200


@app.route('/api/admin/register', methods=['POST'])
def admin_register():
    data = request.json
    if data.get('admin_secret') != app.config.get('ADMIN_SECRET'):
        return jsonify({'error': 'Invalid admin secret'}), 403
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        email=data['email'], username=data['username'], user_type='admin',
        first_name=data.get('first_name', 'Admin'), last_name=data.get('last_name', '')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Admin created',
        'token': create_token(user.id),
        'user': {'id': user.id, 'username': user.username, 'email': user.email, 'user_type': user.user_type}
    }), 201



# SERVE REACT


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file('index.html')



# DB INIT & SEED


def init_db():
    with app.app_context():
        db.create_all()
        if Category.query.count() == 0:
            for cat in [
                Category(name='Plumbing',    icon='🔧'),
                Category(name='Electrical',  icon='⚡'),
                Category(name='Carpentry',   icon='🔨'),
                Category(name='Painting',    icon='🎨'),
                Category(name='HVAC',        icon='❄️'),
                Category(name='Landscaping', icon='🏡'),
                Category(name='Cleaning',    icon='🧹'),
                Category(name='Moving',      icon='📦'),
            ]:
                db.session.add(cat)
            db.session.commit()
            print('✅ Categories seeded')
        print('✅ Database ready')



# RUN


if __name__ == '__main__':
    init_db()
    print('=' * 55)
    print('🚀  LANCELY API  —  http://localhost:5001')
    print('=' * 55)
    app.run(debug=True, host='0.0.0.0', port=5001)
