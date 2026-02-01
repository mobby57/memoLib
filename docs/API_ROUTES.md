# 🔌 MemoLib API Routes Documentation

**Last Updated**: 01/02/2026 | **Status**: ✅ Complete

---

## 📋 Overview

This document catalogs all Flask backend API endpoints for MemoLib, a legal case management platform specializing in CESEDA (immigration law) predictions and deadline management.

**Base URL** (Development): `http://localhost:5000`
**Base URL** (Production): `https://api.memolib.fr`

---

## ✨ Health & System Endpoints

### GET / - Root Health Check

Returns basic health status and feature list.

```bash
curl http://localhost:5000/
```

**Response** (200 OK):

```json
{
  "status": "OK",
  "service": "MemoLib Backend",
  "version": "1.0.0",
  "timestamp": "2026-02-01T17:58:19.164104",
  "features": [
    "CESEDA AI predictions",
    "Legal deadline management",
    "Billing & invoicing",
    "Document generation",
    "Email & SMS integration"
  ]
}
```

---

### GET /api/health - API Health Check

Detailed health status for monitoring systems (Sentry, monitoring dashboards).

```bash
curl http://localhost:5000/api/health
```

**Response** (200 OK):

```json
{
  "healthy": true,
  "service": "memolib-api",
  "timestamp": "2026-02-01T17:58:24.329842"
}
```

**Use Cases**:

- Docker health checks
- Kubernetes liveness probes
- Load balancer healthiness verification
- Monitoring dashboards (Grafana, Datadog, etc.)

---

## 🔐 Authentication Endpoints

### POST /api/auth/login

Authenticates a user via email/password or OAuth provider (Azure AD).

**Request Headers**:

```
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "avocat@example.com",
  "password": "secure_password_or_oauth_token"
}
```

**Response** (200 OK):

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user-uuid",
    "email": "avocat@example.com",
    "name": "Maître Dupont",
    "role": "lawyer",
    "organization": "Cabinet Juridique"
  },
  "expiresAt": "2026-02-08T17:58:19Z"
}
```

**Response** (401 Unauthorized):

```json
{
  "error": "Invalid credentials",
  "message": "Email or password incorrect"
}
```

**CORS**: ✅ Allowed (localhost:3000, memolib.fr)
**Auth**: ❌ No auth required (public endpoint)

---

## 🤖 CESEDA AI Endpoints

### POST /api/ceseda/predict

AI-powered prediction of legal case success rate based on case facts.

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body**:

```json
{
  "caseId": "case-uuid",
  "clientName": "Jean Martin",
  "countryOfOrigin": "Senegal",
  "entryType": "student_visa",
  "currentStatus": "employment_seeker",
  "facts": {
    "yearsInFrance": 5,
    "hasEmployment": true,
    "hasFamily": true,
    "criminalRecord": false,
    "documentationComplete": true
  },
  "documentUrls": [
    "https://blob.azure.com/documents/passport-scan.pdf",
    "https://blob.azure.com/documents/employment-contract.pdf"
  ]
}
```

**Response** (200 OK):

```json
{
  "caseId": "case-uuid",
  "successRate": 0.87,
  "confidence": 0.94,
  "recommendation": "proceed_with_application",
  "risksIdentified": [
    {
      "risk": "documentation_gap",
      "severity": "medium",
      "description": "Missing birth certificate translation"
    }
  ],
  "estimatedTimelineMonths": 12,
  "nextSteps": [
    "Complete documentation set",
    "Schedule legal consultation",
    "Prepare application dossier"
  ],
  "timestamp": "2026-02-01T17:58:19Z",
  "modelVersion": "ceseda-v2.1.4"
}
```

**Response** (400 Bad Request):

```json
{
  "error": "validation_error",
  "message": "Missing required field: clientName",
  "details": {
    "field": "clientName",
    "reason": "required_field"
  }
}
```

**Response** (401 Unauthorized):

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token
**Rate Limit**: 100 req/hour per user

---

### POST /api/ceseda/analyze

Deep document analysis for legal case strategy development.

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Request Body**:

```json
{
  "caseId": "case-uuid",
  "documents": [
    {
      "type": "passport",
      "url": "https://blob.azure.com/documents/passport.pdf",
      "language": "french"
    },
    {
      "type": "employment_contract",
      "url": "https://blob.azure.com/documents/contract.pdf",
      "language": "french"
    }
  ],
  "analysisDepth": "comprehensive"
}
```

**Response** (200 OK):

```json
{
  "caseId": "case-uuid",
  "analysis": {
    "documentationComplete": true,
    "missingElements": [],
    "legalStrengthScore": 8.2,
    "vulnerabilities": [
      {
        "element": "employment_gap_2023",
        "severity": "low",
        "mitigation": "Provide letter of explanation from employer"
      }
    ],
    "strategicRecommendations": [
      "Emphasize continuous employment since 2021",
      "Include family stability documents",
      "Prepare comprehensive timeline"
    ]
  },
  "timestamp": "2026-02-01T18:00:19Z"
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token

---

## ⏰ Legal Deadline Management

### POST /api/legal/delais/calculer

Calculate legal deadlines based on case type and dates.

**Request Body**:

```json
{
  "caseType": "ceseda_renewal",
  "startDate": "2026-02-01",
  "eventType": "document_submission"
}
```

**Response** (200 OK):

```json
{
  "deadline": "2026-03-01",
  "daysRemaining": 28,
  "deadlineType": "administrative",
  "reminders": [
    {
      "days": 7,
      "enabled": true,
      "method": "email"
    },
    {
      "days": 1,
      "enabled": true,
      "method": "sms"
    }
  ]
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token

---

### GET /api/legal/delais/{clientId}

List all upcoming deadlines for a client.

**Path Parameters**:

- `clientId` (string, required): Unique client identifier

**Query Parameters**:

- `status` (string, optional): Filter by status (`upcoming`, `urgent`, `overdue`)
- `sort` (string, optional): Sort by `date_asc`, `date_desc` (default: `date_asc`)

**Request**:

```bash
curl "http://localhost:5000/api/legal/delais/client-123?status=urgent&sort=date_asc" \
  -H "Authorization: Bearer {jwt_token}"
```

**Response** (200 OK):

```json
{
  "clientId": "client-123",
  "deadlines": [
    {
      "id": "deadline-456",
      "type": "document_submission",
      "deadline": "2026-02-05",
      "daysRemaining": 4,
      "status": "urgent",
      "description": "Submit updated employment contract"
    },
    {
      "id": "deadline-789",
      "type": "renewal_filing",
      "deadline": "2026-03-01",
      "daysRemaining": 28,
      "status": "upcoming",
      "description": "CESEDA renewal application deadline"
    }
  ],
  "summary": {
    "total": 2,
    "urgent": 1,
    "upcoming": 1,
    "overdue": 0
  }
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token

---

## 💳 Billing & Invoicing

### POST /api/legal/facturation/creer

Create an invoice for legal services rendered.

**Request Body**:

```json
{
  "clientId": "client-123",
  "caseId": "case-uuid",
  "services": [
    {
      "description": "Initial case assessment",
      "quantity": 1,
      "unitPrice": 150.0,
      "taxRate": 0.2
    },
    {
      "description": "Document preparation hours",
      "quantity": 8,
      "unitPrice": 100.0,
      "taxRate": 0.2
    }
  ],
  "dueDate": "2026-03-01",
  "notes": "Payment due 30 days from invoice date"
}
```

**Response** (201 Created):

```json
{
  "invoiceId": "INV-2026-001",
  "clientId": "client-123",
  "totalBeforeTax": 950.0,
  "totalTax": 190.0,
  "totalAmount": 1140.0,
  "currency": "EUR",
  "issueDate": "2026-02-01",
  "dueDate": "2026-03-01",
  "status": "draft",
  "downloadUrl": "https://blob.azure.com/invoices/INV-2026-001.pdf"
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token (admin only)

---

### GET /api/legal/facturation/{invoiceId}

Retrieve invoice details.

**Response** (200 OK):

```json
{
  "invoiceId": "INV-2026-001",
  "clientId": "client-123",
  "status": "paid",
  "paidDate": "2026-02-15",
  "paymentMethod": "bank_transfer",
  "items": [...],
  "totalAmount": 1140.00
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token

---

## 📧 Email & SMS Integration

### POST /api/communications/email/send

Send templated email (legal notifications, reminders, updates).

**Request Body**:

```json
{
  "to": "client@example.com",
  "templateId": "deadline_reminder",
  "context": {
    "clientName": "Jean Martin",
    "deadline": "2026-02-05",
    "documentType": "employment_contract"
  },
  "priority": "high"
}
```

**Response** (200 OK):

```json
{
  "messageId": "msg-uuid",
  "status": "sent",
  "sentAt": "2026-02-01T18:05:00Z"
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token

---

### POST /api/communications/sms/send

Send SMS reminder or alert via Twilio.

**Request Body**:

```json
{
  "to": "+33612345678",
  "message": "Rappel: Deadline le 5 février pour soumettre votre contrat d'emploi",
  "messageType": "deadline_reminder"
}
```

**Response** (200 OK):

```json
{
  "messageId": "sms-uuid",
  "status": "sent",
  "sentAt": "2026-02-01T18:05:00Z",
  "carrier": "Orange"
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token
**Rate Limit**: 10 SMS/hour per user (Twilio tier)

---

## 📊 Analytics & Reporting

### GET /api/analytics/cases/summary

Case statistics and success rate analytics.

**Query Parameters**:

- `dateRange` (string, optional): `last_30_days`, `last_quarter`, `last_year` (default: `last_month`)
- `lawyerId` (string, optional): Filter by specific lawyer

**Request**:

```bash
curl "http://localhost:5000/api/analytics/cases/summary?dateRange=last_quarter" \
  -H "Authorization: Bearer {jwt_token}"
```

**Response** (200 OK):

```json
{
  "period": "last_30_days",
  "totalCases": 24,
  "successfulCases": 21,
  "successRate": 0.875,
  "averageResolutionDays": 34,
  "casesByType": {
    "ceseda_renewal": 15,
    "family_visa": 6,
    "employment_seeker": 3
  },
  "revenueGenerated": 18500.0,
  "topRisks": [
    {
      "risk": "documentation_gap",
      "frequency": 8,
      "averageImpact": "medium"
    }
  ]
}
```

**CORS**: ✅ Allowed
**Auth**: ✅ Requires JWT token (admin/analytics role)

---

## 🔄 WebHooks

### POST /api/webhooks/twilio

Receive Twilio SMS delivery status updates.

**Headers**:

```
X-Twilio-Signature: {signature_header}
```

**Request Body** (Form Data):

```
MessageSid=SM123456789
AccountSid=AC123456789
From=+33612345678
To=+33987654321
Body=Response message from client
NumMedia=0
```

**Response** (200 OK):

```
OK
```

**Note**: Requires Twilio signature verification. Configure webhook in Twilio dashboard.

---

## 🛡️ Security & CORS Policy

### Allowed Origins

```javascript
[
  'http://localhost:3000', // Local development
  'https://memolib.fr', // Production domain
  'https://www.memolib.fr', // WWW variant
];
```

### Allowed Methods

```
GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Allowed Headers

```
Content-Type, Authorization, X-Requested-With, Accept
```

### Credentials

```javascript
supports_credentials: true; // Include cookies in CORS requests
```

---

## ⚠️ Error Handling

All endpoints return standardized error responses:

### Standard Error Format

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "specific_field_name",
    "reason": "why_it_failed"
  },
  "timestamp": "2026-02-01T18:00:00Z"
}
```

### Common HTTP Status Codes

| Code  | Meaning           | Example                  |
| ----- | ----------------- | ------------------------ |
| `200` | OK                | Successful request       |
| `201` | Created           | Resource created         |
| `400` | Bad Request       | Missing/invalid field    |
| `401` | Unauthorized      | Missing/invalid token    |
| `403` | Forbidden         | Insufficient permissions |
| `404` | Not Found         | Resource doesn't exist   |
| `429` | Too Many Requests | Rate limit exceeded      |
| `500` | Server Error      | Backend error            |

---

## 🔑 Authentication

All endpoints except `/` and `/api/health` require:

**Header**:

```
Authorization: Bearer {jwt_token}
```

**Token obtained from**: `POST /api/auth/login`

**Token Format**: JWT (JSON Web Token)
**Expires**: 7 days
**Refresh**: Include `refresh_token` in login response

---

## 📈 Rate Limiting

| Endpoint Category | Limit         | Window     |
| ----------------- | ------------- | ---------- |
| Auth              | 10 requests   | Per minute |
| AI Predictions    | 100 requests  | Per hour   |
| Communications    | 1000 requests | Per hour   |
| General           | 1000 requests | Per hour   |

**Response Header** (Rate Limit):

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1706811600
```

---

## 🚀 Deployment

### Environment Variables Required

```bash
FLASK_ENV=production
FLASK_DEBUG=0
DATABASE_URL=postgresql://user:pass@host/db
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_PHONE_NUMBER=+33...
AZURE_BLOB_CONNECTION_STRING=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://memolib.fr
```

### Health Check Command

```bash
curl -f http://localhost:5000/api/health || exit 1
```

---

## 📚 Related Documentation

- [Backend Architecture](../BUILD_ARCHITECTURE.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Database Schema](./DATABASE.md)
- [Security Guidelines](./SECURITY.md)

---

**Last Reviewed**: 01/02/2026
**Next Review**: 08/02/2026
**Owner**: Backend Team / DevOps
