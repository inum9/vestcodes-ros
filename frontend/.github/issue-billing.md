## Goal
Billing module — auto-generate invoices when an order is served, and export to XLSX.

## Endpoints
- `GET /api/billing` — manager only, list all invoices (sortable, searchable)
- `GET /api/billing/:id` — manager only, single invoice detail
- `GET /api/billing/export` — manager only, download full invoice list as `.xlsx`

## Invoice Auto-creation
When an order reaches `served` status, the Orders service automatically creates an `Invoice` record:
- `subtotal` = order total before GST
- `gstAmount` = subtotal × restaurant.gstRate
- `total` = subtotal + gstAmount

## XLSX Export Columns
`Invoice ID | Date | Table | Items | Subtotal | GST | Total`

## Rules
- Only `served` orders have invoices
- Export covers full dataset, not just the current search/filter
- Uses `SheetJS` (xlsx) for XLSX generation

## Acceptance Criteria
- [ ] Invoice is created automatically on order serve
- [ ] GST is calculated using the restaurant's configured rate
- [ ] XLSX downloads with correct columns and data
