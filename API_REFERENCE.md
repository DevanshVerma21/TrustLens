# TrustLens Backend - Complete API Reference

> Production-ready API with authentication, real-time alerts, and explainable AI

---

## 📋 API Overview

**Base URL**: `http://localhost:5000/api`  
**Response Format**: `{ success: boolean, data: object, error?: string }`

---

## 🔐 Authentication Routes

### POST `/auth/register`
Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "trustScore": 50
    },
    "accessToken": "eyJhbGc..."
  }
}
```

**Errors:**
- `400` - Missing required fields or invalid email
- `409` - Email already registered

---

### POST `/auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "trustScore": 85
    },
    "accessToken": "eyJhbGc..."
  }
}
```

**Headers:** Sets `refreshToken` in httpOnly cookie

**Errors:**
- `401` - Invalid credentials
- `429` - Too many login attempts

---

### POST `/auth/refresh`
Get new access token using refresh token cookie.

**Request:** (No body needed, uses httpOnly cookie)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

**Errors:**
- `401` - No refresh token or user not found
- `403` - Invalid refresh token

---

### POST `/auth/logout`
Clear refresh token and logout user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### GET `/auth/me`
Get current authenticated user details.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "trustScore": 85,
      "accountStatus": "active",
      "riskLevel": "low"
    }
  }
}
```

**Errors:**
- `401` - No token or token expired
- `404` - User not found

---

## 💳 Transaction Routes

### POST `/transactions`
Submit a new transaction for fraud detection and analysis.

**Request:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "amount": 150.50,
  "location": "New York, NY",
  "deviceId": "device_abc123",
  "deviceName": "iPhone 14",
  "category": "shopping"
}
```

**Response (200):**
```json
{
  "transaction": "507f1f77bcf86cd799439012",
  "decision": "APPROVE",
  "riskLevel": "low",
  "trustLevel": "high",
  "fraudScore": 0.15,
  "confidence": 0.92,
  "systemMessage": "Transaction approved. No fraud indicators detected.",
  "status": "completed",
  "isFlagged": false,
  "summary": "Low-risk transaction from trusted device...",
  "explanations": [
    "Amount is within typical range",
    "Device is recognized",
    "Location is consistent with history"
  ],
  "trustScore": 85,
  "canAppeal": false
}
```

**Errors:**
- `400` - Missing required fields
- `404` - User not found
- `429` - Too many transactions (rate limited)

---

### GET `/transactions/user/:userId`
Get paginated transaction history.

**Query Parameters:**
- `limit` (default: 20) - Items per page
- `offset` (default: 0) - Skip N items
- `status` - Filter by status (normal, suspicious, flagged, blocked)
- `category` - Filter by category

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "507f1f77bcf86cd799439011",
        "amount": 150.50,
        "merchant": "Amazon",
        "category": "shopping",
        "type": "debit",
        "status": "normal",
        "location": "New York, NY",
        "timestamp": "2024-04-20T10:30:00Z",
        "fraudScore": 0.15,
        "isFlagged": false,
        "explanation": "Normal transaction pattern",
        "trustScoreDelta": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### GET `/transactions/:id`
Get single transaction with full explanation.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "amount": 150.50,
      "merchant": "Amazon",
      "category": "shopping",
      "type": "debit",
      "status": "normal",
      "location": "New York, NY",
      "timestamp": "2024-04-20T10:30:00Z",
      "fraudScore": 0.15,
      "isFlagged": false,
      "explanation": "Normal transaction pattern matched against 45 similar transactions",
      "riskFactors": [
        {
          "factor": "Amount Anomaly",
          "weight": 0.1,
          "description": "Amount is 5% below average"
        },
        {
          "factor": "Device Recognition",
          "weight": 0.05,
          "description": "Device is known and trusted"
        }
      ],
      "trustScoreDelta": 0
    }
  }
}
```

---

### GET `/transactions/stats/:userId`
Get transaction statistics and summary.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalTransactions": 45,
      "totalSpent": 5234.50,
      "averageTransaction": 116.32,
      "highestTransaction": 500.00,
      "flaggedCount": 2,
      "categoryBreakdown": {
        "shopping": 20,
        "dining": 15,
        "utilities": 10
      },
      "riskBreakdown": {
        "low": 42,
        "medium": 2,
        "high": 1
      }
    }
  }
}
```

---

## 🛡️ Trust Routes (Protected)

### GET `/trust/score`
Get current trust score and breakdown by factor.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trustScore": 85,
    "riskLevel": "low",
    "factors": [
      {
        "name": "Recent Activity",
        "weight": 25,
        "description": "45 transactions in last 90 days"
      },
      {
        "name": "Account Age",
        "weight": 15,
        "description": "Account created on 2024-01-15"
      },
      {
        "name": "Account Status",
        "weight": 10,
        "description": "Status: active"
      }
    ],
    "lastUpdated": "2024-04-20T10:45:00Z"
  }
}
```

---

### GET `/trust/history`
Get trust score history for the last 30 days.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "date": "2024-04-01T00:00:00Z",
        "score": 80,
        "reason": "Initial score"
      },
      {
        "date": "2024-04-10T14:30:00Z",
        "score": 82,
        "reason": "Successful transactions, no flags"
      },
      {
        "date": "2024-04-20T10:45:00Z",
        "score": 85,
        "reason": "Continued good behavior"
      }
    ]
  }
}
```

---

### GET `/trust/factors`
Get detailed factors affecting trust score.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "factors": [
      {
        "name": "Fraud Risk",
        "weight": -6,
        "impact": "negative",
        "description": "Avg fraud score: 15%"
      },
      {
        "name": "Flagged Transactions",
        "weight": 0,
        "impact": "neutral",
        "description": "0 flagged transaction(s)"
      },
      {
        "name": "Account Consistency",
        "weight": 10,
        "impact": "positive",
        "description": "Consistent device and location usage"
      },
      {
        "name": "Account Status",
        "weight": 8,
        "impact": "positive",
        "description": "Account is active"
      }
    ],
    "summary": {
      "currentScore": 85,
      "riskLevel": "low",
      "improvementTips": [
        "Use consistent devices for transactions",
        "Maintain regular transaction patterns",
        "Avoid unusual locations and amounts"
      ]
    }
  }
}
```

---

## 🚨 Alerts Routes (Protected)

### GET `/alerts`
Get all alerts for the user (unread first).

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `read` (optional: "true" or "false" to filter)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439011",
        "type": "fraud",
        "severity": "high",
        "message": "Unusual transaction detected from New Location",
        "isRead": false,
        "metadata": {
          "transactionId": "507f1f77bcf86cd799439012",
          "amount": 500.00,
          "location": "Las Vegas, NV"
        },
        "createdAt": "2024-04-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### GET `/alerts/unread/count`
Get count of unread alerts.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 2
  }
}
```

---

### PUT `/alerts/:id/read`
Mark a specific alert as read.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "alert": {
      "_id": "507f1f77bcf86cd799439013",
      "isRead": true
    }
  }
}
```

---

### PUT `/alerts/mark-all-read`
Mark all unread alerts as read.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "3 alerts marked as read",
    "modifiedCount": 3
  }
}
```

---

### DELETE `/alerts/clear-read`
Delete all read alerts.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "5 read alerts cleared",
    "deletedCount": 5
  }
}
```

---

### DELETE `/alerts/:id`
Delete a specific alert.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Alert deleted"
  }
}
```

---

## 🏥 System Routes

### GET `/health`
Health check endpoint.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-04-20T10:45:30Z",
  "mongodb": "connected"
}
```

---

## 🔌 WebSocket Events

### Client → Server

**`userConnected`**
```javascript
socket.emit('userConnected', userId);
```

**`transactionAlert`**
```javascript
socket.emit('transactionAlert', {
  userId: '507f1f77bcf86cd799439011',
  type: 'fraud',
  summary: 'High-risk transaction detected',
  fraudScore: 0.85
});
```

### Server → Client

**`fraudDetected`**
```javascript
socket.on('fraudDetected', (data) => {
  // data: { userId, type, summary, fraudScore }
});
```

**`trustScoreUpdated`**
```javascript
socket.on('trustScoreUpdated', (data) => {
  // data: { userId, newScore, reason }
});
```

**`alertGenerated`**
```javascript
socket.on('alertGenerated', (alert) => {
  // alert: { id, type, severity, message, metadata }
});
```

---

## 📊 Error Responses

All errors return a JSON response with `success: false`:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (invalid permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🔑 Authentication

All protected routes require:
```
Authorization: Bearer <accessToken>
```

**Token Lifespan:**
- Access Token: 15 minutes
- Refresh Token: 7 days (httpOnly cookie)

**Getting New Access Token:**
```bash
POST /api/auth/refresh
# Uses httpOnly cookie automatically
```

---

## 📝 Example Usage

### Register & Login Flow
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }' \
  -c cookies.txt

# 3. Get Current User
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Refresh Token
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

### Transaction Flow
```bash
# 1. Submit Transaction
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "amount": 150.50,
    "location": "New York, NY",
    "deviceId": "device_abc123",
    "deviceName": "iPhone 14",
    "category": "shopping"
  }'

# 2. Get Transactions
curl -X GET "http://localhost:5000/api/transactions/user/507f1f77bcf86cd799439011?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Get Trust Score
curl -X GET http://localhost:5000/api/trust/score \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Get Alerts
curl -X GET http://localhost:5000/api/alerts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Status**: ✅ Complete and Production-Ready  
**Last Updated**: April 2024
