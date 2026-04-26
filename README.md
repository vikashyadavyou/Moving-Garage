# 🛠️ Moving Garage

**Moving Garage** is a real-time, on-demand breakdown assistance platform designed specifically for 2-wheeler commuters. Operating on an "Uber-like" model, it instantly connects stranded riders with nearby, verified local mechanics for on-site repairs or towing services.

## 🚀 Features

### For Commuters (Users)
* **Real-Time Geolocation:** Auto-fetches current coordinates to pinpoint breakdown locations exactly.
* **Multi-Issue Selection:** Select primary issues (e.g., Flat Tire, Dead Battery) along with secondary needs like "Pushing to Garage".
* **Live Tracking:** Track the assigned mechanic's ETA and live location on an interactive map.
* **Transparent Pricing:** Upfront cost calculation based on fixed service rates and per-km travel fees.
* **Flexible Payments:** Pay securely online via UPI/Cards or choose "Cash After Repair."
* **Dynamic Diagnosis Approval:** If the initial issue is unknown, review and approve the mechanic's on-site diagnosis before work begins.

### For Mechanics
* **Live Job Broadcasting:** Receive real-time alerts for nearby breakdown requests.
* **Dashboard & Status Management:** Toggle availability and update job statuses in real-time (En Route, Arrived, In Progress, Pending Payment).
* **On-Site Diagnosis:** Evaluate "Unknown Issues" and submit the actual diagnostic report for user approval.
* **Cash Confirmation Handshake:** Securely verify and close out jobs when receiving physical cash payments.

## 💻 Tech Stack

**Frontend:**
* React.js (Vite)
* Tailwind CSS (Responsive UI/UX)
* React Router (Navigation)
* Mapbox GL JS (Interactive Maps)

**Backend:**
* Python 3
* Django & Django REST Framework (DRF)
* Django Channels & Redis (WebSockets for real-time features)
* SQLite (Development Database)

**Third-Party Integrations:**
* **Mapbox API:** Geocoding, routing, and real-time map rendering.
* **Razorpay API:** Secure online payment processing and checkout routing.

## 🔄 System Workflow

1. **Request Initiation:** A commuter's 2-wheeler breaks down. They open the app, select their vehicle issue(s), and broadcast their live location.
2. **Mechanic Matching:** The backend calculates distances and pings available mechanics within the radius via WebSockets.
3. **Acceptance & Transit:** A mechanic accepts the job and navigates to the commuter's location using integrated routing.
4. **Diagnosis & Repair:** * If the issue is known, the mechanic begins repairs.
   * If unknown, the mechanic assesses the vehicle, updates the diagnosis via the app, and waits for the commuter's digital approval and price recalculation.
5. **Checkout & Payment:** Once marked "Pending Payment" by the mechanic, the commuter is prompted to pay.
   * **Online:** Commuter pays via Razorpay; job auto-completes.
   * **Cash:** Commuter selects cash; mechanic verifies receipt on their dashboard to complete the job.
