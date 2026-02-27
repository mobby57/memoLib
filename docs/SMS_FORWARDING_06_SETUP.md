# Passerelle SMS 06 -> MemoLib (Option 2)

Ce guide permet d'envoyer les SMS reçus sur votre 06 personnel vers MemoLib via l'endpoint sécurisé:

- `POST /api/messaging/sms/forwarded`
- Header requis: `X-MemoLib-Forward-Key`

## 1) Pré-requis backend

Configurer la clé d'ingestion (une seule fois):

```powershell
dotnet user-secrets set "Messaging:ForwardingApiKey" "votre-cle-longue-aleatoire"
```

Vérifier que l'API tourne (exemple local):

```powershell
Invoke-WebRequest http://localhost:5078/health -UseBasicParsing
```

## 2) Format attendu

URL:

- Local: `http://localhost:5078/api/messaging/sms/forwarded`
- Public (si mobile externe): `https://<votre-url-publique>/api/messaging/sms/forwarded`

Body JSON:

```json
{
  "from": "+33601020304",
  "to": "+33611223344",
  "body": "Texte du SMS reçu",
  "messageSid": "MANUAL-20260226-001",
  "userId": "00000000-0000-0000-0000-000000000001"
}
```

## 3) iPhone (Raccourcis)

Important: selon la version iOS, l'automatisation "SMS reçu" peut demander confirmation utilisateur.

1. Ouvrir l'app **Raccourcis**.
2. Créer une **Automatisation personnelle**.
3. Déclencheur: **Message reçu** (filtrer si besoin).
4. Action: **Obtenir le contenu de l'entrée** / variables de message (expéditeur, texte).
5. Action: **Texte** pour construire le JSON ci-dessus.
6. Action: **Obtenir le contenu de l'URL**:
   - Méthode: `POST`
   - URL: endpoint public MemoLib
   - En-têtes:
     - `Content-Type: application/json`
     - `X-MemoLib-Forward-Key: <votre-cle>`
   - Corps: JSON construit à l'étape précédente.
7. Sauvegarder et tester avec un SMS entrant.

## 4) Android (Tasker)

1. Créer un **Profile**: Event -> Phone -> **Received Text**.
2. Créer une **Task** associée.
3. Action HTTP Request:
   - Method: `POST`
   - URL: endpoint public MemoLib
   - Headers:
     - `Content-Type: application/json`
     - `X-MemoLib-Forward-Key: <votre-cle>`
   - Body (JSON):

```json
{
  "from": "%SMSRF",
  "to": "+33611223344",
  "body": "%SMSRB",
  "messageSid": "TASKER-%TIMEMS",
  "userId": "00000000-0000-0000-0000-000000000001"
}
```

4. Tester avec un SMS entrant.

## 5) Vérification rapide

Réponse attendue côté API:

```json
{
  "message": "SMS transféré ingéré",
  "eventId": "..."
}
```

## 6) Sécurité

- Ne pas exposer `Messaging:ForwardingApiKey` dans un frontend web.
- Utiliser une clé longue et aléatoire.
- Faire tourner l'endpoint en HTTPS pour un usage mobile externe.
