# ROS (Restaurant Operating System) – Project Specification

This README is intended as a complete context handoff for AI assistants and new contributors.
It prioritizes backend details (current source of truth) and includes frontend theme/color tokens for UI consistency.

---

## 1) Project Overview

ROS is a restaurant ordering/admin system split into:

- `backend` – NestJS API + Prisma/PostgreSQL
- `frontend` – React + Vite + Tailwind UI shell (currently under redesign)

Monorepo root scripts run both apps together for local development.

---

## 2) Tech Stack

### Backend

- NestJS 10
- Prisma 5 + PostgreSQL
- JWT auth (`@nestjs/jwt`, Passport JWT)
- Validation via `class-validator` + global `ValidationPipe`
- Password hashing with `bcryptjs`

### Frontend (context only)

- React 18 + Vite
- TailwindCSS 3
- TypeScript

---

## 3) Repository Structure

```text
vestcodes-ros/
  backend/
    prisma/
      schema.prisma
      seed.ts
    src/
      app.module.ts
      main.ts
      auth/
      menu/
      prisma/
  frontend/
    src/
    tailwind.config.js
    package.json
  package.json
```

---

## 4) Backend Runtime and Boot Behavior

Backend entry: `backend/src/main.ts`

- Runs Nest app on port `3000`
- Global API prefix: `/api`
- Global validation: whitelist + transform
- CORS: `http://localhost:5173` with credentials enabled

Health endpoint:

- `GET /api/health`
- Response: `{ status: "ok", app: "ROS", version: "0.9" }`

---

## 5) Backend Modules (Current)

From `backend/src/app.module.ts`:

- `PrismaModule` (global DB client provider)
- `AuthModule` (staff auth + table token verification)
- `MenuModule` (public + manager menu APIs)

### PrismaModule

- `PrismaService` extends `PrismaClient`
- Connects on module init, disconnects on module destroy
- Marked `@Global()` and exported for all modules

---

## 6) Authentication and Authorization

### 6.1 Staff JWT Login

Endpoint:

- `POST /api/auth/login`

Input DTO (`LoginDto`):

- `email` (valid email)
- `password` (string, min length 6)

Behavior:

- Fetch user by email
- Compare password with `bcrypt.compare(password, user.passwordHash)`
- On success, signs JWT (7d expiry) with payload:
  - `sub` (user id)
  - `role` (`manager | kitchen | floor`)
  - `restaurantId`

Response:

- `accessToken`
- `user` object (`id`, `email`, `role`, `restaurantId`)

### 6.2 Get Current User

Endpoint:

- `GET /api/auth/me`
- Guarded by `JwtAuthGuard`
- Returns decoded/authenticated user shape from `JwtStrategy.validate()`

### 6.3 Table Token Verification (Customer QR Flow)

Endpoint:

- `GET /api/auth/table/:tableId/verify?t=<token>`

Behavior:

- Requires query token `t`
- Looks up table by `tableId`
- Validates HMAC token using `TableTokenService`
- Returns:
  - `valid: true`
  - `tableId`
  - `tableNumber`
  - `restaurantId`

If invalid/missing/forged: returns `401 Unauthorized`.

### 6.4 Role-Based Access

Roles are metadata-driven:

- Decorator: `@Roles('manager' | 'kitchen' | 'floor')`
- Guard: `RolesGuard` checks `req.user.role`
- Current protected manager routes are in Menu module

---

## 7) Menu API

Controller base path: `/api/menu`

### Public Customer Route

- `GET /api/menu?restaurantId=<number>`
- Returns only `available: true` items
- Sorted by `category`, then `name`

### Manager Routes (JWT + role manager)

- `GET /api/menu/items`
  - Returns all menu items for manager's restaurant (including unavailable)

- `POST /api/menu/items`
  - Creates new menu item under manager's restaurant
  - DTO fields:
    - `name` (string, min 2)
    - `description?`
    - `price` (positive number)
    - `category` (string, min 2)
    - `imageUrl?`

- `PATCH /api/menu/items/:id`
  - Partial update via `UpdateMenuItemDto` (`PartialType(CreateMenuItemDto)`)
  - Ownership enforced (must belong to manager restaurant)

- `PATCH /api/menu/items/:id/toggle`
  - Flips `available` true/false
  - Ownership enforced

Ownership checks are done in `MenuService.assertOwnership()`, returning:

- `404` if item not found
- `403` if wrong restaurant

---

## 8) Database Schema (Prisma)

Prisma file: `backend/prisma/schema.prisma`

## Models

- `Restaurant`
  - core org root
  - fields include `gstRate`, `currency`, email/phone verification flags

- `Table`
  - belongs to restaurant
  - unique constraint: `@@unique([restaurantId, number])`

- `MenuItem`
  - belongs to restaurant
  - has category, price, optional image, `available` flag

- `Order`
  - belongs to restaurant + table
  - `status` default `pending`
  - relation to `OrderItem`, optional `Invoice`, `AuditLog`

- `OrderItem`
  - relation between order and menu item
  - quantity + unit price snapshot

- `User`
  - staff account
  - unique email
  - role comment indicates `manager | kitchen | floor`

- `Invoice`
  - one-to-one with order (`orderId @unique`)
  - subtotal, gstAmount, total

- `AuditLog`
  - tracks order status transitions
  - optional staff user relation

### Status Note

Schema comment defines order status flow:

`pending -> approved -> preparing -> ready -> served | rejected`

---

## 9) Seed Data (Important for local testing)

Seeder: `backend/prisma/seed.ts`

Creates/ensures:

- Restaurant:
  - `id=1`, name: `Demo Kitchen`, `gstRate=0.05`, currency `INR`
- Tables:
  - 1 to 6 (`Indoor` for 1-3, `Outdoor` for 4-6)
- Menu items:
  - 8 demo dishes across categories
- Staff users:
  - `manager@demo.com` / `manager123`
  - `kitchen@demo.com` / `kitchen123`
  - `floor@demo.com` / `floor123`

---

## 10) Environment Variables

Required for backend:

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (used for staff JWT and table HMAC token signing)

Fallback behavior (code default): if `JWT_SECRET` is missing, backend uses `change_me_in_production`.
Do not use this default in production.

---

## 11) Scripts

### Monorepo root (`package.json`)

- `pnpm dev`
  - Runs backend + frontend concurrently
- `pnpm build`
  - Builds backend and frontend

### Backend (`backend/package.json`)

- `pnpm --filter backend dev` – start Nest in watch mode
- `pnpm --filter backend build` – compile backend
- `pnpm --filter backend start` – run compiled backend
- `pnpm --filter backend db:migrate` – Prisma migrate dev
- `pnpm --filter backend db:generate` – generate Prisma client
- `pnpm --filter backend db:seed` – seed demo data
- `pnpm --filter backend db:studio` – open Prisma Studio
- `pnpm --filter backend db:reset` – reset DB (destructive)

---

## 12) API Quick Reference

Base URL local backend: `http://localhost:3000/api`

### Public

- `GET /health`
- `GET /menu?restaurantId=1`
- `GET /auth/table/:tableId/verify?t=<token>`

### Authenticated

- `POST /auth/login`
- `GET /auth/me`

### Manager only

- `GET /menu/items`
- `POST /menu/items`
- `PATCH /menu/items/:id`
- `PATCH /menu/items/:id/toggle`

---

## 13) Known Backend Boundaries (Current State)

- Schema already includes `Order`, `OrderItem`, `Invoice`, `AuditLog` models
  but corresponding Nest modules/controllers/services are not yet implemented.
- Current backend implementation is focused on:
  - Auth (staff + table token verify)
  - Menu management + public menu retrieval
  - Health endpoint

---

## 14) Frontend Theme/Color Tokens (Reference Only)

Pulled from `frontend/tailwind.config.js` + CSS variables.

### Palette (Hex)

- Primary:
  - `#8A9B5A` (default)
  - `#728246` (dark)
  - `#F4F7EE` (light)
- Beige:
  - `#EEDCCB` (default)
  - `#F8F2EC` (light)
- Success:
  - `#7BA05B` (default)
  - `#648748` (dark)
  - `#EAF3E2` (light)
- Warning:
  - `#D8A06B` (default)
  - `#B77E4B` (dark)
  - `#FBF1E8` (light)
- Surfaces/Text:
  - Background `#FAF9F7`
  - Card `#FFFFFF`
  - Surface `#F6F4EF`
  - Surface muted `#F1EEE8`
  - Border `#E8E6E1`
  - Ring `#8A9B5A`
  - Text title `#1F1F1F`
  - Text primary `#2D2D2D`
  - Text secondary `#7A7A7A`
  - Text muted `#95908A`

### Tailwind Token Groups

- `primary`
- `beige`
- `success`
- `warning`
- `app.background`
- `app.card`
- `app.surface`
- `app.surface-muted`
- `app.border`
- `app.ring`
- `app.text.title`
- `app.text.primary`
- `app.text.secondary`
- `app.text.muted`

### UI Shape/Depth Tokens

- Radius:
  - `xl = 1rem`
  - `2xl = 1.25rem`
  - `3xl = 1.5rem`
- Shadows:
  - `soft = 0 8px 26px rgba(45, 45, 45, 0.07)`
  - `card = 0 14px 34px rgba(45, 45, 45, 0.08)`
  - `insetSoft = inset 0 1px 0 rgba(255, 255, 255, 0.65)`

---

## 15) Suggested Prompt Snippet for AI Context

Use this when giving context to another AI:

```text
This is a NestJS + Prisma restaurant system monorepo.
Backend is the source of truth. Read README first for complete API, auth, role guards, schema, and seed credentials.
Use /api base path, JWT auth for staff, and manager-only guards for menu item management.
Do not assume order/invoice APIs exist yet unless explicitly implemented.
Frontend theme tokens are documented in the README under color/tailwind sections.
```

