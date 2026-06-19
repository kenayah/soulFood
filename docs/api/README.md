# API Reference

## Base URL

| Environment | URL |
|---|---|
| Local | `http://localhost:8787` |
| Production | `https://api.soulfood.example.com` |

## Authentication

Admin endpoints require an `Authorization` header:

```
Authorization: Bearer <ADMIN_TOKEN>
```

The `ADMIN_TOKEN` is set as an environment variable in the Cloudflare Worker.

## Order Endpoints

### Create Order

Automatically upserts a customer record by phone number. Existing customers get their name/address/notes updated and their `total_orders` incremented.

```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "Thandi",
  "phone": "0712345678",
  "deliveryAddress": "123 Main St, Soweto",
  "notes": "Extra chakalaka please",
  "paymentMethod": "cash",
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2,
      "itemName": "Mogodu Wednesday (Creamy Samp)"
    }
  ]
}
```

The optional `itemName` field carries the item name with the customer's starch choice appended (e.g. "Mogodu Wednesday (Creamy Samp)"). When present, the API uses this as the display name; otherwise it resolves the name from the DB.

**Response:** `201 Created`

```json
{
  "id": 42,
  "customer_id": 7,
  "customer_name": "Thandi",
  "phone": "0712345678",
  "status": "placed",
  "total": 180.00
}
```

### List Orders

```http
GET /api/orders?status=placed&page=1&limit=20
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "orders": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### Get Order

```http
GET /api/orders/42
```

**Response:** `200 OK`

```json
{
  "id": 42,
  "customerName": "Thandi",
  "phone": "0712345678",
  "status": "placed",
  "items": [ ... ],
  "statusLog": [ ... ],
  "total": 180.00
}
```

### Update Order Status

```http
PATCH /api/orders/42/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Response:** `200 OK`

### Cancel Order

```http
DELETE /api/orders/42
Authorization: Bearer <token>
```

**Response:** `200 OK`

## Public Endpoints

### Get Menu (Public — no auth)

Returns all available categories with their items. Items with a price of `0` (e.g. "Market Price") are excluded. Used by the Hugo storefront to render the menu dynamically.

```http
GET /api/public/menu
```

**Response:** `200 OK`

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Main Course",
      "sortOrder": 1,
      "items": [
        {
          "id": 1,
          "name": "Mogodu Wednesday",
          "description": "Deliciously slow cooked tripe...",
          "price": 90,
          "starch": "Creamy Samp or Steamed Bread",
          "prepTimeMinutes": 30
        }
      ]
    }
  ]
}
```

### Create Order (Public — no auth)

Same as the admin `POST /api/orders`. Customer records are upserted by phone number automatically. The frontend may send an `itemName` with the starch choice appended (e.g. "Mogodu Wednesday (Creamy Samp)") rather than the bare menu item name.

`paymentMethod` accepts `"card"` or `"cash"`. Cash on delivery is restricted to customers with more than 3 previous orders (returns `403` otherwise).

```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "Thandi",
  "phone": "0712345678",
  "deliveryAddress": "123 Main St, Soweto",
  "notes": "Extra chakalaka please",
  "paymentMethod": "cash",
  "items": [
    { "menuItemId": 1, "quantity": 2, "itemName": "Mogodu Wednesday (Creamy Samp)" }
  ]
}
```

**Response (cash):** `201 Created`

```json
{
  "id": 42,
  "customer_name": "Thandi",
  "phone": "0712345678",
  "status": "placed",
  "total": 180.00
}
```

**Response (card):** `201 Created` — includes `redirectUrl` for Yoco Checkout

```json
{
  "id": 42,
  "customer_name": "Thandi",
  "phone": "0712345678",
  "status": "placed",
  "total": 180.00,
  "redirectUrl": "https://pay.yoco.com/checkout_abc123"
}
```

**Error (cash not eligible):** `403 Forbidden`

```json
{
  "error": {
    "code": "CASH_NOT_ELIGIBLE",
    "message": "Cash on delivery is available for customers with more than 3 orders. Please pay with card for this order."
  }
}
```

## Webhook Endpoints

### Yoco Payment Notification (Public — no auth)

Yoco sends a POST to this endpoint after a payment is completed or fails. The handler updates the transaction and order statuses accordingly.

```http
POST /api/webhook/yoco
Content-Type: application/json

{
  "id": "checkout_abc123",
  "status": "completed",
  "metadata": {
    "orderId": "42"
  }
}
```

**Response:** `200 OK`

## Menu Endpoints

All menu admin endpoints require authentication.

### List Categories

```http
GET /api/menu/categories
```

### List Menu Items

```http
GET /api/menu/items?categoryId=1
```

### Create Menu Item (Admin)

```http
POST /api/menu/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mogodu Wednesday",
  "description": "Slow-cooked tripe with butternut and creamy spinach",
  "price": 90.00,
  "categoryId": 1,
  "prepTimeMinutes": 30,
  "image": "https://images.example.com/mogodu.jpg",
  "starch": "Creamy Samp or Steamed Bread",
  "available": true
}
```

## Stock Endpoints

### List Ingredients

```http
GET /api/stock/ingredients?belowMin=true
Authorization: Bearer <token>
```

### Get Ingredient by ID

```http
GET /api/stock/ingredients/5
Authorization: Bearer <token>
```

### Adjust Stock

```http
PATCH /api/stock/ingredients/5/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "adjustment": -2,
  "reason": "order_fulfillment"
}
```

### Stock Movement History

```http
GET /api/stock/ingredients/5/history
Authorization: Bearer <token>
```

## Report Endpoints

### Daily Report

```http
GET /api/reports/daily?date=2026-06-01
Authorization: Bearer <token>
```

### Dashboard Summary

```http
GET /api/reports/dashboard
Authorization: Bearer <token>
```

## Notification Endpoints

### Poll for Notifications

```http
GET /api/notifications?since=100
Authorization: Bearer <token>
```

### Acknowledge Notifications

```http
POST /api/notifications/ack
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [101, 102, 103]
}
```

---

*Last updated: June 2026*
