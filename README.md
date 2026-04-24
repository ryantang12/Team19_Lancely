# Lancely — Setup & Run Guide

## Folder Structure
```
lancely/
├── app.py              ← Flask backend
├── requirements.txt    ← Python packages
├── package.json        ← React config
├── src/
│   ├── App.jsx         ← React frontend
│   ├── App.css         ← Styles
│   ├── index.js        ← React entry point
│   └── public/
│       └── index.html  ← HTML shell
```

---

## One-Time Setup

### 1. Install Node.js (if not installed)
Download from: https://nodejs.org  (pick the LTS version)

### 2. Open the lancely folder in VS Code
File → Open Folder → select the `lancely` folder

### 3. Open a terminal in VS Code
Terminal → New Terminal  (or press Ctrl+`)

### 4. Set up Python backend
```bash
# Mac / Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Install React packages
```bash
npm install
```

---

## Run the App (Every Time)

You need TWO terminals open side by side.

### Terminal 1 — Flask backend
```bash
# Mac/Linux
source venv/bin/activate
python app.py

# Windows
venv\Scripts\activate
python app.py
```
Flask runs at: http://localhost:5001

### Terminal 2 — React frontend
```bash
npm start
```
React opens automatically at: http://localhost:3000

---

## How to Open Two Terminals in VS Code
1. Open Terminal → New Terminal
2. Click the split icon (⧉) in the top-right of the terminal panel
3. Run Flask in the left pane, React in the right pane

---

## Test Accounts to Create
1. Sign up as a **Client** — post jobs
2. Sign up as a **Contractor** — submit proposals
3. Accept a proposal → chat and calendar unlock

Admin secret key: `lancely-admin-2024`
