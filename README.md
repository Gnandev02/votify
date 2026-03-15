# Votify - Online Voting System

A professional, secure, and modern Online Voting System built with React and a Serverless Backend.

## 🚀 Deployment

- **Frontend**: React + Vite (Standard Tailwind CSS)
- **Backend**: Vercel Serverless Functions
- **Database**: MySQL

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend API**: Node.js Serverless (Vercel)
- **Database**: MySQL (Compatible with PlanetScale, Railway, or AWS RDS)
- **Charts**: Chart.js / react-chartjs-2

## 📦 Project Structure

```bash
api/                # Serverless API functions
database/           # Database schema and connection logic
lib/                # Utility modules (Auth, OTP)
src/                # React frontend source
public/             # Static assets
index.html          # Frontend entry point
vercel.json         # Vercel deployment config
schema.sql          # MySQL database schema
```

## ⚙️ Environment Configuration

Create a `.env` file in the project root with the following:

```env
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📜 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run developement server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 📄 License
MIT
