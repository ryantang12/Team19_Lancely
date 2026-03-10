# Chat Feature Research

## Overview
Research conducted to determine the best approach for implementing a secure contractor-customer messaging system within Lancely.

## Options Considered

### 1. WebSockets (Socket.IO)
- **Pros:** Real-time, low latency, great UX
- **Cons:** More complex setup, requires persistent connection, overkill for MVP
- **Verdict:** Deferred to future sprint

### 2. Third-Party Services (Firebase, Pusher)
- **Pros:** Managed infrastructure, built-in real-time support
- **Cons:** External dependency, cost at scale, less control over data
- **Verdict:** Not chosen — we want messages stored in our own DB per acceptance criteria

### 3. REST API with SQLAlchemy (Chosen)
- **Pros:** Simple, fits existing Flask stack, full control over data persistence
- **Cons:** Not real-time (polling required on frontend)
- **Verdict:** Best fit for current sprint scope and team experience

## Decision
REST API using Flask + SQLAlchemy with a `Message` model. Messages are tied to a `job_id` so each job request has its own isolated chat thread. Chosen approach satisfies the acceptance criteria: secure scoped messaging and persistent message storage.

## Data Model
| Field | Type | Purpose |
|---|---|---|
| id | Integer | Primary key |
| job_id | Integer | Links chat to a job request |
| sender_id | Integer | User sending the message |
| receiver_id | Integer | User receiving the message |
| content | Text | Message body |
| timestamp | DateTime | When message was sent |

## API Endpoints
| Method | Route | Purpose |
|---|---|---|
| POST | /chat/send | Send a new message |
| GET | /chat/<job_id> | Fetch message history for a job |
