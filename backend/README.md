# Test Case Generator — Backend API


Anonymous clients submit a software requirement, receive AI-generated draft test cases from Gemini, edit/regenerate them in the frontend, then **explicitly save** the final reviewed set. Requirements and test cases are stored separately in MongoDB for a lightweight history sidebar and lazy-loaded detail views.

---

## Overview

| Concern | Approach |
| --- | --- |
| Runtime | Node.js (ES modules) + Express |
| Database | MongoDB + Mongoose |
| AI | Google Gemini via `@google/genai` |
| Validation | Zod (requests + AI output) |
| Security | Helmet, CORS, rate limiting, body limits |

**Core product rule:** `Generate ≠ Save`.

- `POST /api/test-cases/generate` returns a **draft** and never writes to MongoDB.
- `POST /api/test-cases` is the explicit persistence boundary.

---

## Architecture

```text
Frontend
   ↓
Express API (controllers — thin)
   ↓
Service Layer
   ├── Requirement Service
   ├── Test Case Service
   └── AI Service
          ↓
       Gemini (+ retry / model fallback)
   ↓
MongoDB
   ├── Requirement (metadata container per userId)
   └── TestCaseSet (testCases[] per userId + requirementId)
```

Separation of concerns:

- **Controllers** — HTTP in/out only
- **Services** — business logic
- **AI service** — all Gemini client calls, structured output, retries, fallbacks
- **Prompts / schemas / validators** — isolated from HTTP and persistence

---

## Data Model

```text
Anonymous User (userId UUID from frontend)
      │
      ▼
Requirement document (one per userId)
      └── requirements[]  { requirementId, prompt, createdAt, updatedAt }
             │
             │ requirementId
             ▼
      TestCaseSet document (one per userId + requirementId)
             └── testCases[]
```

### Why requirements and test cases are separate

1. Requirement listing stays lightweight for a sidebar/history UI.
2. `GET /api/requirements` never returns large `testCases` arrays.
3. Test cases load only when the user opens a specific requirement.
4. Multiple requirements can exist per anonymous user.
5. Test case data is isolated from requirement metadata.
6. Ownership is checked with `userId + requirementId` (Mongo `_id` alone is never authorization).
7. Documents stay focused; indexes stay simple and intentional.

---

## Anonymous User ID

Authentication is **out of scope**.

The frontend generates:

```javascript
const userId = crypto.randomUUID();
```

and stores it in `localStorage`. The backend validates it as a UUID on every request. It is an anonymous browser/client ID — not an authenticated identity.

The backend does **not** identify users by IP, MAC, fingerprint, OS, or device.

---

## Persistence: Generate vs Save

```text
User enters requirement
        ↓
POST /api/test-cases/generate   ← Gemini only, NO DB write
        ↓
Draft test cases → frontend view / edit / regenerate
        ↓
User clicks SAVE
        ↓
POST /api/test-cases            ← Requirement + TestCaseSet persisted
```

Regeneration is simply another call to `/generate`. It does not create requirements, TestCaseSets, or generation history.

---

## AI Strategy

```text
User Requirement
      ↓
Prompt Engineering (Senior QA role + anti-hallucination rules)
      ↓
Gemini (structured JSON Schema output)
      ↓
JSON.parse()
      ↓
Zod validation (application-level structure)
      ↓
Semantic validation (duplicates, empty steps, unsupported features)
      ↓
Draft response (no DB write)
```

### Why both structured output and Zod?

- **Gemini structured output** constrains response **format** (`responseMimeType` + `responseSchema`).
- **Zod** validates the parsed payload against **application** rules (non-empty strings, unique IDs/titles, required arrays).
- **Semantic checks** catch content problems that schema alone cannot (hallucinated SMS OTP, biometric login, unrelated scenarios, duplicate scenarios).

Structured output does **not** mean the AI content is automatically correct. Schema-valid JSON can still be semantically wrong — hence the full validation pipeline.

### Prompt engineering

The model is instructed to act as a Senior QA Engineer, treat the requirement as the sole source of truth, cover positive / negative / validation / edge cases, avoid inventing unsupported product behavior, and return only the structured payload.

### Gemini fallback models

Models are configured via environment variable (not hardcoded in business logic):

```env
GEMINI_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash
```

```text
Primary model
     ↓ retry (bounded exponential backoff + jitter)
     ↓ still failing
Fallback model 1
     ↓ retry
Fallback model 2
     ↓ …
```

**Retry / fallback for:** 429, 500, 502, 503, 504, timeout, transient network, model unavailable.

**Do not blindly fallback for:** invalid API key, malformed config, programming errors — changing models will not fix those. The API returns `AI_CONFIGURATION_ERROR`.

Each Gemini request uses `AbortController` with `AI_REQUEST_TIMEOUT_MS`.

---

## Rate Limits (two different layers)

| Layer | What it protects | Config |
| --- | --- | --- |
| **Backend** (`express-rate-limit`) | Abuse of `POST /api/test-cases/generate` | `BACKEND_RATE_LIMIT_*` |
| **Gemini provider** | Google quota / capacity | Handled via retry + model fallback |

These are independent. Hitting the backend limit does not mean Gemini is down, and vice versa.

---

## API Endpoints

| Method | Path | Purpose | Persists? |
| --- | --- | --- | --- |
| GET | `/api/health` | App + DB status | No |

| GET | `/api/requirements?userId=` | List requirement metadata | No |
| GET | `/api/requirements/:id?userId=` | Single requirement metadata | No |
| DELETE | `/api/requirements/:id?userId=` | Delete requirement + TestCaseSet | Yes |
| POST | `/api/test-cases/generate` | AI draft generation | **No** |
| POST | `/api/test-cases` | Explicit save (requirement + cases) | Yes |
| GET | `/api/requirements/:id/test-cases?userId=` | Lazy-load test cases | No |
| PUT | `/api/requirements/:id/test-cases` | Update saved test cases | Yes |

### Requirement list behavior

`GET /api/requirements` returns only:

`requirementId`, `prompt`, `createdAt`, `updatedAt`

It never queries `TestCaseSet` and never returns `testCases`.

### Single-requirement test-case retrieval

```text
GET /api/requirements/:requirementId/test-cases?userId=...
```

Verifies ownership with `userId + requirementId`, then returns that requirement’s `testCases[]` only.

---

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Codes include: `VALIDATION_ERROR`, `INVALID_USER_ID`, `REQUIREMENT_NOT_FOUND`, `TEST_CASES_NOT_FOUND`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_INVALID_OUTPUT`, `AI_UNAVAILABLE`, `AI_CONFIGURATION_ERROR`, `DATABASE_ERROR`, `INTERNAL_SERVER_ERROR`.

Raw Gemini errors are never exposed to the client.

---

## Security

- Environment variables for secrets (`GEMINI_API_KEY` never sent to the frontend)
- Explicit CORS origin (`CLIENT_ORIGIN`)
- Helmet HTTP headers
- Backend rate limiting on AI generation
- Zod validation on all mutating / sensitive inputs
- `express.json({ limit: '1mb' })`
- Ownership checks on every requirement / test-case data operation
- Production stack traces are not leaked

---

## Project Structure

```text
backend/
├── src/
│   ├── config/          # env + MongoDB
│   ├── controllers/     # thin HTTP handlers
│   ├── services/        # business + AI logic
│   ├── models/          # Mongoose schemas
│   ├── routes/
│   ├── validators/      # Zod (requests + AI response)
│   ├── prompts/         # Gemini prompt engineering
│   ├── schemas/         # Gemini JSON Schema
│   ├── middleware/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── docs/postman/
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a reachable URI)
- A Google AI Studio / Gemini API key

### Install

```bash
cd backend
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/test-case-generator
GEMINI_API_KEY=your_real_gemini_api_key
GEMINI_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash
CLIENT_ORIGIN=http://localhost:5173
MIN_REQUIREMENT_LENGTH=10
MAX_REQUIREMENT_LENGTH=10000
AI_MAX_RETRIES_PER_MODEL=2
AI_REQUEST_TIMEOUT_MS=30000
BACKEND_RATE_LIMIT_WINDOW_MS=900000
BACKEND_RATE_LIMIT_MAX=30
```

### MongoDB setup

1. Install and start MongoDB locally, **or**
2. Point `MONGODB_URI` at MongoDB Atlas / another instance.

The app creates indexes on:

- `Requirement.userId` (unique)
- `TestCaseSet { userId, requirementId }` (unique compound)

**Transactions:** Save and delete prefer MongoDB sessions/transactions when available (replica set). On a standalone local MongoDB without a replica set, the services fall back to careful sequential writes and log a warning. Document this for local assessment setups.

### Gemini setup

1. Create an API key in [Google AI Studio](https://aistudio.google.com/).
2. Set `GEMINI_API_KEY` in `.env` (never commit it).
3. Adjust `GEMINI_MODELS` to an ordered primary → fallback list of available Flash-family models for your account.

### Start the server

```bash
npm run dev
# or
npm start
```

Health check:

```bash
curl http://localhost:5000/api/health
```

---

## Postman

Import:

```text
docs/postman/Test-Case-Generator.postman_collection.json
```

Collection variables:

| Variable | Default |
| --- | --- |
| `baseUrl` | `http://localhost:5000/api` |
| `userId` | `550e8400-e29b-41d4-a716-446655440000` |
| `requirementId` | set automatically after Save |

Suggested flow: Health → Generate → Save Test Cases → List Requirements → Get Test Cases → Update → Delete.

---

## Indexes

| Model | Index |
| --- | --- |
| Requirement | `{ userId: 1 }` unique |
| TestCaseSet | `{ userId: 1, requirementId: 1 }` unique |

---

## Logging

Logged: AI request started / model selected / retry / fallback / success / failure, database and request errors.

Never logged: `GEMINI_API_KEY`, and full user requirements are avoided in logs.

---

## License

UNLICENSED — assessment submission.
