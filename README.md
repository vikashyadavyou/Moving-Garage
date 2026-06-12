<div align="center">
  <h1>🛠️ Moving Garage</h1>
  <p><em>Real-time, on-demand breakdown assistance for 2-wheeler commuters.</em></p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
</div>

---

**Moving Garage** operates on an "Uber-like" model, instantly connecting stranded riders with nearby, verified local mechanics for on-site repairs or towing services.

## 🚀 Features

### 🛵 For Commuters (Users)
* **Real-Time Geolocation:** Auto-fetches current coordinates to pinpoint breakdown locations exactly.
* **Multi-Issue Selection:** Select primary issues (e.g., *Flat Tire, Dead Battery*) along with secondary needs like *"Pushing to Garage"*.
* **Live Tracking:** Track the assigned mechanic's ETA and live location on an interactive map.
* **Transparent Pricing:** Upfront cost calculation based on fixed service rates and per-km travel fees.
* **Flexible Payments:** Pay securely online via UPI/Cards or choose "Cash After Repair."
* **Dynamic Diagnosis Approval:** If the initial issue is unknown, review and approve the mechanic's on-site diagnosis before work begins.

### 🔧 For Mechanics
* **Live Job Broadcasting:** Receive real-time alerts for nearby breakdown requests.
* **Dashboard & Status Management:** Toggle availability and update job statuses in real-time (*En Route, Arrived, In Progress, Pending Payment*).
* **On-Site Diagnosis:** Evaluate "Unknown Issues" and submit the actual diagnostic report for user approval.
* **Cash Confirmation Handshake:** Securely verify and close out jobs when receiving physical cash payments.

---

## 💻 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, React Router, MapLibre GL JS |
| **Backend** | Python 3, Django, DRF, Django Channels, Redis |
| **Database** | PostgreSQL (Supabase with Supavisor), SQLite (Local Dev) |
| **Hosting** | Vercel (Frontend), Render (Backend) |
| **Integrations**| Geoapify API (Mapping & Routing), Razorpay API (Payments) |

---

## 🔄 System Workflow

1. **Request Initiation:** A commuter's 2-wheeler breaks down. They open the app, select their vehicle issue(s), and broadcast their live location.
2. **Mechanic Matching:** The backend calculates distances and pings available mechanics within the radius via WebSockets.
3. **Acceptance & Transit:** A mechanic accepts the job and navigates to the commuter's location using integrated routing.
4. **Diagnosis & Repair:** * *If the issue is known:* The mechanic begins repairs.
   * *If unknown:* The mechanic assesses the vehicle, updates the diagnosis via the app, and waits for the commuter's digital approval and price recalculation.
5. **Checkout & Payment:** Once marked "Pending Payment", the commuter is prompted to pay via Razorpay (auto-completes) or Cash (mechanic verifies receipt).

---

## 🌍 Production Deployment

Moving Garage uses a decoupled deployment architecture, communicating securely via configured CORS headers and CSRF trusted origins.

* **Frontend (Vercel):** Routing explicitly configured for Single Page Applications (SPA) to handle React Router paths.
* **Backend (Render):** Static files for the Django Admin panel are collected and served via WhiteNoise.
* **Database (Supabase):** Utilizing the IPv4 Connection Pooler (Port `6543`) to ensure compatibility with Render's outbound networking.

### Environment Variables

> **⚠️ Security Note:** Never commit `.env` files to version control.

**Backend (`.env` or Render Dashboard):**
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:6543/postgres
DJANGO_DEBUG=False
SECRET_KEY=your_django_secret
GEOAPIFY_API_KEY=your_geoapify_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

**Frontend (`.env` or Vercel Dashboard):**

```env
# Do not include a trailing slash!
VITE_API_URL=[https://moving-garage.onrender.com](https://moving-garage.onrender.com)

## 🤝 Contributors

This project was collaboratively built using modern web frameworks and AI-assisted development tools by:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/vikashyadavyou">
        <img src="https://github.com/vikashyadavyou.png" width="100px;" alt="Your Name Profile Picture"/><br />
        <sub><b>Your Name</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/manthan110">
        <img src="https://github.com/manthan110.png" width="100px;" alt="Manthan Profile Picture"/><br />
        <sub><b>Manthan</b></sub>
      </a>
    </td>
  </tr>
</table>

