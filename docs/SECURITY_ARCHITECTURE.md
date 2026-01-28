# 🔐 Architecture Sécurité & Conformité RGPD

## Vue d'ensemble

memoLib implémente une architecture sécurisée conforme aux exigences RGPD et aux standards de l'industrie.

---

## 1. Gestion des Secrets

### Azure Key Vault
| Secret | Usage | Rotation |
|--------|-------|----------|
| `DATABASE-URL` | Connexion PostgreSQL Neon | Manuelle |
| `NEXTAUTH-SECRET` | Signature JWT sessions | 90 jours |
| `GITHUB-CLIENT-ID` | OAuth GitHub | Manuelle |
| `GITHUB-CLIENT-SECRET` | OAuth GitHub | Manuelle |

**URL du Vault**: `https://memoLib-vault.vault.azure.net/`

### Accès RBAC
- **App Service**: Managed Identity avec rôle `Key Vault Secrets User`
- **Administrateurs**: Rôle `Key Vault Secrets Officer`
- **Développeurs**: Aucun accès direct aux secrets production

### Script de Rotation
```powershell
# Rotation automatique
./scripts/azure-keyvault-rotate.ps1 -SecretName "ALL" -AutoRestart

# Mode test (sans modification)
./scripts/azure-keyvault-rotate.ps1 -DryRun
```

---

## 2. Protection des Données (RGPD)

### Catégories de Données Traitées
| Catégorie | Données | Base légale | Durée conservation |
|-----------|---------|-------------|-------------------|
| Identification | Email, nom | Contrat | Durée du compte |
| Dossiers | Numéros CESEDA, dates | Contrat | 10 ans |
| Logs | IP, actions | Intérêt légitime | 1 an |
| Analytics | Usage anonymisé | Intérêt légitime | 2 ans |

### Droits des Utilisateurs
- ✅ **Droit d'accès**: Export JSON via `/api/rgpd/export`
- ✅ **Droit de rectification**: Interface utilisateur
- ✅ **Droit à l'effacement**: `/api/rgpd/delete` avec confirmation
- ✅ **Droit à la portabilité**: Export PDF/JSON
- ✅ **Droit d'opposition**: Paramètres notifications

### Mesures Techniques
```
[x] Chiffrement TLS 1.3 en transit
[x] Chiffrement AES-256 au repos (Neon PostgreSQL)
[x] Pseudonymisation des logs
[x] Minimisation des données collectées
[x] Journalisation des accès
```

---

## 3. Authentification & Autorisation

### Providers Supportés
| Provider | Type | MFA | Statut |
|----------|------|-----|--------|
| Credentials | Email/Password | Optionnel | ✅ Actif |
| GitHub | OAuth 2.0 | Hérité | ✅ Actif |
| Google | OAuth 2.0 | Hérité | ⏳ Planifié |

### Politique de Mots de Passe
- Longueur minimum: 8 caractères
- Complexité: majuscule + chiffre + spécial
- Historique: 5 derniers mots de passe
- Expiration: 90 jours (configurable)

### Sessions
- Durée: 24h (inactivité: 30min)
- Storage: JWT signé (NEXTAUTH_SECRET)
- Rotation: Token refresh automatique

---

## 4. Sécurité Réseau

### Headers de Sécurité
```typescript
// next.config.js
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'" }
]
```

### Rate Limiting
| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/api/auth/*` | 10 req | 15 min |
| `/api/*` | 100 req | 1 min |
| `/api/ai/*` | 20 req | 1 min |

---

## 5. Audit & Monitoring

### Logs de Sécurité
```json
{
  "event": "auth.login",
  "userId": "uuid",
  "ip": "masked",
  "userAgent": "hash",
  "timestamp": "ISO8601",
  "status": "success|failure",
  "mfa": true
}
```

### Alertes Automatiques
- 🔴 5+ échecs de connexion → Blocage temporaire
- 🔴 Accès API anormal → Notification admin
- 🟡 Secrets proches expiration → Email 30j avant
- 🟢 Rotation secrets réussie → Log audit

---

## 6. Environnements

| Environnement | URL | Sécurité |
|---------------|-----|----------|
| Production | `memoLib.vercel.app` | Maximale |
| Staging | `staging.memoLib.vercel.app` | Élevée |
| Development | `localhost:3000` | Basique |

### Isolation des Données
- ❌ Pas de données production en staging/dev
- ✅ Bases de données séparées par environnement
- ✅ Secrets différents par environnement

---

## 7. Plan de Réponse aux Incidents

### Procédure en cas de Brèche
1. **Détection** (< 1h): Monitoring automatique
2. **Containment** (< 4h): Isolation des systèmes
3. **Notification** (< 72h): CNIL + utilisateurs affectés
4. **Remediation** (< 1 semaine): Correctifs
5. **Post-mortem**: Documentation et amélioration

### Contacts d'Urgence
- **DPO**: [À définir]
- **RSSI**: [À définir]
- **CNIL**: https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles

---

## 8. Conformité

### Certifications Cibles
- [ ] SOC 2 Type II
- [ ] ISO 27001
- [x] RGPD

### Audits Planifiés
| Type | Fréquence | Prochain |
|------|-----------|----------|
| Pentest externe | Annuel | Q2 2026 |
| Audit RGPD | Annuel | Q1 2026 |
| Revue des accès | Trimestriel | Avril 2026 |

---

## 9. Checklist Pré-Production

```
[x] Azure Key Vault configuré
[x] Secrets migrés vers Key Vault
[x] RBAC configuré
[x] Script rotation créé
[x] Headers sécurité actifs
[x] Rate limiting en place
[ ] Pentest initial
[ ] DPO désigné
[ ] Registre des traitements
[ ] Contrats sous-traitants (DPA)
```

---

## 10. Ressources

- **Azure Key Vault**: https://memoLib-vault.vault.azure.net/
- **GitHub Repo**: https://github.com/mobby57/memoLib
- **Vercel Dashboard**: https://vercel.com/mobby57s-projects/memoLib
- **Neon Console**: https://console.neon.tech/

---

*Document généré le 26/01/2026 - Version 1.0*
