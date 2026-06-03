# Menu Management

## Introduction

Menu management handles creating, organizing, and maintaining the dishes offered for sale — categories, pricing, descriptions, and availability.

## Data Model

```mermaid
erDiagram
    menu_categories ||--o{ menu_items : contains
    menu_items ||--o{ menu_specials : "has"
    menu_items ||--o{ order_items : "referenced in"

    menu_categories {
        int id PK
        string name
        int sort_order
        bool available
    }

    menu_items {
        int id PK
        string name
        string description
        real price
        int category_id FK
        string image
        int prep_time_minutes
        bool available
        string ingredients_list
    }

    menu_specials {
        int id PK
        int menu_item_id FK
        string day_of_week
        real special_price
        bool active
    }
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/menu/categories` | List all categories |
| `POST` | `/api/menu/categories` | Create category |
| `PATCH` | `/api/menu/categories/:id` | Update category |
| `DELETE` | `/api/menu/categories/:id` | Delete category |
| `GET` | `/api/menu/items` | List items (filterable by category) |
| `POST` | `/api/menu/items` | Create menu item |
| `PATCH` | `/api/menu/items/:id` | Update menu item |
| `DELETE` | `/api/menu/items/:id` | Archive item |
| `GET` | `/api/menu/specials` | List daily specials |
| `POST` | `/api/menu/specials` | Set a special |

## Category Management

Categories organize dishes for easier browsing. Examples:

- Mains
- Sides
- Beverages
- Desserts
- Weekly Specials

## Pricing Strategy

The system uses a base price per menu item. Daily specials override the base price with a `special_price` on specific days. This allows:

- **Mogodu Wednesday** — tripe special every Wednesday
- **Umleqwa Friday** — hardbody chicken every Friday
- **Sunday Kos** — full meal deal on Sundays

## Admin Features

1. **Menu editor** — CRUD for categories and items
2. **Image upload** — Attach photos to menu items
3. **Availability toggle** — Quick enable/disable items
4. **Daily specials** — Set day-specific pricing
5. **Reorder categories** — Drag-and-drop sorting

---

*Last updated: June 2026*
