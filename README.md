# Moving Garage 🔧

> On-demand, real-time 2-wheeler breakdown assistance platform.

## Overview

Moving Garage connects stranded 2-wheeler commuters with local mechanics using an Uber-like model. Features transparent pricing (fixed issue cost + ₹15/km travel fee), real-time tracking, and a dynamic quote adjustment flow.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS 3 |
| Backend | Django 5 + Django REST Framework |
| Real-time | Django Channels (WebSocket) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Payment | Razorpay API |
| Maps | Google Maps API |

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations accounts services payments
python manage.py migrate
python manage.py seed_issues
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Pricing

| Issue | Fixed Cost |
|-------|-----------|
| Flat Tire / Puncture Repair | ₹150 |
| Dead Battery / Jump Start | ₹200 |
| Broken Clutch / Brake Cable | ₹250 |
| Spark Plug Issue | ₹120 |
| Engine Overheating / Oil Issue | ₹300 |
| Towing to Garage | ₹500 |
| Unknown Issue (Diagnostic) | ₹100 |

**Formula:** Total = Issue Cost + (Distance in KM × ₹15)

## API Endpoints

- `POST /api/v1/auth/register/` — Register
- `POST /api/v1/auth/login/` — Login (JWT)
- `GET /api/v1/issues/` — List issues & pricing
- `POST /api/v1/requests/` — Create service request
- `PATCH /api/v1/requests/{id}/accept/` — Mechanic accepts
- `PATCH /api/v1/requests/{id}/diagnose/` — Override diagnosis
- `POST /api/v1/requests/{id}/approve-quote/` — User approves
- `POST /api/v1/requests/{id}/complete/` — Mark completed
- WebSocket: `ws/requests/` and `ws/request/{id}/`
