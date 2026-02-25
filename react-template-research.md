# React Frontend Template Research

**Story:** TM19-45  
**Sprint:** Sprint 3  
**Assignee:** Peng Lin  

---

## Overview

This document evaluates existing React frontend templates to determine the most suitable foundation for the Lancely application. Templates were assessed based on component structure, styling approach, routing support, and compatibility with our Flask backend.

---

## Templates Evaluated

### 1. Create React App (CRA)
- **Component Structure:** Flat, minimal boilerplate
- **Styling:** CSS modules or plain CSS by default
- **Routing:** Requires manual React Router setup
- **Flask Compatibility:** High — standard fetch/axios calls work out of the box
- **Pros:** Simple, well-documented, widely used
- **Cons:** No built-in folder structure, slower build times

### 2. Vite + React
- **Component Structure:** Minimal, flexible
- **Styling:** CSS modules, supports Tailwind easily
- **Routing:** Requires manual React Router setup
- **Flask Compatibility:** High — fast dev server with proxy support for Flask API
- **Pros:** Extremely fast HMR, modern tooling, lightweight
- **Cons:** Slightly less documentation than CRA

### 3. React + Tailwind Starter Template
- **Component Structure:** Component-based with utility-first styling
- **Styling:** Tailwind CSS built-in
- **Routing:** React Router pre-configured
- **Flask Compatibility:** High — API calls via axios, proxy easily configured
- **Pros:** Pre-styled components, consistent UI patterns, saves setup time
- **Cons:** Requires familiarity with Tailwind utility classes

---

## Comparison Summary

| Criteria | CRA | Vite + React | React + Tailwind |
|---|---|---|---|
| Build Speed | Slow | Fast | Fast |
| Routing Support | Manual | Manual | Pre-configured |
| Styling Approach | Plain CSS | Flexible | Tailwind CSS |
| Flask Compatibility | High | High | High |
| Boilerplate Reduction | Low | Medium | High |
| Team Familiarity | High | Medium | Medium |

---

## Recommendation

**Selected Template: Vite + React with Tailwind CSS**

Vite provides significantly faster build and hot-reload times compared to CRA, which improves developer experience during active development. Adding Tailwind CSS gives the team consistent utility-first styling without the overhead of a heavy component library. React Router will be manually configured to match our application's routing needs. The Flask backend integrates seamlessly via Vite's proxy configuration for API calls.

---

## Next Steps

- Set up base project using Vite + React
- Configure Tailwind CSS
- Set up React Router with initial routes (Login, Dashboard, Postings)
- Confirm Flask API proxy configuration works in development environment
- Brief team on folder structure and component conventions during next SCRUM

---

*Document prepared by Peng Lin — Sprint 3, Team 19 (Lancely)*
