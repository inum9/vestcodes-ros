## Goal
Floor staff interface — incoming orders and ready-for-delivery queue.

## Route
`/floor` (protected, role: floor)

## Layout
Two sections on the same screen:

**Section 1 — Incoming Orders (status: pending)**
- Each card shows: table number, items list, time received
- Two buttons: `Approve` → PATCH approve, `Reject` → PATCH reject
- Updates in real-time via WebSocket

**Section 2 — Ready for Delivery (status: ready)**
- Each card shows: table number, items, time since ready
- One button: `Mark Served` → PATCH serve
- Updates in real-time via WebSocket

## Rules
- New order cards appear at the top without page reload
- Audio/visual alert on new incoming order (browser notification)
- Empty states shown when no orders in each section

## Acceptance Criteria
- [ ] Approve moves order off the pending list and onto KDS within 2 seconds
- [ ] Ready orders appear without manual refresh
- [ ] Marking served removes card and triggers invoice creation
