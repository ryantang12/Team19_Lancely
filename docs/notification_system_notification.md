# Lancely Notification System — Research Document

## 1. Overview

This document researches and proposes a notification system for Lancely. The goal is to alert users in real time (or near real time) when key platform events occur, improving engagement and reducing missed actions.

---

## 2. Notification Trigger Events

| Event | Who Gets Notified |
|---|---|
| New proposal submitted on a job | Client |
| Proposal accepted | Freelancer |
| New message received | Recipient |
| Job status changed to `pending_completion` | Freelancer |
| Job status changed to `completed` | Client |
| New review received | Reviewee |

---

## 3. Implementation Approaches

### Approach A: In-App Notifications (Polling)

**How it works:**
- A `Notification` table stores notifications in the database
- Frontend polls `GET /api/notifications` every 5 seconds (same pattern as unread messages)
- A bell icon in the navbar shows unread count
- Clicking the bell opens a dropdown list of notifications

**Pros:**
- Simple to implement — no new dependencies
- Consistent with existing unread message polling pattern in Lancely
- Works without WebSocket setup

**Cons:**
- Not truly real-time (5 second delay)
- Polling adds minor server load

---

### Approach B: Email Notifications (Flask-Mail / SendGrid)

**How it works:**
- When a trigger event occurs, the backend sends an email to the affected user
- Uses Flask-Mail (SMTP) or SendGrid API for email delivery

**Flask-Mail setup:**
```python
from flask_mail import Mail, Message

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

mail = Mail(app)
```

**SendGrid setup:**
```python
import sendgrid
from sendgrid.helpers.mail import Mail

sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
```

**Pros:**
- Notifies users even when they are offline
- Professional and expected by users

**Cons:**
- Requires email service credentials (SMTP or API key)
- More complex setup
- Risk of emails going to spam

---

### Approach C: Combined (Recommended)

Use **in-app notifications** as the primary system (Approach A) and optionally layer email on top later. This matches Lancely's current architecture and is the fastest to implement.

---

## 4. Proposed Database Model

```python
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50))  # 'proposal', 'message', 'job_status', 'review'
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
```

---

## 5. Proposed API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get all notifications for logged-in user |
| GET | `/api/notifications/unread` | Get unread count (for navbar badge) |
| POST | `/api/notifications/read` | Mark all notifications as read |
| POST | `/api/notifications/read/<id>` | Mark single notification as read |

---

## 6. Frontend Design

### Navbar Bell Icon
- Add a 🔔 bell button next to the 💬 Messages button
- Poll `GET /api/notifications/unread` every 5 seconds
- Show red badge with count if unread > 0

### Notification Dropdown
- Clicking the bell opens a dropdown list
- Each item shows: message text + timestamp
- Unread items highlighted
- "Mark all as read" button at the top

```
┌─────────────────────────┐
│ 🔔 Notifications  [✓ all]│
├─────────────────────────┤
│ ● Your proposal was     │
│   accepted on "Fix sink"│
│   2 minutes ago         │
├─────────────────────────┤
│   New message from      │
│   @ryantang on "Fix..."  │
│   10 minutes ago        │
└─────────────────────────┘
```

---

## 7. Where to Trigger Notifications

In `app.py`, add a helper function:

```python
def create_notification(user_id, message, notif_type):
    n = Notification(user_id=user_id, message=message, type=notif_type)
    db.session.add(n)
    # do not commit here — let the caller commit
```

Then call it inside existing routes:

```python
# In accept_proposal():
create_notification(
    proposal.freelancer_id,
    f'Your proposal on "{proposal.job.title}" was accepted!',
    'proposal'
)

# In send_message():
create_notification(
    data['receiver_id'],
    f'New message from @{user.username}',
    'message'
)

# In confirm_job_completion():
create_notification(
    job.client_id,
    f'Job "{job.title}" has been marked as completed.',
    'job_status'
)
```

---

## 8. Implementation Checklist

- [ ] Add `Notification` model to `app.py`
- [ ] Add 4 API endpoints for notifications
- [ ] Call `create_notification()` in `accept_proposal`, `send_message`, `confirm_job_completion`
- [ ] Add bell icon to navbar in `App.jsx`
- [ ] Poll unread count every 5 seconds
- [ ] Build notification dropdown component
- [ ] Store doc in `/docs/lancely_notification_system_research.md`

---

## 9. References

- [Flask-Mail Docs](https://flask-mail.readthedocs.io/)
- [SendGrid Python SDK](https://github.com/sendgrid/sendgrid-python)
- [Lancely Messaging System](../backend/app.py) — existing polling pattern reference
