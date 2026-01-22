# Azure SDK Integration

Minimal Azure SDK setup for Blob Storage and Key Vault in IA Poste Manager.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@azure/identity` – Authentication via DefaultAzureCredential
- `@azure/storage-blob` – Blob Storage operations
- `@azure/keyvault-secrets` – Key Vault secret management

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and set:

```env
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_CONTAINER=your-container-name
AZURE_KEY_VAULT_NAME=your-keyvault-name
```

For local dev, either:
- Azure CLI: `az login`
- Service Principal env vars:
  ```env
  AZURE_TENANT_ID=tenant-id
  AZURE_CLIENT_ID=app-id
  AZURE_CLIENT_SECRET=client-secret
  ```

### 3. Assign Permissions

Grant your identity (Managed Identity or Service Principal) roles:
- **Storage**: Storage Blob Data Contributor
- **Key Vault**: Key Vault Secrets User (RBAC) or Access Policy (Get/List secrets)

## 🛠️ API Routes

### Storage

**List Blobs**
```bash
GET /api/azure/storage/list?prefix=dir/&take=100
```

**Upload Blob**
```bash
POST /api/azure/storage/upload?name=example.txt
Content-Type: text/plain

Hello from Azure!
```

### Key Vault

**Get Secret**
```bash
GET /api/azure/keyvault/secret?name=MY-SECRET-NAME
```

## 📂 Files

- [src/lib/azure/clients.ts](src/lib/azure/clients.ts) – Reusable SDK clients
- [src/app/api/azure/storage/list/route.ts](src/app/api/azure/storage/list/route.ts) – List blobs
- [src/app/api/azure/storage/upload/route.ts](src/app/api/azure/storage/upload/route.ts) – Upload blob
- [src/app/api/azure/keyvault/secret/route.ts](src/app/api/azure/keyvault/secret/route.ts) – Get secret

## 🔐 Authentication Flow

`DefaultAzureCredential` tries (in order):
1. Environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
2. Azure CLI (`az login`)
3. Managed Identity (Azure hosting)
4. Visual Studio/Code credentials

## 🧪 Testing Locally

Start dev server:
```bash
npm run dev
```

Test endpoints:
```powershell
# List blobs
Invoke-RestMethod http://localhost:3000/api/azure/storage/list

# Upload
"test content" | Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/azure/storage/upload?name=test.txt" -ContentType "text/plain" -Body $_

# Get secret
Invoke-RestMethod "http://localhost:3000/api/azure/keyvault/secret?name=MY-SECRET"
```

## ⚠️ Important Notes

- All routes use `runtime = 'nodejs'` (required for Azure SDK).
- SDK code only runs server-side (API routes, server components).
- Secrets are never logged (RGPD-safe via `logger`).
- For Azure Static Web Apps with Managed Identity, prefer placing SDK calls in Functions backend.

## 📚 Resources

- [Azure SDK for JavaScript](https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/use-azure-sdk)
- [DefaultAzureCredential](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential)
- [Storage Blob SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob)
- [Key Vault Secrets SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-secrets)
