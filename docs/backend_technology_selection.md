# Backend Technology Selection

**Date:** February 16, 2026  
**Author:** Peng Lin  
**Decision:** Python + Flask

## Executive Summary

After evaluating multiple backend frameworks, the team has selected **Python with Flask** as the backend technology for this project.

## Options Considered

### 1. Python + Flask (SELECTED)
**Pros:**
- Team has strong Python experience from coursework
- Flask is lightweight and easy to learn quickly
- Minimal boilerplate - faster development
- Excellent RESTful API support
- Great authentication libraries (Flask-Login, Flask-JWT-Extended)
- Easy integration with SQLAlchemy for database ORM
- Strong community support and documentation
- Simple deployment options (Heroku, PythonAnywhere, AWS)

**Cons:**
- Less built-in features than Django (need to add libraries)
- Manual configuration required for some features
- Smaller than Django ecosystem

### 2. Python + Django
**Pros:**
- Full-featured framework with built-in admin panel
- Excellent ORM and authentication out of the box
- Great for complex applications

**Cons:**
- Heavier framework with more overhead
- Steeper learning curve
- More opinionated structure
- Overkill for our project scope

### 3. Node.js + Express
**Pros:**
- JavaScript throughout stack (same language as React Native frontend)
- Excellent async I/O performance
- Large npm ecosystem

**Cons:**
- Team less experienced with JavaScript backend
- Would require learning new patterns
- Callback/promise complexity

## Decision Rationale

**Primary Factors:**
1. **Team Familiarity:** All team members have Python experience from CIS courses
2. **Development Speed:** Flask's simplicity allows rapid prototyping
3. **Project Scope:** Our application needs RESTful APIs and authentication - Flask handles this perfectly without Django's overhead
4. **Learning Curve:** Minimal time investment needed to get productive
5. **Time Constraints:** 11-sprint timeline requires quick ramp-up

**Technical Fit:**
- Our React Native frontend needs JSON REST APIs → Flask-RESTful is ideal
- User authentication required → Flask-Login + Flask-JWT-Extended are mature
- Database operations → SQLAlchemy provides excellent ORM
- Deployment → Simple deployment to Heroku or PythonAnywhere

## Implementation Plan

### Core Dependencies
```python
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-Login==0.6.3
Flask-JWT-Extended==4.6.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
```

### Recommended Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── user.py
│   └── utils/
├── config.py
├── requirements.txt
└── run.py
```

### Initial Setup Steps
1. Set up virtual environment
2. Install Flask and dependencies
3. Configure database connection (SQLite for dev, PostgreSQL for prod)
4. Implement authentication endpoints
5. Set up CORS for React Native frontend
6. Create initial API documentation

## Risk Mitigation

**Potential Risk:** Flask requires manual integration of components  
**Mitigation:** Use well-established libraries (Flask-Login, SQLAlchemy) with strong documentation

**Potential Risk:** Team members unfamiliar with Flask specifically  
**Mitigation:** Flask's simplicity and Python familiarity make learning curve minimal (~1-2 days)

## Alternative Considered for Future

If project grows significantly in complexity, Django could be considered for a future rewrite. However, Flask's flexibility should serve us well for the current scope.

## References

- Flask Documentation: https://flask.palletsprojects.com/
- Flask-JWT-Extended: https://flask-jwt-extended.readthedocs.io/
- SQLAlchemy: https://www.sqlalchemy.org/

## Team Approval

This decision was discussed with the team and approved by all members.

---

**Next Steps:**
- Set up Flask project structure (Sprint 2)
- Implement authentication API (Sprint 2-3)
- Create database models (Sprint 2-3)