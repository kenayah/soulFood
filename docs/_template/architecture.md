# Architecture

## System Diagram

```mermaid
graph TB
    subgraph "Cloud Provider"
        API["API Worker"]
        DB[("Database")]
        API --- DB
    end

    subgraph "Hosting"
        SITE["Static Site"]
    end

    C["Customer"] --> SITE
    C --> API
    A["Admin"] --> API
```

## Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | — | — |
| Database | — | — |
| Frontend | — | — |
| Hosting | — | — |
| Auth | — | — |

## Data Flow

Describe how requests flow through the system.
