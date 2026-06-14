## Goal
Customer-facing ordering page. Loaded by scanning a QR code — no login required.

## Route
`/table/:tableId?t=<token>`

## Behaviour
1. On load: call `GET /api/auth/table/:tableId/verify?t=<token>` — show error if invalid
2. Fetch menu: `GET /api/menu`
3. Display items grouped by category with name, description, price
4. `+` / `-` buttons to add/remove items from cart
5. Floating cart button shows item count
6. Cart drawer/modal: review items, quantities, subtotal
7. Confirm Order → `POST /api/orders` with tableId + token + items
8. After submit: show confirmation screen with order ID

## Rules
- Table number shown in header (read from token verify response)
- Customer cannot change the table — it is locked to the QR token
- If a pending/approved order already exists for the table, show a warning

## Acceptance Criteria
- [ ] Invalid/missing token shows a clear error, not a blank page
- [ ] Menu grouped by category
- [ ] Cart persists across page (localStorage or state)
- [ ] Order submitted and confirmation shown
