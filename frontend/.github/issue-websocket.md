## Goal
Real-time order state updates via WebSocket broadcast.

## Architecture
- Single `OrdersGateway` using `@nestjs/platform-ws`
- All connected clients in the same restaurant receive broadcasts
- Server writes to PostgreSQL first, then broadcasts — no data loss on crash

## Connection
```
ws://localhost:3000?token=<jwt>
```
- On connect: JWT is validated, client is registered to their restaurant room
- On connect: server sends a snapshot of current open orders
- On disconnect: client shows connectivity banner and auto-reconnects (exponential backoff: 1s → 2s → 4s → max 30s)

## Events emitted by server
| Event | Payload |
|---|---|
| `order_created` | full order object |
| `order_updated` | `{ orderId, status, updatedAt }` |
| `snapshot` | array of all open orders |

## Acceptance Criteria
- [ ] Order approval on floor screen appears on KDS within 2 seconds
- [ ] Kitchen marking ready appears on floor screen within 2 seconds
- [ ] Connectivity banner shown when WebSocket disconnects
