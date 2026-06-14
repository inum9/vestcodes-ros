## Goal
Customer-facing table ordering page — the primary P0 flow.

## Route
`/table/:tableId?t=<hmac_token>`

## Flow
1. Page loads → calls `GET /api/auth/table/:tableId/verify?t=<token>` to validate the QR
2. If invalid token → show error screen (do not show menu)
3. If valid → fetch menu from `GET /api/menu` and display it
4. Customer can browse by category tab, search by name
5. Add items to cart with +/- quantity controls
6. Cart icon shows item count badge
7. Cart drawer/sidebar: shows items, quantities, subtotal
8. Confirm order → `POST /api/orders` with tableId + token + items
9. Success screen: "Your order has been placed!"

## Rules
- Table number comes from the URL only — customer cannot change it
- No login required for customers
- Cart state lives in component state (cleared after order submitted)

## Acceptance Criteria
- [ ] Invalid/missing token shows error, not menu
- [ ] Menu loads and is browsable by category
- [ ] Order submitted successfully reaches the floor staff interface
- [ ] Customer cannot manipulate table number
