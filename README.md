# 🗓️ Event Manager Dashboard

A Full-Stack Event Management Application built with Node.js/Express, Next.js, and Neon PostgreSQL using raw SQL queries.

## 🚀 Tech Stack
- **Frontend:** Next.js 16 (App Router, Tailwind CSS)
- **Backend:** Node.js, Express, TypeScript, `tsx` runner
- **Database:** Neon Cloud PostgreSQL (Raw SQL queries via `pg` pool)

## 🛠️ Installation & Setup

### 1. Database Setup
Execute the SQL scripts provided in the `migrations.sql` file inside your Neon SQL Editor console to create the necessary tables.

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend/` folder and add your Neon credentials:
   ```env
   PORT=5000
   DB_USER=your_neon_user
   DB_HOST=your_neon_host
   DB_NAME=neondb
   DB_PASSWORD=your_neon_password
   DB_PORT=5432
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
