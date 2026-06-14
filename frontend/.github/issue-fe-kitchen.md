## Goal
Kitchen Display System (KDS) — three-column board for kitchen staff.

## Route
`/kitchen` (requires JWT, role: kitchen)

## Layout
Three columns side by side:
| Approved | Preparing | Ready to Serve |
|---|---|---|
| Tap to start | Tap when done | Notifies floor |

## Behaviour
- `Approved` column: orders with status `approved`
- `Preparing` column: orders with status `preparing`
- `Ready to Serve` column: orders with status `ready`
- Moving a card from **Approved → Preparing**: calls `PATCH /api/orders/:id/advance`
- Moving a card from **Preparing → Ready**: calls `PATCH /api/orders/:id/advance` again
- All columns update in real-time via WebSocket
- Audio chime plays when a new order enters the Approved column
- Chime can be muted from a toggle in the KDS header

## Card Info
Each card shows: table number, items + quantities, time since approved

## Acceptance Criteria
- [ ] Three columns render with correct orders
- [ ] Advancing an order moves it to the next column in real-time
- [ ] Audio chime fires on new approved order
- [ ] Connectivity banner shown on WebSocket disconnect
