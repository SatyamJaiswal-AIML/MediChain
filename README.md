
# 🏥 MediChain — Unified Hospital Network Platform

> **A real-time hospital network platform** connecting patients and hospitals through live bed availability, appointment management, emergency patient transfers, and hospital operations.

<p align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-success?style=for-the-badge)

</p>

---

## ✨ Features

### 👤 Patient Portal

- ✅ MongoDB-backed patient registration & login
- ✅ Persistent patient profile
- ✅ **🤖 AI Disease Predictor** — Real-time Machine Learning diagnostic predictions based on 377 medical symptoms & 773 disease classes
- ✅ **💬 Multilingual Symptom Extraction** — Type symptoms in natural language (English, Hindi, Spanish, etc.) to auto-detect symptom tags
- ✅ Browse hospitals with live bed availability (ICU, Emergency, Oxygen, General)
- ✅ Book appointments with pre-filled AI diagnosis
- ✅ Track appointment status
- ✅ Submit hospital transfer requests
- ✅ Interactive navbar notifications

**Appointment Status**
- 🟡 Pending
- 🟢 Confirmed
- 🔵 Completed
- 🔴 Cancelled

---

### 🏥 Hospital Portal

Accessible via **`/hospital-login`**

- Secure hospital login
- Hospital-specific dashboard
- Manage ICU, General, Oxygen & Emergency beds
- Receive transfer requests
- Accept / Decline transfers
- Receive appointment requests
- Accept / Decline appointments
- Secure logout

---

## ⚡ Real-Time Updates & AI Engine

Powered by **Native WebSockets** & **Scikit-Learn ML**

| Feature | Description |
|-------|-------------|
| `bed_update` | Live bed availability updates |
| `transfer_request` | New transfer request |
| `transfer_response` | Accepted / Declined transfer |
| `disease-prediction` | Multi-class Naive Bayes & Symptom Frequency scoring |
| `extract-symptoms` | Multilingual free-text NLP symptom mapping |

---

# 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Backend | Python • FastAPI • Pydantic |
| Machine Learning | Scikit-Learn • Pandas • NumPy • Joblib |
| Database | MongoDB + PyMongo |
| Frontend | React • Vite • TypeScript • JavaScript |
| Real-time | Native WebSockets |
| Styling | Custom CSS |

---

# 📂 Project Structure

```text
MediChain/
├── backend/
│   ├── database/
│   ├── models/
│   ├── models_ml/           # Serialized ML model & symptom lookups
│   ├── routes/              # API routes (disease_prediction, transfers, etc.)
│   ├── realtime/
│   ├── scripts/             # Model training & DB seeding scripts
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/              # Assets & MediChain Logos
│   ├── src/
│   │   ├── components/
│   │   ├── pages/           # DiseasePredictor, HospitalDirectory, etc.
│   │   ├── services/        # diseaseApi, hospital, api.js
│   │   ├── context/
│   │   └── websocket/
│   └── package.json
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Python **3.10+**
- Node.js **18+**
- MongoDB Atlas or Local MongoDB

### 1️⃣ Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env
```

**backend/.env**

```env
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=hospital_network
```

Seed hospitals & train ML model (optional, pre-trained model included):

```bash
python -m scripts.seed_hospitals
python -m scripts.train_disease_model
```

Run backend:

```bash
uvicorn main:app --reload --port 8000
```

- API → http://localhost:8000
- Docs → http://localhost:8000/docs

---

### 2️⃣ Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

**frontend/.env**

```env
VITE_API_URL=http://localhost:8000
```

Frontend:

http://localhost:5173

---

# 🔐 Login

## 👤 Patient

`http://localhost:5173/login`

Create a patient account. All patient information is stored in MongoDB.

## 🏥 Hospital

`http://localhost:5173/hospital-login`

**Password**

```text
Hospital@123
```

Redirects to:

`http://localhost:5173/admin`

---

# 🗺 Important Routes

| Route | Description |
|------|-------------|
| `/login` | Patient Login |
| `/dashboard` | Patient Dashboard |
| `/disease-predictor` | **🤖 AI Disease Predictor & Symptom Analysis** |
| `/profile` | Patient Profile |
| `/book-appointment` | Book Appointment |
| `/appointment-status` | Appointment Status |
| `/hospitals` | Hospital Directory & Live Bed Availability |
| `/transfer` | Transfer Request |
| `/hospital-login` | Hospital Login |
| `/admin` | Hospital Dashboard |

---

# 🌱 Database Seeding

```bash
python -m scripts.seed_hospitals
```

Creates demo hospitals and hospital login accounts.

> ⚠️ Do not run this on an existing production database.

---

# 💾 Persistent Features

| Feature | Stored In |
|---------|-----------|
| Patient Accounts | MongoDB |
| Patient Profiles | MongoDB |
| Bed Availability | MongoDB |
| Appointments | MongoDB |
| Transfers | MongoDB |
| Hospital Sessions | MongoDB |
| ML Disease Model | Serialized Joblib (`backend/models_ml/`) |

---

# 📝 Notes

- Doctor rosters are currently demo/static.
- Dashboard health summaries are demo data.
- Never commit `.env` files.
- Store credentials using environment variables.

---

## ⭐ Future Improvements

- Email notifications
- Role-based access control
- Analytics dashboard
- Docker deployment
- Cloud deployment

---

<p align="center">
Made with ❤️ using FastAPI, React, MongoDB, Scikit-Learn and WebSockets.
</p>


---

# 🧑‍🤝‍🧑 Team & Contributors

Built by a **3-person team** using a **vertical ownership model**, where each member owned key features end-to-end (backend + ML + frontend).

| Contributor | Responsibilities |
|-------------|------------------|
| **Satyam Jaiswal** | 🤖 **AI Disease Prediction & Emergency System Owner** — Preprocessed dataset (246K rows, 773 disease classes, 377 symptoms), trained & optimized `MultinomialNB` model (85.75%–89.26% accuracy), built backend prediction & multilingual NLP extraction APIs (`/api/predict-disease`, `/api/extract-symptoms`), designed interactive frontend `DiseasePredictor` UI, implemented 🚑 Emergency Transfer System workflow & Hospital Login UI, added live bed counts in directory cards, interactive navbar notifications, and cleaned MediChain logo branding. |
| **Suraj Sharma** | 🛏️ **Bed System & Shared Backend Foundation** — Hospital data management, WebSocket connection manager, live bed controller, backend foundation. |
| **Sajal Vaish** | 💻 **Patient-facing frontend** — Login, Dashboard, Profile, Hospital Directory, Appointment Booking, Appointment Status, Hospital Location Tracking, and UI development. |


---

# 🩹 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Ensure the virtual environment is activated and run `pip install -r requirements.txt`. |
| `/hospitals` returns `[]` | Run `python -m scripts.seed_hospitals`. |
| CORS error | Verify the backend CORS middleware allows your frontend origin. |
| White screen on startup | Hard refresh (`Ctrl + Shift + R`). If it persists, open the browser console (`F12`) and check for import/runtime errors. |
| PowerShell blocks `npm` or virtual environment activation | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` or use Command Prompt. |

---

<p align="center">

⭐ **If you found this project interesting, consider giving it a star!** ⭐

Built with ❤️ using **FastAPI**, **React**, **MongoDB**, and **WebSockets**.

</p>
