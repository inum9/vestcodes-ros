## Goal
Kitchen Display System (KDS) — 3-column board for kitchen staff.

## Route
`/kitchen` (protected, role: kitchen)

## Layout
Three columns side by side:

| To Do (approved) | In Progress (preparing) | Done (ready) |
|---|---|---|
| Cards with table + items | Cards with table + items | Cards with table + items |

Each card has a single action button:
- **To Do** → `Start Preparing` (approved → preparing)
- **In Progress** → `Mark Ready` (preparing → ready)
- **Done** → read-only, greys out after a short delay once floor marks served

## Rules
- Columns update in real-time via WebSocket — no page reload
- Audio chime on new card arriving in To Do column (can be muted from header)
- Connectivity warning banner if WebSocket disconnects

## Acceptance Criteria
- [ ] New approved order appears in To Do within 2 seconds
- [ ] Moving to In Progress / Ready works with one tap
- [ ] Mute toggle persists across page refresh (localStorage)
- [ ] Disconnection banner shown and auto-reconnect works
