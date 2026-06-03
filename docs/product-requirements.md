# Product Requirements

## Overview

SoulFood is a software system for managing a small-to-medium online takeaway and catering business. It replaces manual processes (phone orders, paper notes, spreadsheets) with a digital workflow.

## Target Users

| User | Needs | Tech literacy |
|---|---|---|
| **Operator** | See new orders, update status, notify customers | Basic (cellphone) |
| **Kitchen** | See what to cook, mark dishes ready | Basic (tablet) |
| **Manager/Owner** | Reports, stock oversight, menu pricing | Basic |
| **Customer** | Browse menu, place order, pay, track status | Varies |

## Functional Requirements

### Must Have (v1)

| Requirement | Priority | Feature |
|---|---|---|
| Customer can browse menu | P0 | Public site (Hugo) |
| Customer can place order | P0 | API: `POST /api/orders` |
| Operator receives order notification | P0 | Notifications: polling |
| Operator can update order status | P0 | Dashboard: status buttons |
| Customer can track order status | P0 | Order status page |
| Admin can manage menu items | P0 | Dashboard: menu editor |
| Daily revenue report | P0 | Reporting: daily |
| Stock level tracking | P1 | Stock: CRUD ingredients |
| Stock reorder alerts | P1 | Stock: min level check |
| Menu categories | P1 | Menu: categories |

### Should Have (v2)

| Requirement | Priority | Feature |
|---|---|---|
| Weekly and monthly reports | P1 | Reporting: weekly/monthly |
| Purchase order management | P1 | Stock: POs |
| Supplier management | P1 | Stock: suppliers |
| Menu specials by day of week | P1 | Menu: specials pricing |
| Payment integration (Yoco/PayFast) | P1 | Payments: provider |
| Cash on delivery support | P1 | Payments: cash |
| Order cancellation flow | P1 | Orders: cancel + refund |

### Nice to Have (v3)

| Requirement | Priority | Feature |
|---|---|---|
| WebSocket real-time updates | P2 | Notifications: DO |
| Image upload for menu | P2 | Menu: images |
| Customer accounts / auth | P2 | Auth |
| Delivery address geocoding | P2 | Orders |
| Multi-tenant (multiple kitchens) | P2 | Architecture |
| SMS notifications | P2 | Notifications: SMS |
| Inventory deduction on order | P2 | Stock: auto-deduct |
| Export reports to CSV/PDF | P2 | Reporting: export |

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load (public site) | < 1s |
| API response time | < 200ms (p50) |
| Order placement | < 3s end-to-end |
| Availability | 99.9% (Cloudflare SLA) |
| Data durability | D1 automatic backups |
| Admin auth | Simple token, no user mgmt (v1) |

## Constraints

- Single kitchen / single location (v1)
- South African market (ZAR currency, local payment providers)
- Staff access via cellphone browser
- Zero monthly infra cost at low volume (Cloudflare + GitHub Pages free tier)

## Out of Scope (v1)

- Customer accounts / login
- Multi-language support
- Mobile app (native)
- POS / in-person payments
- Delivery fleet management
- Recipe cost calculations (manual COGS)

---

*Last updated: June 2026*
