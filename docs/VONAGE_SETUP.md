# Setup Vonage (alternative à Twilio)

## 1) Secrets à configurer

```powershell
dotnet user-secrets set "Messaging:SmsProvider" "vonage"
dotnet user-secrets set "Vonage:ApiKey" "<VONAGE_API_KEY>"
dotnet user-secrets set "Vonage:ApiSecret" "<VONAGE_API_SECRET>"
dotnet user-secrets set "Vonage:From" "MemoLib"
dotnet user-secrets set "Vonage:InboundWebhookKey" "<CLE_WEBHOOK_FORTE>"
```

## 2) Webhook inbound à configurer dans Vonage

- URL: `https://<votre-url-publique>/api/messaging/sms/vonage/webhook?key=<CLE_WEBHOOK_FORTE>`
- Méthode: `GET` ou `POST` (les deux sont supportées)

## 3) Endpoints supportés

- Inbound Vonage: `GET/POST /api/messaging/sms/vonage/webhook`
- Envoi SMS (API MemoLib): `POST /api/messaging/sms/send`

## 4) Test rapide inbound local (ngrok)

```powershell
$base = "https://<votre-ngrok>"
Invoke-WebRequest -Uri "$base/api/messaging/sms/vonage/webhook?key=<CLE_WEBHOOK_FORTE>&msisdn=%2B33603983709&to=%2B19564490871&text=Bonjour&messageId=VONAGE-TEST-001" -Method Get
```
