# Sécurité – Politique d'Exceptions

**Dernière mise à jour :** 22 janvier 2026  
**Status :** MVP Professionnel  
**Audit Trail :** ✅ Actif

---

## 🎯 Principes Fondamentaux

1. **Aucune exception sans justification documentée**
2. **Risk × Confidence définit la priorité réelle**
3. **Toute exception acceptée est réversible et suivie**
4. **Scan OWASP ZAP exécuté à chaque déploiement**

---

## 📊 Matrice de Décision

| Risk   | Confidence  | Action                        | Timeframe |
| ------ | ----------- | ----------------------------- | --------- |
| High   | Medium/High | 🔴 **Bloquant production**    | Immédiat  |
| Medium | High        | 🟠 **À corriger rapidement**  | < 1 semaine |
| Low    | High        | 🟡 **Corriger ou documenter** | < 1 mois  |
| Info   | Any         | ℹ️ **Documenter uniquement**  | Tracking  |

---

## ✅ Exceptions Actuelles (MVP Phase)

### Alertes LOW - Documentées & Acceptées

#### 1. Missing Anti-Clickjacking Header
- **Actual Status** : ✅ FIXED
- **Header** : `X-Frame-Options: DENY`
- **Implementation** : `next.config.js` (line 54)
- **Risk** : Mitigated

#### 2. Missing HSTS Header
- **Actual Status** : ✅ FIXED
- **Header** : `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **Implementation** : `next.config.js` (line 41)
- **Production Only** : Yes
- **Risk** : Mitigated

#### 3. Content Security Policy (CSP) Header Not Set
- **Actual Status** : ✅ FIXED
- **CSP Strict Mode** : Production
- **CSP Dev Mode** : Relaxed (for hot reload)
- **Implementation** : `next.config.js` (line 83-85)
- **Blocked** : 
  - Unsafe scripts from external sources
  - Inline styles without nonce
  - Frame embedding
- **Allowed** :
  - Sentry error tracking (ingest.sentry.io)
  - Analytics (vitals.vercel-insights.com)
- **Risk** : Mitigated

#### 4. X-Content-Type-Options Header Missing
- **Actual Status** : ✅ FIXED
- **Header** : `X-Content-Type-Options: nosniff`
- **Implementation** : `next.config.js` (line 58)
- **Risk** : Mitigated

#### 5. Cookie Without HttpOnly Flag
- **Actual Status** : ✅ FIXED
- **Cookies Secured** :
  - `__Secure-next-auth.session-token` (HttpOnly, Secure, SameSite=Strict)
  - `__Host-next-auth.csrf-token` (HttpOnly, Secure, SameSite=Lax)
  - `__Secure-next-auth.callback-url` (Secure, SameSite=Lax)
- **Implementation** : `src/app/api/auth/[...nextauth]/route.ts` (auth config)
- **Risk** : Mitigated

#### 6. Referrer-Policy Header Missing
- **Actual Status** : ✅ FIXED
- **Header** : `Referrer-Policy: strict-origin-when-cross-origin`
- **Implementation** : `next.config.js` (line 67)
- **Risk** : Mitigated

#### 7. Permissions-Policy Header Missing
- **Actual Status** : ✅ FIXED
- **Blocked APIs** :
  - camera, microphone, geolocation
  - payment, usb, magnetometer
  - gyroscope, accelerometer, interest-cohort
- **Implementation** : `next.config.js` (line 69-75)
- **Risk** : Mitigated

#### 8. Server Leaks Version Information
- **Actual Status** : ✅ FIXED
- **Server Header** : Hidden
- **X-Powered-By** : Hidden
- **Implementation** : `src/middleware/security.ts` (line 51-52)
- **Risk** : Mitigated (informational only)

### ℹ️ Alertes INFORMATIONAL - Documentées

#### Server Technology Disclosure
- **Impact** : Zero (reconnaissance only)
- **Mitigation** : Version headers removed
- **Accept?** : Yes, by design (ZAP baseline with `-I` flag)

#### Suspicious Server Header
- **Impact** : Zero
- **Mitigation** : Custom server header removed
- **Accept?** : Yes

---

## 🛡️ Détails Implémentation Sécurité

### 1. Headers Sécurité (next.config.js)

```javascript
✅ X-Frame-Options: DENY                    → Clickjacking protection
✅ X-Content-Type-Options: nosniff          → MIME sniffing protection
✅ Referrer-Policy: strict-origin-when-cross-origin → Navigation data protection
✅ Strict-Transport-Security: max-age=63072000     → HSTS (2 years + subdomains + preload)
✅ Permissions-Policy: camera=(), ...       → API access control
✅ Content-Security-Policy: [strict]        → XSS protection
✅ Cross-Origin-Embedder-Policy: credentialless
✅ Cross-Origin-Opener-Policy: same-origin
✅ Cross-Origin-Resource-Policy: same-origin
```

### 2. NextAuth Cookies (route.ts)

```typescript
✅ __Secure-next-auth.session-token
   - HttpOnly: true         → JS cannot access
   - Secure: true (prod)    → HTTPS only
   - SameSite: Strict       → CSRF protection
   - Path: /                → Strict scope
   - MaxAge: 2h             → Short session

✅ __Host-next-auth.csrf-token
   - HttpOnly: true
   - Secure: true (prod)
   - SameSite: Lax
   - Path: /

✅ __Secure-next-auth.callback-url
   - Secure: true (prod)
   - SameSite: Lax
```

### 3. Middleware Sécurité (security.ts)

```typescript
✅ Rate Limiting        → In-memory, configurable per route
✅ CSRF Validation      → Token-based protection
✅ Input Validation     → Sanitization in progress
✅ SQL Injection        → Prisma ORM (parameterized)
✅ CORS Configuration   → Tight by default
```

---

## 🔄 Processus Révision

### Scan OWASP ZAP

**Fréquence** :
- ✅ À chaque push sur `main` / `develop`
- ✅ À chaque pull request
- ✅ Weekly (dimanche 02:00 UTC)

**Blocage** :
- HIGH Risk → Pipeline fails ❌
- MEDIUM Risk → Alerte PR, peut merge avec approbation
- LOW/INFO → Documenté, non-bloquant

**Rapport** :
- Stocké 90 jours dans GitHub Actions
- Downloadable artifact pour audit
- Commentaire auto PR avec résumé

### Révision Manuelle

- **Tous les mois** : Audit des exceptions
- **Avant PROD** : Revue sécurité complète
- **Trimestriellement** : Penetration testing optionnel

---

## 🚀 Améliorations Prévues

### T1 2026
- [ ] E2E encryption for sensitive documents
- [ ] OAuth 2.0 + PKCE (option GitHub)
- [ ] API rate limiting (Redis backend)
- [ ] Web Application Firewall (Cloudflare)

### T2 2026
- [ ] SOC 2 Type II audit
- [ ] ISO 27001 certification
- [ ] Hardware security key support
- [ ] Advanced threat detection (ML-based)

---

## 📋 Checklist Déploiement Production

- [x] Security headers implémentés et testés
- [x] Cookies sécurisés (HttpOnly, Secure, SameSite)
- [x] ZAP scan en CI/CD
- [x] CSP policy (strict mode)
- [x] HSTS enabled (2 ans + preload)
- [x] Rate limiting actif
- [x] Audit logging en place
- [x] Secrets management (env vars)
- [ ] Pen test externe (T2 2026)
- [ ] SOC 2 audit (T2 2026)

---

## 📞 Contact Sécurité

**Rapport vulnérabilité** :
- Email : security@iapostemanager.com
- Réponse : < 48h

**Escalade critique** :
- Hotline : +33 (à configurer)
- Slack : #security-incidents

---

## ✋ Responsabilités

| Rôle          | Responsabilité                           |
| ------------- | ---------------------------------------- |
| Dev Lead      | Code security reviews                    |
| DevOps        | Infrastructure security, ZAP config     |
| Security Team | Audit, pen testing, compliance           |
| Product Mgmt  | Exception approval (Risk Level)          |

---

**Document version:** 1.0  
**Last reviewed:** 22 Jan 2026  
**Next review:** 22 Feb 2026
