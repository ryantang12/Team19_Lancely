"""
Unit Tests for Lancely — app.py
Run: pytest test_app.py -v
"""

import pytest
import json
from app import app, db, User, Job, Proposal, Review, Message, CalendarEvent, SupportTicket, Category


# ─── FIXTURES ────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Set up a test Flask client with an in-memory SQLite database."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Seed a category
            cat = Category(name='Plumbing', icon='🔧')
            db.session.add(cat)
            db.session.commit()
        yield client
        with app.app_context():
            db.drop_all()


def register_user(client, email, username, user_type, password='password123'):
    """Helper: register a user and return the response."""
    return client.post('/api/register', json={
        'email': email,
        'username': username,
        'password': password,
        'user_type': user_type,
        'first_name': 'Test',
        'last_name': 'User'
    })


def login_user(client, email, password='password123'):
    """Helper: log in and return the JWT token."""
    res = client.post('/api/login', json={'email': email, 'password': password})
    return res.get_json()['token']


def auth_headers(token):
    """Helper: build Authorization header dict."""
    return {'Authorization': f'Bearer {token}'}


# ─── USER MODEL TESTS ────────────────────────────────────────────────────────

class TestUserModel:
    """Tests for the User model class."""

    def test_set_and_check_password(self):
        """User.set_password hashes the password; check_password validates it."""
        with app.app_context():
            user = User(email='a@a.com', username='alice', user_type='client')
            user.set_password('secret123')
            assert user.check_password('secret123') is True
            assert user.check_password('wrongpass') is False

    def test_password_is_hashed(self):
        """Password hash should not equal the raw password."""
        with app.app_context():
            user = User(email='b@b.com', username='bob', user_type='client')
            user.set_password('mypassword')
            assert user.password_hash != 'mypassword'


# ─── AUTH ROUTE TESTS ────────────────────────────────────────────────────────

class TestAuthRoutes:
    """Tests for /api/register, /api/login, /api/me."""

    def test_register_success(self, client):
        """A new user can register successfully."""
        res = register_user(client, 'client@test.com', 'clientuser', 'client')
        assert res.status_code == 201
        data = res.get_json()
        assert 'token' in data
        assert data['user']['username'] == 'clientuser'

    def test_register_duplicate_email(self, client):
        """Registering with a duplicate email returns 400."""
        register_user(client, 'dup@test.com', 'user1', 'client')
        res = register_user(client, 'dup@test.com', 'user2', 'client')
        assert res.status_code == 400
        assert 'Email already registered' in res.get_json()['error']

    def test_register_duplicate_username(self, client):
        """Registering with a duplicate username returns 400."""
        register_user(client, 'a@test.com', 'sameuser', 'client')
        res = register_user(client, 'b@test.com', 'sameuser', 'client')
        assert res.status_code == 400
        assert 'Username already taken' in res.get_json()['error']

    def test_login_success(self, client):
        """A registered user can log in and receive a token."""
        register_user(client, 'login@test.com', 'loginuser', 'client')
        res = client.post('/api/login', json={'email': 'login@test.com', 'password': 'password123'})
        assert res.status_code == 200
        assert 'token' in res.get_json()

    def test_login_wrong_password(self, client):
        """Login with wrong password returns 401."""
        register_user(client, 'wrong@test.com', 'wronguser', 'client')
        res = client.post('/api/login', json={'email': 'wrong@test.com', 'password': 'badpass'})
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Login with unknown email returns 401."""
        res = client.post('/api/login', json={'email': 'ghost@test.com', 'password': 'pass'})
        assert res.status_code == 401

    def test_get_me_authenticated(self, client):
        """GET /api/me returns the current user when authenticated."""
        register_user(client, 'me@test.com', 'meuser', 'freelancer')
        token = login_user(client, 'me@test.com')
        res = client.get('/api/me', headers=auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()['user']['username'] == 'meuser'

    def test_get_me_unauthenticated(self, client):
        """GET /api/me without token returns 401."""
        res = client.get('/api/me')
        assert res.status_code == 401


# ─── JOB ROUTE TESTS ─────────────────────────────────────────────────────────

class TestJobRoutes:
    """Tests for /api/jobs (create, list, detail)."""

    def test_client_can_create_job(self, client):
        """A client user can post a new job."""
        register_user(client, 'client@job.com', 'jobclient', 'client')
        token = login_user(client, 'client@job.com')
        res = client.post('/api/jobs', json={
            'title': 'Fix my pipes',
            'description': 'Need a plumber ASAP',
            'budget_amount': 150.0,
            'budget_type': 'fixed',
            'category_id': 1
        }, headers=auth_headers(token))
        assert res.status_code == 201
        assert res.get_json()['job']['title'] == 'Fix my pipes'

    def test_freelancer_cannot_create_job(self, client):
        """A freelancer cannot post a job — returns 403."""
        register_user(client, 'free@job.com', 'freejob', 'freelancer')
        token = login_user(client, 'free@job.com')
        res = client.post('/api/jobs', json={
            'title': 'Should fail',
            'description': 'Freelancer posting job',
            'budget_amount': 100.0
        }, headers=auth_headers(token))
        assert res.status_code == 403

    def test_get_jobs_returns_list(self, client):
        """GET /api/jobs returns a list of open jobs."""
        register_user(client, 'lister@job.com', 'listerjob', 'client')
        token = login_user(client, 'lister@job.com')
        client.post('/api/jobs', json={
            'title': 'Paint walls',
            'description': 'Need painting done',
            'budget_amount': 200.0
        }, headers=auth_headers(token))
        res = client.get('/api/jobs')
        assert res.status_code == 200
        assert len(res.get_json()['jobs']) >= 1

    def test_get_job_increments_view_count(self, client):
        """Fetching a job detail increments its views_count."""
        register_user(client, 'view@job.com', 'viewjob', 'client')
        token = login_user(client, 'view@job.com')
        create_res = client.post('/api/jobs', json={
            'title': 'View test job',
            'description': 'Testing views',
            'budget_amount': 50.0
        }, headers=auth_headers(token))
        job_id = create_res.get_json()['job']['id']

        client.get(f'/api/jobs/{job_id}')
        res = client.get(f'/api/jobs/{job_id}')
        assert res.get_json()['job']['views_count'] == 2


# ─── PROPOSAL ROUTE TESTS ────────────────────────────────────────────────────

class TestProposalRoutes:
    """Tests for /api/proposals."""

    def test_freelancer_can_submit_proposal(self, client):
        """A freelancer can submit a proposal on an open job."""
        register_user(client, 'c@prop.com', 'propclient', 'client')
        register_user(client, 'f@prop.com', 'propfree', 'freelancer')
        c_token = login_user(client, 'c@prop.com')
        f_token = login_user(client, 'f@prop.com')

        job_res = client.post('/api/jobs', json={
            'title': 'Proposal job',
            'description': 'Need work',
            'budget_amount': 300.0
        }, headers=auth_headers(c_token))
        job_id = job_res.get_json()['job']['id']

        res = client.post('/api/proposals', json={
            'job_id': job_id,
            'cover_letter': 'I can do this job well.',
            'proposed_amount': 280.0
        }, headers=auth_headers(f_token))
        assert res.status_code == 201

    def test_client_cannot_submit_proposal(self, client):
        """A client cannot submit a proposal — returns 403."""
        register_user(client, 'cc@prop.com', 'clientprop', 'client')
        token = login_user(client, 'cc@prop.com')
        res = client.post('/api/proposals', json={
            'job_id': 1,
            'cover_letter': 'Should fail',
            'proposed_amount': 100.0
        }, headers=auth_headers(token))
        assert res.status_code == 403


# ─── JOB COMPLETION TESTS ────────────────────────────────────────────────────

class TestJobCompletion:
    """Tests for the two-step job completion flow."""

    def setup_assigned_job(self, client):
        """Helper: create a job, submit and accept a proposal."""
        register_user(client, 'cc@comp.com', 'compclient', 'client')
        register_user(client, 'ff@comp.com', 'compfree', 'freelancer')
        c_token = login_user(client, 'cc@comp.com')
        f_token = login_user(client, 'ff@comp.com')

        job_res = client.post('/api/jobs', json={
            'title': 'Completion job',
            'description': 'To be completed',
            'budget_amount': 400.0
        }, headers=auth_headers(c_token))
        job_id = job_res.get_json()['job']['id']

        prop_res = client.post('/api/proposals', json={
            'job_id': job_id,
            'cover_letter': 'I will finish it.',
            'proposed_amount': 380.0
        }, headers=auth_headers(f_token))
        prop_id = prop_res.get_json()['proposal']['id']

        client.post(f'/api/proposals/{prop_id}/accept', headers=auth_headers(c_token))
        return job_id, c_token, f_token

    def test_client_can_request_completion(self, client):
        """Client can move job to pending_completion."""
        job_id, c_token, _ = self.setup_assigned_job(client)
        res = client.post(f'/api/jobs/{job_id}/request-completion', headers=auth_headers(c_token))
        assert res.status_code == 200

    def test_freelancer_can_confirm_completion(self, client):
        """Freelancer can confirm completion after client requests it."""
        job_id, c_token, f_token = self.setup_assigned_job(client)
        client.post(f'/api/jobs/{job_id}/request-completion', headers=auth_headers(c_token))
        res = client.post(f'/api/jobs/{job_id}/confirm-completion', headers=auth_headers(f_token))
        assert res.status_code == 200

    def test_cannot_confirm_without_request(self, client):
        """Freelancer cannot confirm completion if client hasn't requested it."""
        job_id, _, f_token = self.setup_assigned_job(client)
        res = client.post(f'/api/jobs/{job_id}/confirm-completion', headers=auth_headers(f_token))
        assert res.status_code == 400


# ─── MESSAGE ROUTE TESTS ─────────────────────────────────────────────────────

class TestMessageRoutes:
    """Tests for /api/messages."""

    def test_send_and_retrieve_message(self, client):
        """Client and freelancer can exchange messages on a job."""
        register_user(client, 'mc@msg.com', 'msgclient', 'client')
        register_user(client, 'mf@msg.com', 'msgfree', 'freelancer')
        c_token = login_user(client, 'mc@msg.com')
        f_token = login_user(client, 'mf@msg.com')

        # Get user IDs
        c_id = client.get('/api/me', headers=auth_headers(c_token)).get_json()['user']['id']
        f_id = client.get('/api/me', headers=auth_headers(f_token)).get_json()['user']['id']

        job_res = client.post('/api/jobs', json={
            'title': 'Message job',
            'description': 'For messaging',
            'budget_amount': 100.0
        }, headers=auth_headers(c_token))
        job_id = job_res.get_json()['job']['id']

        # Accept a proposal to assign freelancer
        prop_res = client.post('/api/proposals', json={
            'job_id': job_id,
            'cover_letter': 'Ready.',
            'proposed_amount': 90.0
        }, headers=auth_headers(f_token))
        prop_id = prop_res.get_json()['proposal']['id']
        client.post(f'/api/proposals/{prop_id}/accept', headers=auth_headers(c_token))

        # Send message
        send_res = client.post('/api/messages', json={
            'job_id': job_id,
            'receiver_id': f_id,
            'content': 'Hello freelancer!'
        }, headers=auth_headers(c_token))
        assert send_res.status_code == 201

        # Retrieve messages
        get_res = client.get(f'/api/messages/{job_id}', headers=auth_headers(c_token))
        assert get_res.status_code == 200
        messages = get_res.get_json()['messages']
        assert any(m['content'] == 'Hello freelancer!' for m in messages)

    def test_empty_message_rejected(self, client):
        """Sending an empty message returns 400."""
        register_user(client, 'ec@msg.com', 'emptyclient', 'client')
        register_user(client, 'ef@msg.com', 'emptyfree', 'freelancer')
        c_token = login_user(client, 'ec@msg.com')
        f_token = login_user(client, 'ef@msg.com')
        f_id = client.get('/api/me', headers=auth_headers(f_token)).get_json()['user']['id']

        job_res = client.post('/api/jobs', json={
            'title': 'Empty msg job',
            'description': 'Testing',
            'budget_amount': 50.0
        }, headers=auth_headers(c_token))
        job_id = job_res.get_json()['job']['id']

        res = client.post('/api/messages', json={
            'job_id': job_id,
            'receiver_id': f_id,
            'content': '   '
        }, headers=auth_headers(c_token))
        assert res.status_code == 400


# ─── REVIEW ROUTE TESTS ──────────────────────────────────────────────────────

class TestReviewRoutes:
    """Tests for /api/reviews."""

    def test_cannot_review_incomplete_job(self, client):
        """Cannot leave a review on a job that is not completed."""
        register_user(client, 'rc@rev.com', 'revclient', 'client')
        register_user(client, 'rf@rev.com', 'revfree', 'freelancer')
        c_token = login_user(client, 'rc@rev.com')
        f_token = login_user(client, 'rf@rev.com')
        f_id = client.get('/api/me', headers=auth_headers(f_token)).get_json()['user']['id']

        job_res = client.post('/api/jobs', json={
            'title': 'Review job',
            'description': 'Not yet complete',
            'budget_amount': 200.0
        }, headers=auth_headers(c_token))
        job_id = job_res.get_json()['job']['id']

        res = client.post('/api/reviews', json={
            'job_id': job_id,
            'reviewee_id': f_id,
            'rating': 5,
            'comment': 'Great work!'
        }, headers=auth_headers(c_token))
        assert res.status_code == 400

    def test_invalid_rating_rejected(self, client):
        """Rating outside 1–5 is rejected with 400."""
        register_user(client, 'ir@rev.com', 'invalidrev', 'client')
        token = login_user(client, 'ir@rev.com')
        res = client.post('/api/reviews', json={
            'job_id': 1,
            'reviewee_id': 2,
            'rating': 10,
            'comment': 'Too high'
        }, headers=auth_headers(token))
        assert res.status_code == 400


# ─── SUPPORT TICKET TESTS ────────────────────────────────────────────────────

class TestSupportRoutes:
    """Tests for /api/support."""

    def test_user_can_submit_ticket(self, client):
        """A regular user can submit a support ticket."""
        register_user(client, 'st@sup.com', 'supuser', 'client')
        token = login_user(client, 'st@sup.com')
        res = client.post('/api/support', json={
            'subject': 'Payment issue',
            'message': 'I was charged twice.'
        }, headers=auth_headers(token))
        assert res.status_code == 201

    def test_empty_subject_rejected(self, client):
        """Support ticket with empty subject returns 400."""
        register_user(client, 'es@sup.com', 'empsup', 'client')
        token = login_user(client, 'es@sup.com')
        res = client.post('/api/support', json={
            'subject': '',
            'message': 'Some message'
        }, headers=auth_headers(token))
        assert res.status_code == 400

    def test_user_can_view_own_tickets(self, client):
        """User can retrieve their own submitted tickets."""
        register_user(client, 'vt@sup.com', 'viewticket', 'client')
        token = login_user(client, 'vt@sup.com')
        client.post('/api/support', json={
            'subject': 'Help needed',
            'message': 'Details here.'
        }, headers=auth_headers(token))
        res = client.get('/api/support', headers=auth_headers(token))
        assert res.status_code == 200
        assert len(res.get_json()['tickets']) == 1


# ─── CALENDAR EVENT TESTS ────────────────────────────────────────────────────

class TestCalendarRoutes:
    """Tests for /api/calendar/events."""

    def test_create_and_retrieve_event(self, client):
        """User can create a calendar event and retrieve it."""
        register_user(client, 'cal@cal.com', 'caluser', 'client')
        token = login_user(client, 'cal@cal.com')

        res = client.post('/api/calendar/events', json={
            'title': 'Team Meeting',
            'event_date': '2025-06-15',
            'event_time': '10:00',
            'event_type': 'meeting'
        }, headers=auth_headers(token))
        assert res.status_code == 201

        get_res = client.get('/api/calendar/events', headers=auth_headers(token))
        assert get_res.status_code == 200
        events = get_res.get_json()['events']
        assert any(e['title'] == 'Team Meeting' for e in events)

    def test_missing_title_rejected(self, client):
        """Creating an event without a title returns 400."""
        register_user(client, 'nt@cal.com', 'notitlecal', 'client')
        token = login_user(client, 'nt@cal.com')
        res = client.post('/api/calendar/events', json={
            'title': '',
            'event_date': '2025-06-15'
        }, headers=auth_headers(token))
        assert res.status_code == 400
