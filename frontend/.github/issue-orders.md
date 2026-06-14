## Goal
Implement the full order lifecycle API with a strict status state machine.

## Status Flow
```
pending → approved → preparing → ready → served
pending → rejected
```

## Endpoints
- `POST /api/orders` — public (customer), requires valid table token (`?t=`)
- `GET /api/orders` — floor + manager, filterable by status
- `GET /api/orders/:id` — floor + manager
- `PATCH /api/orders/:id/approve` — floor only
- `PATCH /api/orders/:id/reject` — floor only
- `PATCH /api/orders/:id/advance` — kitchen only (approved → preparing → ready)
- `PATCH /api/orders/:id/serve` — floor only (ready → served), triggers invoice creation

## Rules
- Table token must be verified before a customer can place an order
- Illegal status transitions (e.g. pending→ready) must return 400
- Every status change is written to `audit_log` before the WebSocket broadcast
- Order total is calculated server-side from menu item prices × quantities

## Acceptance Criteria
- [ ] Customer cannot place order with forged table token
- [ ] State machine rejects invalid transitions
- [ ] Each transition writes to audit_log
- [ ] Invoice is auto-created when status reaches `served`
