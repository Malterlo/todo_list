# Todo List (Task Tracker)

A full-stack task tracker application featuring session-based authentication, MongoDB storage, and a React + Vite frontend.

## Project Structure

- `backend/`: Express.js REST API with MongoDB (Mongoose) and session authentication.
- `frontend/course-frontend/`: React single-page application built with Vite.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally or accessible via URI

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Update SESSION_SECRET and MONGO_URI if needed
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # or npm start
   ```
   The backend server runs on `http://localhost:5000` by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend/course-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173` by default.
