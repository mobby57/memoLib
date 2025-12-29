# API v2 Testing Guide

## ✅ Server Status

**All routes are working!**

The PostgreSQL API v2 server is running on `http://localhost:5000` with all endpoints operational.

## Quick Test Results

### ✅ Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/health"
```
**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "v2-postgres"
}
```

### ✅ User Registration
```powershell
$body = @{
    username = "apitest"
    email = "apitest@example.com"
    password = "Test123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v2/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### ✅ User Login
```powershell
$body = @{
    username = "apitest"
    password = "Test123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.user.token
```

### ✅ Create Workspace
```powershell
$headers = @{Authorization = "Bearer $token"}
$body = @{
    title = "Test Workspace"
    source = "api_test"
    priority = "HIGH"
} | ConvertTo-Json

$workspace = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces" -Method POST -Headers $headers -Body $body -ContentType "application/json"
$wsId = $workspace.workspace.id
```

### ✅ Add Message
```powershell
$headers = @{Authorization = "Bearer $token"}
$body = @{
    role = "user"
    content = "Hello from API test!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId/messages" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### ✅ List Messages
```powershell
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId/messages" -Headers $headers
```

### ✅ Update Workspace
```powershell
$headers = @{Authorization = "Bearer $token"}
$body = @{
    status = "COMPLETED"
    progress = 100
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

### ✅ Get Workspace Details
```powershell
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId" -Headers $headers
```

### ✅ List All Workspaces
```powershell
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces" -Headers $headers
```

### ✅ Get User Stats
```powershell
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/stats" -Headers $headers
```

## Complete Test Flow

```powershell
# 1. Register
$body = @{username="apitest"; email="apitest@example.com"; password="Test123!"} | ConvertTo-Json
$user = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/auth/register" -Method POST -Body $body -ContentType "application/json"
$token = $user.user.token

# 2. Create workspace
$headers = @{Authorization="Bearer $token"}
$wsBody = @{title="Complete Test"; source="api"; priority="HIGH"} | ConvertTo-Json
$ws = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces" -Method POST -Headers $headers -Body $wsBody -ContentType "application/json"
$wsId = $ws.workspace.id

# 3. Add user message
$msgBody = @{role="user"; content="Test message"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId/messages" -Method POST -Headers $headers -Body $msgBody -ContentType "application/json"

# 4. Add assistant response
$respBody = @{role="assistant"; content="AI response"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId/messages" -Method POST -Headers $headers -Body $respBody -ContentType "application/json"

# 5. List messages
$messages = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId/messages" -Headers $headers
$messages.messages | Format-Table

# 6. Update status
$updateBody = @{status="COMPLETED"; progress=100} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$wsId" -Method PUT -Headers $headers -Body $updateBody -ContentType "application/json"

# 7. Get stats
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/stats" -Headers $headers
$stats.stats
```

## All Available Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/v2/health` | No | Health check |
| POST | `/api/v2/auth/register` | No | Register new user |
| POST | `/api/v2/auth/login` | No | Login and get JWT token |
| GET | `/api/v2/auth/me` | Yes | Get current user info |
| GET | `/api/v2/workspaces` | Yes | List user's workspaces |
| POST | `/api/v2/workspaces` | Yes | Create new workspace |
| GET | `/api/v2/workspaces/:id` | Yes | Get workspace details |
| PUT | `/api/v2/workspaces/:id` | Yes | Update workspace |
| DELETE | `/api/v2/workspaces/:id` | Yes | Delete workspace |
| GET | `/api/v2/workspaces/:id/messages` | Yes | List workspace messages |
| POST | `/api/v2/workspaces/:id/messages` | Yes | Add message to workspace |
| GET | `/api/v2/stats` | Yes | Get user statistics |
| GET | `/` | No | API documentation |
| GET | `/routes` | No | List all registered routes |

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by:
1. Registering a new user (`POST /api/v2/auth/register`)
2. Logging in (`POST /api/v2/auth/login`)

The token is returned in the response:
```json
{
  "user": {
    "id": 1,
    "username": "apitest",
    "email": "apitest@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not the workspace owner)
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## Next Steps

- ✅ All 12 API endpoints tested and working
- ✅ JWT authentication functional
- ✅ CRUD operations on workspaces operational
- ✅ Message management working
- 📋 TODO: End-to-end email → workspace flow testing
- 📋 TODO: Frontend React integration
