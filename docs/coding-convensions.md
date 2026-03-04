# Lancely Coding Conventions

**Team 19 | Sprint 4**

---

## General Rules

- Names should clearly describe what the variable represents
- Avoid vague names like `temp`, `data`, `x`, or `flag`
- Favor longer, readable names over short cryptic ones
- Be consistent — if you abbreviate something, abbreviate it the same way everywhere

---

## React (Frontend)

- **Components:** PascalCase → `MainDashboard`, `JobCard`
- **Variables/State:** camelCase → `jobTitle`, `isLoading`
- **Booleans:** start with `is` or `has` → `isActive`, `hasError`
- **Constants:** ALL_CAPS → `MAX_RESULTS`
- **Files:** match the component name → `MainDashboard.js`

```javascript
// Good
const [isLoading, setIsLoading] = useState(false);
const [jobListings, setJobListings] = useState([]);

// Bad
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
```

---

## Python/Flask (Backend)

- **Variables/Functions:** snake_case → `job_id`, `get_all_jobs()`
- **Constants:** ALL_CAPS → `MAX_UPLOAD_SIZE`
- **Routes:** lowercase with hyphens → `/api/job-postings`

```python
# Good
def get_job_by_id(job_id):
    is_found = False

# Bad
def getData(x):
    flag = False
```

---

## Git

- **Branches:** `feature/job-posting-form`, `fix/login-redirect`
- **Commits:** start with story ID → `TM19-36: Add stats grid to dashboard`
- **PRs:** at least one teammate reviews before merging

---

## Things to Avoid

- Names that differ by only one letter: `clientRecs` vs `clientReps`
- Numbered variables: `job1`, `job2` — use arrays instead
- Names that only make sense to the person who wrote them

---

*Team 19 — Lancely*
