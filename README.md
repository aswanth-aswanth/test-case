# Esperia Project - Test Case Generator

This repository contains the Test Case Generator application, which consists of a Node.js/Express backend and a React/Vite frontend.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (running locally on default port `27017`, or a MongoDB Atlas URI)
- **npm** or **yarn**

## Environment Configuration

A sample environment configuration file (`.env.example`) is provided in the root directory. You need to create `.env` files for both the frontend and backend.

1. **Backend Configuration:**
   - Navigate to the `backend` folder.
   - Copy `.env.example` to `.env` (or create a `.env` file manually and refer to the root `.env.example`).
   - Update `GEMINI_API_KEY` with your actual API key.
   - Adjust `MONGODB_URI` if your database is hosted elsewhere.

2. **Frontend Configuration:**
   - Navigate to the `frontend` folder.
   - Copy `.env.example` to `.env` (or create a `.env` file manually).
   - Ensure `VITE_API_BASE_URL` points to your backend URL (e.g., `http://localhost:5001/api`).

## Running the Application Locally

### 1. Start the Backend Server

Open a terminal and run the following commands:

```bash
cd backend
npm install
npm run dev
```
The backend will start, typically on `http://localhost:5001`.

### 2. Start the Frontend Application

Open a new terminal and run the following commands:

```bash
cd frontend
npm install
npm run dev
```
The frontend will start, typically on `http://localhost:5173`.

## Application Features & Resiliency

This application has been developed with robustness in mind:

- **Input Validation:** The backend uses **Zod** middleware (`validate.js`) to enforce strict schemas for all incoming requests (body, params, and queries). 
- **Error Handling:** 
  - **Backend:** A centralized `errorHandler.js` catches all exceptions (ZodErrors, Mongoose duplicate/cast errors) and normalizes them into standard JSON responses.
  - **Frontend:** An Axios interceptor (`errorHandler.js`) captures network failures, timeouts, and backend HTTP errors, translating them into user-friendly UI messages via React Hot Toast notifications.
- **Edge-Case Management:** The AI generation endpoints handle timeouts, rate limiting (429s), model fallback retries, and database constraints correctly, ensuring graceful degradation if an external service fails.
