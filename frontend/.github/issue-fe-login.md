## Goal
Login page for floor staff, kitchen staff, and managers.

## Route
`/login`

## Behaviour
- Single form: email + password
- On success: store JWT in `localStorage`, redirect based on role:
  - `manager` → `/manager`
  - `floor` → `/floor`
  - `kitchen` → `/kitchen`
- On failure: show inline error message
- If already logged in (valid token in storage), redirect to the correct role page automatically

## UI
- Clean centered card
- ROS logo / name at top
- Email + password fields
- Submit button with loading state

## Acceptance Criteria
- [ ] Login redirects to correct role page
- [ ] Invalid credentials shows error without page reload
- [ ] Already-logged-in users are redirected on page load
