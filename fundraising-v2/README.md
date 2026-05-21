# 🎓 Fundraising System

Full-stack web app connecting students with donors.
**React + Node.js Microservices + PostgreSQL**

---

## 📁 Project Structure

```
fundraising-system/
├── backend/                        ← All backend code
│   ├── api-gateway/index.js        ← Single entry point (port 4000)
│   ├── user-service/index.js       ← Auth & Users   (port 3001)
│   ├── claim-service/index.js      ← Claims         (port 3002)
│   ├── donation-service/index.js   ← Donations      (port 3003)
│   ├── notification-service/index.js ← Messages     (port 3004)
│   ├── admin-service/index.js      ← Admin/Depts    (port 3005)
│   ├── db/
│   │   ├── index.js                ← PostgreSQL pool
│   │   └── schema.sql              ← Database tables
│   ├── package.json                ← Backend dependencies
│   └── .env                        ← ⚠️ Edit this with your DB password
│
└── frontend/                       ← React App (port 5173)
    ├── src/
    │   ├── App.jsx                 ← Routes
    │   ├── context/AuthContext.jsx ← Auth state
    │   ├── services/api.js         ← API calls
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Terms.jsx
    │   │   ├── claimer/ClaimerDashboard.jsx
    │   │   ├── donor/DonorDashboard.jsx
    │   │   └── admin/
    │   │       ├── AdminLogin.jsx
    │   │       └── AdminDashboard.jsx
    │   └── styles/global.css
    └── package.json
```

---

## ⚙️ Setup Instructions

### Step 1 — PostgreSQL Setup

1. Open **pgAdmin** or **psql**
2. Create the database:
```sql
CREATE DATABASE fundraising_db;
```
3. Run the schema (in psql terminal):
```bash
psql -U postgres -d fundraising_db -f backend/db/schema.sql
```

---

### Step 2 — Configure Backend

Open `backend/.env` and set your PostgreSQL password:
```env
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=any_long_random_string_here
```

---

### Step 3 — Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 4 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

### Step 5 — Start the Backend

Open a terminal in the `backend` folder and run **all services at once**:

```bash
cd backend
npm run dev
```

You should see all 6 services start:
```
[USER]    👤 User Service running on port 3001
[CLAIM]   📋 Claim Service running on port 3002
[DONATE]  💰 Donation Service running on port 3003
[NOTIFY]  📨 Notification Service running on port 3004
[ADMIN]   ⚙️  Admin Service running on port 3005
[GATEWAY] 🚀 API Gateway running on port 4000
```

---

### Step 6 — Start the Frontend

Open a **second terminal** in the `frontend` folder:

```bash
cd frontend
npm run dev
```

---

### Step 7 — Open in Browser

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Main App |
| http://localhost:5173/admin/login | Admin Login |
| http://localhost:4000/health | Backend Health Check |

---

## 🔑 Default Admin Login

```
Email:    admin@fundraising.com
Password: admin123
```

---

## 👤 User Roles

| Role | What They Can Do |
|------|-----------------|
| **Student (Claimer)** | Register → Submit claim with HOD doc → Track status → Read messages |
| **Donor** | Register → Browse approved claims → Donate via EasyPaisa → Track donations |
| **Admin** | Approve/reject claims · Manage users · Verify donations · Send messages · Manage departments |
