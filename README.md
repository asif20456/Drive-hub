# 🚗 Drive Hub — Multi-Tenant SaaS Car Rental Platform

A full-stack **SaaS multi-tenant car rental system** built with **Next.js**, **TypeScript**, **Firebase Authentication**, and **Cloud Firestore** (with a localStorage-based demo fallback for offline evaluation).

---

## 🏆 Core Features

| Feature | Status |
|---|---|
| Multi-tenant data isolation | ✅ |
| Firestore Security Rules (RBAC) | ✅ |
| Booking overlap prevention | ✅ |
| Fleet CRUD (Add/Edit/Archive/Status) | ✅ |
| Booking lifecycle (Pending→Confirmed→Active→Completed) | ✅ |
| Platform Admin suspend/reactivate tenants | ✅ |
| Customer booking & cancellation | ✅ |
| Role-based navigation & route protection | ✅ |
| Server-side price calculation | ✅ |
| Demo seed data (localStorage fallback) | ✅ |

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone <your-repo>
cd Car-hub
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your **Firebase project credentials** (see section below), or leave the demo placeholders to use the **offline localStorage fallback** (no Firebase needed for evaluation).

### 3. Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🔧 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | e.g. `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID string |

> 📌 **For evaluation without Firebase**: The app automatically falls back to `localStorage` with pre-seeded data. No Firebase setup is required to test all features.

---

## 👤 Evaluator Quick-Start Accounts

All accounts are pre-seeded in the demo dataset. Use the **"Role Switcher"** button in the top navigation bar to switch instantly — no password required for demo mode.

| Role | Name | Email | Password (Firebase) |
|---|---|---|---|
| 🔴 Platform Admin | Platform Admin | `admin@carhub.com` | `admin123` |
| 🔵 Tenant A Owner | Alex Apex | `owner@apexrentals.com` | `apex123` |
| 🟡 Tenant B Owner | Maria Metro | `owner@metrohire.com` | `metro123` |
| 🟢 Customer 1 | John Doe | `john.customer@gmail.com` | `john123` |
| 🟣 Customer 2 | Sarah Smith | `sarah.customer@gmail.com` | `sarah123` |

---

## 🏗️ Architecture & Data Model

### Multi-Tenant Design

Every **tenant-owned document** (`cars`, `bookings`) contains a `tenantId` field. All queries are scoped to this `tenantId`, ensuring:

- Tenant A (Apex Rentals NY) can **never** read or write Tenant B's (Metro Car Hire LA) data
- This isolation is enforced at **both the UI and Firestore Security Rules** level

### Firestore Collections

```
users/{uid}
├── uid, name, email, role, tenantId?, createdAt

tenants/{tenantId}
├── id, name, city, address, phone, status, ownerId, createdAt

cars/{carId}
├── id, tenantId, make, model, year, registrationNo
├── category, pricePerDay, imageUrl, status, createdAt

bookings/{bookingId}
├── id, tenantId, carId, customerId, customerName, customerEmail
├── carDetails{}, startDate, endDate, totalPrice, status, createdAt
```

### Booking Conflict Algorithm

Before creating any booking, the system:
1. Queries all `confirmed` or `active` bookings for the requested `carId`
2. Checks for date overlap: `newStart <= existingEnd && newEnd >= existingStart`
3. **Rejects** the booking if any overlap is detected with a descriptive error message
4. **Calculates price** from the Firestore car record (not browser-provided values)

---

## 🔐 Security Rules (`firestore.rules`)

| Entity | Protection |
|---|---|
| `users` | Read/write only by self or Platform Admin |
| `tenants` | Public read; only admin can change `status` |
| `cars` | Public read of available cars; write only by active tenant staff |
| `bookings` | Staff reads own tenant; customer reads own; price/tenantId/customerId are server-controlled |

### Key Security Guarantees

- **Tenant isolation** — Firestore rules verify `tenantId` matches the authenticated user's `tenantId`
- **Booking price** — computed from the Firestore car record, not browser input
- **Booking status** — customers can only transition to `cancelled`; staff can move through the lifecycle
- **Admin role** — cannot be granted via client-side state change

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Public: Car Catalog (Browse + Filter)
│   ├── cars/[id]/page.tsx         # Public: Car Details + Booking Form
│   ├── login/page.tsx             # Auth: Sign In + 1-click test logins
│   ├── register/page.tsx          # Auth: Customer & Owner Registration
│   ├── customer/bookings/page.tsx # Customer: My Bookings + Cancel
│   ├── tenant/
│   │   ├── dashboard/page.tsx     # Tenant: Overview Stats + Fleet
│   │   ├── cars/page.tsx          # Tenant: Fleet CRUD Manager
│   │   └── bookings/page.tsx      # Tenant: Booking Lifecycle Manager
│   └── admin/page.tsx             # Admin: Platform Control Panel
│
├── components/
│   ├── navbar.tsx                 # Role-aware navigation bar
│   └── quick-role-switcher.tsx    # Evaluator persona switcher
│
├── lib/
│   ├── firebase.ts                # Firebase SDK init
│   ├── auth-context.tsx           # AuthContext + session management
│   ├── storage.ts                 # localStorage fallback layer
│   ├── seed-data.ts               # Seed data for demo
│   ├── seed.ts                    # Firestore seeder function
│   └── services/
│       ├── cars.ts                # Car CRUD services
│       ├── bookings.ts            # Booking engine + overlap logic
│       └── tenants.ts             # Tenant management service
│
└── types/
    └── index.ts                   # TypeScript interfaces
```

---

## 🔥 Deploy to Firebase (Optional)

### Setup Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project
3. Enable **Authentication** → Email/Password
4. Enable **Cloud Firestore** → Start in Production mode
5. Copy your Firebase config to `.env.local`

### Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### Build & Export

```bash
npm run build
npm run start
```

---

## ✅ Acceptance Criteria Coverage

| Requirement | Implementation |
|---|---|
| Two tenants with isolated data | Apex Rentals (NY) + Metro Car Hire (LA) |
| Staff sees only own fleet/bookings | `tenantId` scoped queries + Firestore Rules |
| Customer browse & book cars | `/` catalog + `/cars/[id]` booking form |
| Booking price calculated correctly | `days * pricePerDay` from server Firestore doc |
| Overlap check (Confirmed/Active blocked) | `checkBookingOverlap()` in `services/bookings.ts` |
| Staff booking status management | Tenant Bookings page with lifecycle transitions |
| Admin suspend/reactivate tenants | Admin dashboard with `updateTenantStatus()` |
| Firestore rules enforce isolation | `firestore.rules` with `isPlatformAdmin()`, `isTenantStaff()`, `isCustomer()` |

---

*Drive Hub — Built as a multi-tenant SaaS student assignment demonstrating Firebase Auth, Cloud Firestore RBAC, tenant data isolation, and booking conflict prevention.*
