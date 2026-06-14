## Goal
Staff user management — managers can add/edit/remove staff accounts.

## Endpoints
- `GET /api/users` — manager only, list all staff in the restaurant
- `POST /api/users` — manager only, create a new staff account
- `PATCH /api/users/:id` — manager only, update role or email
- `DELETE /api/users/:id` — manager only, remove a staff account

## Rules
- Managers can only manage users within their own `restaurantId`
- A manager cannot delete their own account
- Role changes take effect on next login (JWT is not invalidated immediately in v0.9)
- Password is set by the user on first login via email invite (v1.0 — for now seed with a default)

## Acceptance Criteria
- [ ] Manager can create kitchen and floor accounts
- [ ] Manager cannot manage users from another restaurant
- [ ] Deleting own account returns 400
