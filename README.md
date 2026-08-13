# Neema Zipporah Academy — Backend API

Express + MongoDB (Mongoose) REST API for the Neema Zipporah Academy school
management system: role-based auth (Admin, Teacher, Parent, Accountant),
students, classes, attendance, fee invoicing, and M-Pesa Daraja STK Push
payments.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (`jsonwebtoken`) with bcrypt password hashing
- M-Pesa Daraja API (STK Push) via `axios`
- Nodemailer for transactional email

## Getting started

```bash
cd backend
npm install
cp .env.example .env   # then fill in your real values
npm run seed            # creates a first admin account + sample classes
npm run dev              # starts on http://localhost:5000 with nodemon
```

Make sure MongoDB is running locally (or point `MONGO_URI` at Atlas).

The frontend (Vite) should set its API base URL to `http://localhost:5000`
and send `Authorization: Bearer <token>` on authenticated requests. `CLIENT_URL`
in `.env` controls the CORS allow-list (defaults to `http://localhost:5173`).

## Project structure

```
backend/
  server.js              Express app entry point
  config/db.js            MongoDB connection
  models/                 Mongoose schemas
  controllers/             Route handler logic
  routes/                  Express routers
  middleware/              auth (JWT), checkRole (RBAC), errorHandler
  utils/                   generateToken, sendEmail, mpesa (Daraja), seed
```

## Auth model

Every portal account lives in the single `User` collection with a `role`
field: `admin | teacher | parent | accountant`. The login screen's role tabs
map directly onto this field — logging in cross-checks the selected tab
against the account's actual role.

`verifyToken` middleware reads the JWT and attaches `req.user`.
`checkRole("admin", "accountant")` middleware restricts a route to specific
roles. Combine them: `router.get("/", verifyToken, checkRole("admin"), handler)`.

## API reference

All routes are prefixed with `/api`. Private routes require
`Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/admin-signup` | Public | Create the first/an admin account |
| POST | `/login` | Public | `{ email, password, role? }` → `{ token, user }` |
| POST | `/register` | Admin | Create a teacher/parent/accountant account |
| GET | `/me` | Private | Current authenticated user |

### Students — `/api/students`
| Method | Path | Access |
|---|---|---|
| GET | `/?classRoom=&status=&search=` | Admin, Teacher, Accountant |
| POST | `/` | Admin |
| GET | `/:id` | Admin, Teacher, Accountant, Parent (own child) |
| PUT | `/:id` | Admin |
| DELETE | `/:id` (soft; `?hard=true` for permanent) | Admin |

### Classes — `/api/classes`
| Method | Path | Access |
|---|---|---|
| GET | `/` | Admin, Teacher, Accountant |
| POST | `/` | Admin |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |
| GET | `/:id/students` | Admin, Teacher |

### Teacher portal — `/api/teacher`
| Method | Path | Access |
|---|---|---|
| GET | `/dashboard` | Teacher |
| GET | `/classes/:classId/students` | Teacher |
| POST | `/attendance` | Teacher — `{ classRoom, date, records: [{ student, status, remarks }] }` |
| GET | `/attendance/:classId?from=&to=` | Teacher, Admin |

### Parent portal — `/api/parent`
| Method | Path | Access |
|---|---|---|
| GET | `/dashboard` | Parent — children + outstanding balances |

### Fees & M-Pesa — `/api/fees`
| Method | Path | Access |
|---|---|---|
| GET | `/invoices?student=&status=&term=&academicYear=` | Admin, Accountant, Parent (own) |
| POST | `/invoices` | Admin, Accountant |
| GET | `/invoices/:id` | Admin, Accountant, Parent (own) |
| POST | `/mpesa/stkpush` | Admin, Accountant, Parent — `{ invoiceId, phoneNumber, amount }` |
| POST | `/mpesa/callback` | **Public** — Safaricom's servers hit this |
| GET | `/mpesa/status/:paymentId` | Admin, Accountant, Parent |

### Admin — staff directory — `/api/admin/staff`
| Method | Path | Access |
|---|---|---|
| GET | `/?search=&dept=&access=&status=` | Admin |
| POST | `/` | Admin |
| GET | `/:id` | Admin |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |

This matches the fields used by the Admin dashboard staff table:
`name, role, dept, email, phone, access (Admin/Staff/Viewer), status (active/leave/inactive)`.

## M-Pesa Daraja setup

1. Create an app at https://developer.safaricom.co.ke and grab your sandbox
   `Consumer Key` / `Consumer Secret`.
2. Sandbox `MPESA_SHORTCODE` is `174379` with the published test passkey —
   both already in `.env.example`.
3. `MPESA_CALLBACK_URL` must be a **publicly reachable HTTPS URL** — use
   ngrok (`ngrok http 5000`) during local development and point it at
   `/api/fees/mpesa/callback`.
4. Flow: frontend calls `POST /api/fees/mpesa/stkpush` → customer gets an
   STK prompt on their phone → Safaricom calls `POST /api/fees/mpesa/callback`
   → the invoice's `amountPaid` is updated automatically. The frontend can
   poll `GET /api/fees/mpesa/status/:paymentId` while waiting.

## Error format

All errors return JSON: `{ success: false, message: "..." }` (plus `stack`
outside production). Mongoose validation errors, duplicate-key errors, and
bad ObjectIds are all normalized into readable messages by
`middleware/errorHandler.js`.
