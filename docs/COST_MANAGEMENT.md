# 💰 Guide Anti-Faillite : Gestion des Coûts memoLib

## 📊 Analyse de Rentabilité par Plan

### Structure des Coûts Variables

| Coût | Par unité | Impact |
|------|-----------|--------|
| **Cloudflare Workers AI** | ~0.01€/1000 tokens | Variable selon usage |
| **Ollama (local)** | 0€ | GRATUIT |
| **PostgreSQL (Neon)** | 0€ → 25€/mois | Selon taille |
| **Vercel** | 0€ → 20€/mois | Selon exécutions |
| **Stripe** | 1.4% + 0.25€/tx | Proportionnel |

### Calcul de Marge par Plan

#### Plan SOLO (49€/mois)
```
Revenu mensuel:     49€
─────────────────────────
Coûts fixes:
  - Infrastructure:  ~2€ (part proportionnelle)
  - Stripe:          ~1€

Coûts IA max:        5€ (limite configurée)
─────────────────────────
Marge minimale:     41€ (84%)
```

#### Plan CABINET (349€/mois) - 🎯 SWEET SPOT
```
Revenu mensuel:    349€
─────────────────────────
Coûts fixes:
  - Infrastructure:  ~5€
  - Stripe:          ~5€

Coûts IA max:       30€ (limite configurée)
─────────────────────────
Marge minimale:    309€ (89%)
```

#### Plan ENTERPRISE (1200€/mois)
```
Revenu mensuel:   1200€
─────────────────────────
Coûts fixes:
  - Infrastructure: ~20€
  - Stripe:         ~17€

Coûts IA max:      100€ (limite configurée)
─────────────────────────
Marge minimale:   1063€ (89%)
```

---

## 🛡️ Mécanismes de Protection Implémentés

### 1. Limites de Coûts IA par Plan
```typescript
MONTHLY_COST_LIMITS = {
  FREE: 0.50€,      // Trial très limité
  SOLO: 5€,         // 10% du prix
  CABINET: 30€,     // 8.6% du prix
  ENTERPRISE: 100€, // 8.3% du prix
};
```

### 2. Système d'Alertes
- **70%** du budget → Alerte warning
- **90%** du budget → Alerte critique
- **100%** du budget → Blocage Cloudflare, force Ollama

### 3. Provider Prioritaire: Ollama
- **Coût: 0€** (exécution locale)
- Cloudflare = fallback uniquement
- Si Ollama indisponible + budget épuisé → Erreur explicite

---

## 📈 Stratégies pour Maximiser la Rentabilité

### 1. Encourager l'Installation d'Ollama
```
Bénéfice: Coûts IA → 0€
Comment: 
  - Message dans le dashboard
  - Guide d'installation simple
  - Détection automatique
```

### 2. Limiter les Tokens par Requête
```typescript
// Dans hybrid-client.ts
const MAX_TOKENS_PER_REQUEST = 2000;
const MAX_PROMPT_LENGTH = 4000;
```

### 3. Cache des Réponses IA
```typescript
// Éviter les requêtes répétitives
- Hash du prompt → Redis/KV
- TTL: 1 heure pour analyses similaires
- Économie potentielle: 30-50%
```

### 4. Modèles Légers pour Tâches Simples
```
Classification email → llama3.2:1b (rapide)
Analyse juridique → llama3.2:3b (précis)
Résumé complexe → llama3.1:8b (fallback cloud)
```

---

## 🚨 Scénarios Dangereux à Éviter

### ❌ Client en Plan FREE qui abuse
**Protection:** Limite 0.50€/mois + 100 req/min

### ❌ Client Enterprise qui fait du bulk processing
**Protection:** 
- 100€/mois max en IA cloud
- Rate limit 2000 req/min
- Alertes automatiques à 70%

### ❌ Attaque par tokens (prompts géants)
**Protection:**
- Limite de taille des prompts
- Estimation du coût AVANT exécution
- Rejet si dépassement budget

---

## 📊 Dashboard de Monitoring (Implémenté)

### API Endpoint
```
GET /api/billing/ai-costs

Retourne:
{
  currentMonth: {
    cost: 12.50,
    limit: 30,
    percentage: 41.6,
    status: "normal"
  },
  byProvider: {
    ollama: 0,
    cloudflare: 12.50
  },
  recommendations: [
    "💡 Installez Ollama pour réduire les coûts de 90%+"
  ],
  projectedEndOfMonth: 25.00
}
```

---

## ✅ Checklist Anti-Faillite

- [x] Limites de coûts IA par plan
- [x] Système d'alertes progressives
- [x] Ollama prioritaire (gratuit)
- [x] Tracking des usages par tenant
- [x] API de monitoring des coûts
- [x] Blocage automatique si budget épuisé
- [x] Cache des réponses IA (économie 30-50%)
- [x] Alertes email admin si client > 80% budget
- [x] Cron quotidien pour vérification automatique
- [x] Dashboard client pour voir son usage
- [x] Rapport super admin pour les alertes critiques

---

## 🎯 Recommandations de Prix

Pour rester rentable avec une marge > 80%:

| Plan | Prix Min | Prix Recommandé | Marge Nette |
|------|----------|-----------------|-------------|
| SOLO | 29€ | **49€** | 84% |
| CABINET | 199€ | **349€** | 89% |
| ENTERPRISE | 800€ | **1200€** | 89% |

**Ne JAMAIS descendre sous les prix minimum!**

---

## 📞 Actions Urgentes si Coûts Explosent

1. **Activer le mode "Ollama Only"**
   ```
   AI_PREFERRED_PROVIDER=ollama
   CLOUDFLARE_WORKERS_AI=false
   ```

2. **Réduire les limites temporairement**
   ```typescript
   MONTHLY_COST_LIMITS.CABINET = 15; // Divisé par 2
   ```

3. **Contacter les gros consommateurs**
   - Proposer upgrade Enterprise
   - Ou installer Ollama local

4. **Analyser les patterns d'abus**
   ```sql
   SELECT tenantId, SUM(costEur), COUNT(*)
   FROM ai_usage_logs
   WHERE createdAt > NOW() - INTERVAL '7 days'
   GROUP BY tenantId
   ORDER BY SUM(costEur) DESC
   LIMIT 10;
   ```
