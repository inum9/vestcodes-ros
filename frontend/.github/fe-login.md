## Goal
Login page for staff (manager, floor, kitchen). Redirects to the correct screen based on role after login.

## Route
`/login`

## Behaviour
- Form: email + password
- On success: store JWT in localStorage, redirect based on role:
  - `manager` → `/manager`
  - `floor` → `/floor`
  - `kitchen` → `/kitchen`
- On failure: show inline error message
- If already logged in, redirect immediately (no flicker)

## Acceptance Criteria
- [ ] Login works for all three roles
- [ ] Wrong credentials shows error without crashing
- [ ] Token stored and used for all subsequent API calls
