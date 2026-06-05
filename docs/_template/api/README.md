# API Reference

Base URL: `https://api.example.com`

## Authentication

Describe auth mechanism (token, cookie, etc.).

| Header / Cookie | Description |
|---|---|
| `Authorization: Bearer <token>` | API auth |
| `admin_token=<token>` | SSR admin auth |

## Endpoints

### Health

```
GET /api/health
```

Response: `{"status": "ok", "service": "..."}`

### Resource

```
GET /api/resource
```

| Query param | Type | Description |
|---|---|---|

```
POST /api/resource
```

| Body field | Type | Required | Description |
|---|---|---|---|

## Error Format

```json
{"error": "message"}
```
