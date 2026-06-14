## Goal
Manager dashboard — KPIs, charts, and quick navigation to all management sections.

## Route
`/manager` (protected, role: manager)

## Sections

### Dashboard (default view)
- Total revenue today
- Total orders today
- Order volume chart by time of day (Morning / Afternoon / Evening / Night)
- Top 6 items by quantity sold (bar chart)
- Data sourced from `served` orders only
- Auto-refreshes every 30 seconds

### Menu Management (`/manager/menu`)
- Table of all items (name, category, price, available toggle)
- Search by name or category
- Add new item form (name, description, category, price)
- Edit inline or in a modal
- Toggle availability with one click

### QR Codes (`/manager/qr`)
- Grid of all tables with their QR code preview
- Download individual QR as PNG
- Search by table number

### Orders (`/manager/orders`)
- Full orders list with search by Order ID or Table
- Sorted by date descending
- Status badge on each row

### Billing (`/manager/billing`)
- Invoice list: ID, date, table, subtotal, GST, total
- Search by Order ID or table number
- Export all to XLSX button

### Users (`/manager/users`)
- Staff list with role badges
- Add user form (email + role)
- Remove user button

## Acceptance Criteria
- [ ] Dashboard KPIs match database totals
- [ ] Menu toggle updates customer page immediately
- [ ] QR PNG downloads with correct encoded URL
- [ ] XLSX export downloads with correct data
