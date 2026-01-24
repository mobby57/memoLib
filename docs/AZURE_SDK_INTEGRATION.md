# Azure SDK Integration

Intégration minimale des SDK Azure pour Blob Storage et Key Vault.

## 🚀 Installation

```bash
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
```

## 🔑 Configuration

### Variables d'environnement

```env
# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_CONTAINER=your-container-name

# Azure Key Vault
AZURE_KEY_VAULT_NAME=your-keyvault-name

# Authentification (optionnel pour local)
AZURE_TENANT_ID=tenant-id
AZURE_CLIENT_ID=app-id
AZURE_CLIENT_SECRET=client-secret
```

### Authentification locale

```bash
# Via Azure CLI
az login

# Ou via Service Principal (variables ci-dessus)
```

### Permissions Azure

- **Storage**: Storage Blob Data Contributor
- **Key Vault**: Key Vault Secrets User (RBAC)

## 🛠️ API Routes

### Blob Storage

**Lister les blobs**
```bash
GET /api/azure/storage/list?prefix=dir/&take=100
```

**Upload blob**
```bash
POST /api/azure/storage/upload?name=example.txt
Content-Type: text/plain

Hello Azure!
```

### Key Vault

**Récupérer un secret**
```bash
GET /api/azure/keyvault/secret?name=MY-SECRET-NAME
```

## 📝 Fichiers

```
src/lib/azure/
  clients.ts              # Clients SDK réutilisables

src/app/api/azure/
  storage/
    list/route.ts         # Liste blobs
    upload/route.ts       # Upload blob
  keyvault/
    secret/route.ts       # Récupère secret
```

## 🔐 Authentification

`DefaultAzureCredential` essaie dans l'ordre :

1. **Variables d'environnement** (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
2. **Azure CLI** (`az login`)
3. **Managed Identity** (Azure hosting)
4. **Visual Studio/Code** credentials

## 🧪 Test local

```bash
npm run dev
```

```powershell
# Liste blobs
Invoke-RestMethod http://localhost:3000/api/azure/storage/list

# Upload
"test" | Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/azure/storage/upload?name=test.txt" -ContentType "text/plain" -Body $_

# Secret
Invoke-RestMethod "http://localhost:3000/api/azure/keyvault/secret?name=MY-SECRET"
```

## ⚠️ Notes importantes

- Routes avec `runtime = 'nodejs'` (requis pour Azure SDK)
- SDK uniquement côté serveur (API routes, server components)
- Secrets jamais logués (RGPD-safe)
- Pour Azure Static Web Apps avec Managed Identity, préférer Functions backend

## 📦 Dépendances

```json
"@azure/identity": "^4.5.0",
"@azure/keyvault-secrets": "^4.9.0",
"@azure/storage-blob": "^12.24.0"
```

## 🔗 Ressources

- [Azure SDK for JavaScript](https://learn.microsoft.com/azure/developer/javascript/sdk/use-azure-sdk)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
- [Storage Blob SDK](https://learn.microsoft.com/javascript/api/@azure/storage-blob)
- [Key Vault Secrets SDK](https://learn.microsoft.com/javascript/api/@azure/keyvault-secrets)
