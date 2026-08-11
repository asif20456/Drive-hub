# 🚗 Drive Hub — Multi-Tenant SaaS Car Rental Platform

A full-stack **SaaS multi-tenant car rental system** built with **Next.js (App Router) + TypeScript**, **Firebase Authentication**, and **Cloud Firestore** — with a **localStorage-based demo fallback** so every feature works with zero Firebase setup for evaluation.

---

## ✅ Technical Requirements Coverage

| Requirement | Implementation |
|---|---|
| **Next.js + TypeScript** | Next.js 14 App Router, strict TypeScript throughout (`src/`) |
| **Firebase Authentication** | Email/password sign-in, sign-up, session restore (`lib/auth-context.tsx`) |
| **Cloud Firestore** | All collections (`users`, `tenants`, `cars`, `bookings`) written through Firestore when configured |
| **Trusted backend path** | Firestore Security Rules re-validate every sensitive write server-side (see [Security & Trusted Backend Path](#-security--trusted-backend-path)); booking prices are computed from the Firestore car record, never from browser input |
| **Responsive UI** | Mobile-first Tailwind design system (`tokens.css` + `globals.css`) |

---

## 📱 Screens

### Public
- **Home / Car Listing** — `/` — Editorial catalogue with filters (category, price, agency, search)
- **Car Details** — `/cars/[id]` — Spec sheet + rate-card booking form with live date-conflict detection
- **Login** — `/login` — Email/password sign-in + one-click test logins
- **Register** — `/register` — Customer & rental-owner sign-up

### Customer
- **My Bookings** — `/customer/bookings` — Booking list, status filters, cancellation
- **Create Booking / Confirmation flow** — `/cars/[id]` → `/customer/booking-confirmation/[id]` — request a booking, then a confirmation screen with reference code, dates, total price, and next steps

### Rental Tenant
- **Dashboard** — `/tenant/dashboard` — Stats, fleet status, business info
- **Cars / Add / Edit** — `/tenant/cars` — Full fleet CRUD (add, edit, archive) with modal form
- **Bookings** — `/tenant/bookings` — Approve / reject / lifecycle status management

### Platform Admin
- **Control Panel** — `/admin` — Rental businesses list, suspend/reactivate controls, global orders view, and platform-wide fleet registry (add/remove vehicles)

---

## 🚀 Local Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

> **No Firebase? No problem.** The shipped `.env.example` contains the demo placeholders (`carhub-demo`). When the project ID is the placeholder, the app detects it and runs entirely on the **seeded localStorage dataset** — all features work offline, instantly. Point the env vars at a real Firebase project to switch to Cloud Firestore + Firebase Auth.

### 3. Run

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve production build
```

---

## 🔧 Environment Variables

All Firestore/Auth keys are `NEXT_PUBLIC_` prefixed (safe to expose to the browser):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | e.g. `your-project-id` — **must differ from `carhub-demo` to enable Firebase** |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID string |

---

## 👤 Test Accounts & Seed Data

### Demo mode (no Firebase)

On first load the app **auto-seeds** `localStorage` with users, two rental companies, a 16-car fleet, and bookings (seed versioned in `lib/storage.ts` — bump `SEED_VERSION` to force a re-seed).

Use the **Role Switcher** in the navbar to act as any persona instantly — no passwords needed in demo mode. Or sign in with these credentials:

| Role | Name | Email | Password |
|---|---|---|---|
| 🔴 Platform Admin | Platform Admin | `admin@carhub.com` | `admin123` |
| 🔵 Tenant A Owner | Alex Apex | `owner@apexrentals.com` | `apex123` |
| 🟡 Tenant B Owner | Maria Metro | `owner@metrohire.com` | `metro123` |
| 🟢 Customer 1 | John Doe | `john.customer@gmail.com` | `john123` |
| 🟣 Customer 2 | Sarah Smith | `sarah.customer@gmail.com` | `sarah123` |

> **Reset seed data** anytime: open the Role Switcher → **Reset seed data** (restores the pristine dataset).

### Firestore mode (real Firebase)

With a real project configured, run the seeder once to populate Firestore:

```bash
npm run seed:firestore
```

(The script loads `.env.local` and refuses to run against the `carhub-demo` placeholder.)

Create the same accounts in **Firebase Authentication → Email/Password**, then sign in normally. (Alternatively, stay in demo mode and let `onAuthStateChanged` sync real users.)

---

## 🏗️ Architecture

### Multi-tenant data isolation

Every tenant-owned document (`cars`, `bookings`) carries a `tenantId`. All tenant-scoped queries filter on it, and Firestore rules verify it matches the authenticated user — isolation is enforced at **both** the UI and the rules layer.

```
users/{uid}          → name, email, role, tenantId?, photoUrl?, createdAt
tenants/{tenantId}   → name, city, address, phone, status, ownerId, createdAt
cars/{carId}         → tenantId, make, model, year, registrationNo, category, pricePerDay, imageUrl, status, createdAt
bookings/{bookingId} → tenantId, carId, customerId, carDetails{}, startDate, endDate, totalPrice, status, createdAt
```

### Booking engine

1. `checkBookingOverlap()` blocks any `confirmed`/`active` booking whose dates overlap (`newStart <= existingEnd && newEnd >= existingStart`).
2. `createBooking()` fetches the car **from the database** (never trusts client input), validates availability + tenant status, then computes `totalPrice = rentalDays × pricePerDay` server-data-side.

### Demo vs. production data path

| Layer | Firebase configured | Demo mode |
|---|---|---|
| Auth | Firebase Auth + `users` doc | Seeded local users + session in `localStorage` |
| Data | Firestore (`lib/services/*`) | `lib/storage.ts` localStorage fallback |
| Integrity | **Firestore Rules (trusted backend)** | Client-side service validation |

The `isFirebaseConfigured()` gate (`lib/firebase.ts`) checks `NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'carhub-demo'` and bypasses Firestore entirely when unconfigured — this prevents hanging network calls to a non-existent project.

---

## 🔐 Security & Trusted Backend Path

Sensitive booking/admin operations are re-validated **server-side by Firestore Security Rules** (`firestore.rules`) — the client SDK cannot be trusted to enforce its own privileges:

| Entity | Rule-enforced protection |
|---|---|
| `users` | Read/write by self or admin; `role`/`tenantId` immutable by the user |
| `tenants` | Only admin can change `status`; owner edits without touching status |
| `cars` | Public reads only for `available` cars of **active** tenants; writes only by that tenant's active staff (or admin) |
| `bookings` | **Create**: `customerId == auth.uid`, status `pending`, tenant active, AND `isValidBookingRequest()` — the referenced car must exist, be `available`, belong to the claimed tenant, and the embedded `carDetails` must **exactly match the car document** (forged prices/vehicle data are rejected) |
| `bookings` update | Staff may only change the **status** field through the valid lifecycle; customers may only cancel `pending`/`confirmed`; the diff is restricted to `['status']` |

**Key guarantees**
- Booking price is computed from the Firestore car record — a client cannot submit an arbitrary `totalPrice`.
- Booking payloads are validated against the source car document at write time.
- Tenant isolation and role checks run on Firebase's servers, not in the browser.

> In demo mode (no Firebase) the same invariants are enforced by the client service layer, and rules take over automatically the moment a real project is wired up.

---

## 📁 Project Structure

```
├── firestore.rules          # Trusted backend path (RBAC + booking integrity)
├── design.md                # Locked "Open Road" design system (Hallmark)
├── tokens.css               # Portable design tokens (colors, type, spacing)
├── public/avatar.jpg        # Demo profile photo
└── src/
    ├── app/
    │   ├── page.tsx                     # Public: Home / Car catalogue
    │   ├── cars/[id]/page.tsx           # Public: Car details + booking form
    │   ├── login/page.tsx               # Public: Sign in + quick logins
    │   ├── register/page.tsx            # Public: Customer / owner sign-up
    │   ├── customer/
    │   │   ├── bookings/page.tsx        # Customer: My bookings
    │   │   └── booking-confirmation/[id]/page.tsx  # Confirmation flow
    │   ├── tenant/
    │   │   ├── dashboard/page.tsx       # Tenant: dashboard
    │   │   ├── cars/page.tsx            # Tenant: fleet CRUD (add/edit)
    │   │   └── bookings/page.tsx        # Tenant: booking lifecycle
    │   └── admin/page.tsx               # Admin: businesses, orders, fleet registry
    ├── components/
    │   ├── navbar.tsx                   # Role-aware masthead + avatar
    │   └── quick-role-switcher.tsx      # Demo persona switcher
    ├── lib/
    │   ├── firebase.ts                  # SDK init + isFirebaseConfigured gate
    │   ├── auth-context.tsx             # AuthContext (Firebase + demo fallback)
    │   ├── storage.ts                   # localStorage fallback + versioned seed
    │   ├── seed-data.ts                 # Demo dataset
    │   ├── seed.ts                      # Firestore seeder
    │   └── services/                    # cars, bookings, tenants services
    └── types/index.ts                   # Shared TypeScript interfaces
```

---

## 🔥 Deploy to Firebase (Optional)

```bash
npm i -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Email/Password** and **Firestore** (Production mode)
3. Copy config into `.env.local` (real project ID turns Firebase on)
4. Deploy the rules above, then run `npm run seed:firestore` to seed Firestore

---

*Drive Hub — a multi-tenant SaaS car-rental assignment demonstrating Next.js + TypeScript, Firebase Auth, Cloud Firestore RBAC, tenant isolation, and a trusted server-side rules path for booking integrity.*
