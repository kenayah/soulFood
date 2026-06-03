# Business Processes

SoulFood's operations follow a five-step workflow that starts with planning and ends with delivery. Each step maps to specific app features and database tables.

## Process Flow

```mermaid
flowchart TB
    subgraph "Planning & Sourcing"
        P1["Making Provision<br/>Forecast demand, plan menus"] --> P2["Buying Ingredients<br/>Procure from suppliers"]
    end

    subgraph "Fulfillment"
        P2 --> P3["Receiving Payment<br/>Verify & capture"]
        P3 --> P4["Preparing Dishes<br/>Cook, portion, package"]
        P4 --> P5["Selling Dishes<br/>Deliver, complete"]
    end

    P1 -.-> S["Stock Module"]
    P2 -.-> S
    P3 -.-> PAY["Payment Module"]
    P4 -.-> O["Order Module"]
    P5 -.-> O

    style S fill:#eef,stroke:#66f,color:#000
    style PAY fill:#eef,stroke:#66f,color:#000
    style O fill:#eef,stroke:#66f,color:#000
```

## Process Details

| # | Process | App Module | Key Tables | Owner |
|---|---|---|---|---|
| 1 | [Making Provision](01-provisioning.md) | `features/stock/` | `ingredients`, `suppliers` | Manager |
| 2 | [Buying Ingredients](01-provisioning.md) | `features/stock/` | `purchase_orders`, `purchase_order_items` | Manager |
| 3 | [Receiving Payment](02-payment.md) | `features/payments/` | `transactions`, `orders` | System / Customer |
| 4 | [Preparing Dishes](03-preparation.md) | `features/orders/` | `orders`, `order_status_log` | Kitchen |
| 5 | [Selling Dishes](04-order-fulfillment.md) | `features/orders/` | `orders`, `order_items` | Operator |

## Order Lifecycle (End-to-End)

```mermaid
stateDiagram-v2
    [*] --> Placed: Customer submits order
    Placed --> Confirmed: Operator acknowledges
    Placed --> Cancelled: Customer cancels (pre-payment)
    Confirmed --> Preparing: Payment verified / Kitchen starts
    Preparing --> Ready: Cooking & packaging complete
    Ready --> OutForDelivery: Driver dispatched
    Ready --> PickedUp: Customer collects
    OutForDelivery --> Delivered: Customer receives
    PickedUp --> Delivered
    Delivered --> [*]
    Cancelled --> [*]
```

---

*Last updated: June 2026*
