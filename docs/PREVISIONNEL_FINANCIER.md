# PRÉVISIONNEL FINANCIER & BUSINESS PLAN

**IA POSTE MANAGER – Scenario 5 ans**

**Version 1.0 – 22 janvier 2026**

---

## EXECUTIVE SUMMARY

| Année | ARR | Utilisateurs | Margin | Status |
|-------|-----|--------------|--------|--------|
| **Y1** | €45k | 15 cabinets | -120% | Pre-revenue (MVP) |
| **Y2** | €240k | 60 cabinets | -20% | Growth |
| **Y3** | €750k | 180 cabinets | +15% | Breakeven |
| **Y4** | €1.8M | 350 cabinets | +35% | Profitability |
| **Y5** | €3.6M | 650 cabinets | +45% | Scalability |

**Profitabilité : An 3 | Rentabilité (3x) : An 4 | Scalabilité : An 5**

---

## 1. HYPOTHÈSES COMMERCIALES

### 1.1 Cible marché

**Marché primaire :** France

| Segment | Total | TAM | Cible Y1 |
|---------|-------|-----|----------|
| Petits cabinets CESEDA (1-3 avocats) | 2,800 | 30% | 15 |
| Cabinets moyens (4-10 avocats) | 800 | 60% | 30 |
| Cabinets grands (10+ avocats) | 200 | 80% | 10 |
| **Total serviceable (SAM)** | 3,800 | **40%** | **55** |

**Cible réaliste Y1 :** 15 cabinets (27% SAM)

### 1.2 Willingness to Pay (WTP)

**Prix acceptés par segment :**

| Segment | Monthly | Annual | Justification |
|---------|---------|--------|---|
| Micro (1-2 avocats) | €199 | €1,800 | ROI simple gestion délais |
| Small (3-5 avocats) | €599 | €5,400 | Gain temps + IA suggestions |
| Medium (6-15 avocats) | €1,299 | €12,000 | Cabinet scale + support |
| Enterprise (15+ avocats) | €Custom | - | Negotiation required |

**Validation :** Interviews 10 avocats → Acceptance €400-800/mois

---

## 2. MODÈLE TARIFAIRE

### 2.1 Pricing stratégique (Value-based)

**Composants :**

```
Monthly subscription: 
  + Usage-based (par Information Unit traité)
  + Storage (au-delà X GB)
  + Premium features (API, webhooks)

Annual discount: -20% vs monthly × 12
```

### 2.2 Détail pricing par plan

#### Plan Startup (1-3 avocats)

```
€199/mois
├─ 500 Information Units / mois
├─ 5 GB stockage
├─ Email support (48h)
└─ No API
```

#### Plan Professional (4-10 avocats)

```
€599/mois
├─ 2,000 Information Units / mois
├─ 50 GB stockage
├─ Chat support (12h)
├─ Basic API
└─ SSO (OIDC)
```

#### Plan Enterprise (10+ avocats)

```
€1,299/mois (minimum)
├─ Unlimited Information Units
├─ Unlimited storage
├─ 24/7 phone support
├─ Full API + webhooks
├─ SLA 99.9% uptime
└─ Custom onboarding
```

#### Pay-per-use (Optional)

```
€0.05 / Information Unit (overage)
€0.05 / GB / mois (storage overage)
€99 / API key (if required)
```

### 2.3 Customer Acquisition Cost (CAC)

**Scenario :**

| Channel | CAC | Notes |
|---------|-----|-------|
| **Inbound (content)** | €0 | Free (content marketing) |
| **Direct sales** | €800–1,200 | 1 AE visit + demo |
| **Partnerships** | €400–600 | Revenue share 15% |
| **Referral** | €150–300 | Incentive 10% first annual |
| **Blended CAC** | **€400–600** | Weighted average |

**Payback period :** 4–8 months (acceptable)

---

## 3. COST STRUCTURE

### 3.1 Fixed Costs (Annual)

| Item | Y1 | Y2 | Y3 | Y4 | Y5 |
|------|----|----|----|----|-----|
| **Salaries** | €120k | €200k | €320k | €480k | €600k |
| **Office/Tools** | €30k | €40k | €50k | €60k | €70k |
| **Legal/Compliance** | €25k | €30k | €40k | €50k | €50k |
| **Marketing/Sales** | €50k | €80k | €120k | €180k | €240k |
| **Total Fixed** | **€225k** | **€350k** | **€530k** | **€770k** | **€960k** |

### 3.2 Variable Costs (Per Customer)

| Item | Cost | Notes |
|------|------|-------|
| **Database (PostgreSQL)** | €20–50/mois | Scales 10 GB base + usage |
| **Compute (Vercel/render)** | €10–30/mois | Edge functions + background jobs |
| **Email service** | €0.005/email | SendGrid or similar |
| **Payment processing** | 2.9% + €0.30 | Stripe fee |
| **Support time** | €50–100/ticket | ~2h support/customer/mois |
| **Total variable** | **€80–200/customer/mois** | |

**Margin contribution :** 60–75% (gross) avant fixed costs

### 3.3 COGS & Gross Margin

| Metric | Y1 | Y2 | Y3 | Y4 | Y5 |
|--------|----|----|----|----|-----|
| Revenue | €45k | €240k | €750k | €1.8M | €3.6M |
| COGS (variable) | €60k | €120k | €180k | €270k | €360k |
| Gross Profit | **-€15k** | **€120k** | **€570k** | **€1.53M** | **€3.24M** |
| Gross Margin % | **-33%** | **50%** | **76%** | **85%** | **90%** |

📌 *Négatif Y1 = investissement client acquisition*

---

## 4. REVENUE PROJECTIONS

### 4.1 Customer Acquisition Curve

**Assumptions :**
- Y1 : 15 customers (manual sales)
- Y2 : 45 new (60 total) = 200% growth
- Y3 : 120 new (180 total) = 200% growth
- Y4 : 170 new (350 total) = 94% growth
- Y5 : 300 new (650 total) = 86% growth

**Justification :**
- Y1-2 : Focused B2B sales, word-of-mouth
- Y3 : Partnerships + content → inbound
- Y4-5 : Market saturation slowing growth

### 4.2 ARPU (Average Revenue Per User)

| Year | Avg ARPU/month | Mix (startup/pro/ent) | Total ARR |
|------|---|---|---|
| Y1 | €250 | 70% startup / 25% pro / 5% ent | €45k |
| Y2 | €330 | 50% / 40% / 10% | €240k |
| Y3 | €350 | 35% / 50% / 15% | €750k |
| Y4 | €430 | 25% / 50% / 25% | €1.8M |
| Y5 | €460 | 20% / 45% / 35% | €3.6M |

**Drivers :**
- Product maturity → higher willingness-to-pay
- Enterprise mix grows
- Upsell opportunities (API, webhooks)

---

## 5. P&L PROJECTIONS (5 ANS)

| Line | Y1 | Y2 | Y3 | Y4 | Y5 |
|------|----|----|----|----|-----|
| **REVENUE** | €45k | €240k | €750k | €1.8M | €3.6M |
| **COGS** | €60k | €120k | €180k | €270k | €360k |
| **Gross Profit** | -€15k | €120k | €570k | €1.53M | €3.24M |
| **Gross Margin %** | -33% | 50% | 76% | 85% | 90% |
| | | | | | |
| **Operating Expenses** | | | | | |
| Salaries | €120k | €200k | €320k | €480k | €600k |
| Office/tools | €30k | €40k | €50k | €60k | €70k |
| Legal/Compliance | €25k | €30k | €40k | €50k | €50k |
| Marketing | €50k | €80k | €120k | €180k | €240k |
| **Total OpEx** | €225k | €350k | €530k | €770k | €960k |
| | | | | | |
| **EBITDA** | **-€240k** | **-€230k** | **€40k** | **€760k** | **€2.28M** |
| **EBITDA Margin %** | **-533%** | **-96%** | **5%** | **42%** | **63%** |

### 5.1 Breakeven Analysis

**Fixed Cost per Customer (blended) :**
- Y1 : €225k / 15 = €15k per customer
- Y2 : €350k / 60 = €5.8k per customer
- Y3 : €530k / 180 = €2.9k per customer

**Breakeven :** 55 customers @ €250/mois = €165k ARR

**Timeline :** Q2-Q3 Year 2

---

## 6. CASH FLOW PROJECTIONS

### 6.1 Cash Burn & Runway

| Year | Cash Start | Burn | Cash End | Runway |
|------|------------|------|----------|--------|
| Y1 | €100k | -€240k | **-€140k** | 6 months |
| Y2 | -€140k | -€230k | **-€370k** | Fundraise needed |
| Y3 | €300k (raised) | -€490k | **-€190k** | Sustainability |
| Y4 | €760k | +€400k | **€210k** | Positive |
| Y5 | €210k | +€1.3M | **€1.51M** | Strong |

**Funding needs :**
- **Pre-seed (Y0)** : €100k (development + 6mo runway)
- **Seed (late Y1/Y2)** : €400k (10-12mo runway, growth)
- **Series A (Y3)** : Optional (already profitable trajectory)

---

## 7. BREAK-EVEN & PROFITABILITY

### 7.1 Unit Economics

| Metric | Value |
|--------|-------|
| CAC | €500 |
| LTV (5-year) | €15,000 |
| LTV:CAC Ratio | **30:1** ✅ (excellent) |
| Payback Period | 4.8 months |
| Gross Margin | 60–75% |

### 7.2 Profitability Timeline

```
Y1 : Heavy investment (-€240k EBITDA)
Y2 : Scaling losses (-€230k EBITDA)
Y3 : Inflection point (+€40k EBITDA) 🎯
Y4 : Strong growth (+€760k EBITDA)
Y5 : Mature operation (+€2.28M EBITDA)
```

**Profitability achieved : Year 3**
**3x ROI on Y1 investment : Year 4**

---

## 8. SENSITIVITY ANALYSIS

### 8.1 Variables clés

**Impactent profitabilité :**

| Variable | Impact | Scenario |
|----------|--------|----------|
| **CAC** | ±5% | +€200 CAC → +6mo breakeven |
| **Churn** | ±10% | 5% churn → sustainable; 15% churn → restructure |
| **ARPU** | ±20% | -€100/mois ARPU → +12mo breakeven |
| **Pricing** | ±15% | +10% price → -4mo breakeven |
| **Sales velocity** | ±30% | 50% fewer customers → +12mo runway |

### 8.2 Scenarios de stress

#### Conservative Scenario (-30% growth)

```
Y3 EBITDA : -€80k (not breakeven)
Y4 EBITDA : +€300k (delayed 1 year)
Outcome : Requires additional funding Y3
```

#### Aggressive Scenario (+50% growth)

```
Y2 EBITDA : +€50k (early breakeven!)
Y3 EBITDA : +€600k (strong)
Y4 EBITDA : +€1.5M (high profitability)
Outcome : Self-funded by Y2 Q3
```

**Realistic assumption :** Base case (25% growth)

---

## 9. FUNDING STRATEGY

### 9.1 Round de financement

#### Pre-seed (€100k – Avant produit)

**Source :** Savings + family/friends
**Usage :**
- Dev + MVP : €60k
- Legal/compliance : €15k
- 6-month runway : €25k

#### Seed (€400k – Y1/Y2)

**Source :** Angel investors + early VC
**Valuation :** €2M (10-15x revenue multiple)
**Usage :**
- Sales & marketing : €150k
- 12-month runway : €150k
- Dev team scale : €100k

**Expected investors :** 5-10 angels + 1-2 micro-VCs

#### Series A (€1-2M – Optional Y3)

**Trigger :** Strong unit economics + early profitability
**Source :** Growth-stage VCs
**Not needed if organic profitability achieved**

---

## 10. KEY METRICS & DASHBOARDS

### 10.1 North Star Metrics

| Metric | Y1 Target | Y3 Target | Y5 Target |
|--------|-----------|-----------|-----------|
| **ARR** | €45k | €750k | €3.6M |
| **Customers** | 15 | 180 | 650 |
| **Net Retention** | 90% | 110% | 120% |
| **CAC Payback** | 5mo | 3mo | 2mo |
| **Gross Margin** | 67% | 76% | 90% |
| **Rule of 40** | -100 | 81 | 153 |

📌 **Rule of 40 :** Growth % + Margin % = 40+ (healthy SaaS)

### 10.2 Dashboard mensuel

**Suivi continu :**
- MRR (Monthly Recurring Revenue)
- Churn rate
- CAC vs LTV
- Burn rate vs runway
- Pipeline value (sales)

---

## 11. EXIT SCENARIOS

### 11.1 M&A Opportunities

**Acquéreurs potentiels :**

| Acquéreur | Rationale | Multiple |
|-----------|-----------|----------|
| **Lexom / Jurisprudence** | Expansion produit | 5-8x revenue |
| **Thomson Reuters / LexisNexis** | Tech library + legal |  8-12x revenue |
| **Micro-VCs** | Bolt-on acquisition | 3-5x revenue |
| **LegalTech consolidator** | Portfolio play | 6-10x revenue |

**Timeline :** Y4-5 (après profitabilité établie)

### 11.2 IPO Scenario

**Conditions :**
- €10M+ ARR (realistic Y6)
- 40%+ EBITDA margin
- Strong unit economics
- Market validation

**Not primary goal (70% bootstrapped growth expected)**

---

## 12. RISKS & MITIGATIONS

### 12.1 Key Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Market adoption slow** | Medium | High | Early validation via pilots |
| **Churn > 10%** | Low | Critical | Product-market fit focus |
| **Competition from big tech** | High | Medium | Niche focus (CESEDA) + trust |
| **Regulation (IA)** | Medium | High | EU-first, audit-ready design |
| **Talent acquisition** | Medium | Medium | Remote + equity + culture |

---

## 13. CONCLUSIONS & RECOMMANDATIONS

### 13.1 Investability Summary

✅ **Attraktif pour investisseurs :**
- Large TAM (€40M+ potential)
- Strong unit economics (LTV:CAC 30:1)
- Early profitability (Y3)
- Differentiation (Zero Ignored Information)
- Regulatory-ready (RGPD + audit trail)

### 13.2 Next Steps

**Q1 2026 :**
1. Pre-seed closing (€100k)
2. MVP launch (5 beta customers)
3. Market validation (10+ interviews)

**Q2 2026 :**
1. Product refinement
2. Seed pitch prep
3. Sales process testing

**Q3 2026 :**
1. Seed round opening
2. Scaling sales
3. Team expansion

---

## APPENDIX A : FINANCIAL ASSUMPTIONS

**Documented assumptions for audit :**

- Customer growth : Linear 15 → 60 → 180 → 350 → 650
- Churn rate : 5% monthly (industry avg 4-7%)
- ARPU growth : €250 → €460 (mix improvement + upsell)
- CAC : €500 (blended across channels)
- LTV : €15,000 (5-year horizon)
- Tax rate : 0% Y1-2 (losses), 25% Y3+ (standard French corporate)

**Sensitivity inputs changeable :**
```excel
// Available for sensitivity analysis
CAC_TARGET = €500
CHURN_RATE = 0.05
ARR_GROWTH_RATE = 0.200  // Year-over-year
```

---

**FIN PRÉVISIONNEL FINANCIER**

✅ **Document ready for investor pitch**

Dernière maj : 22/01/2026
