## Goal
Floor staff interface — approve/reject incoming orders and mark orders served.

## Route
`/floor` (requires JWT, role: floor or manager)

## Sections
### Incoming Orders
- Live list of orders with status `pending`
- Each card shows: table number, items list, time received
- Two buttons: **Approve** and **Reject**
- Updates in real-time via WebSocket (`order_created`, `order_updated` events)

### Ready for Delivery
- Live list of orders with status `ready`
- Each card shows: table number, items list
- One button: **Mark Served**

## Rules
- Approving an order sends `PATCH /api/orders/:id/approve`
- Rejecting sends `PATCH /api/orders/:id/reject`
- Marking served sends `PATCH /api/orders/:id/serve`
- New orders trigger a browser notification (if permission granted)
- Connectivity banner shown when WebSocket is disconnected

## Acceptance Criteria
- [ ] New order appears within 2 seconds of being placed
- [ ] Approve/reject removes card from Incoming section
- [ ] Ready orders appear in Ready for Delivery within 2 seconds of kitchen action
- [ ] Mark Served removes order from the screen
