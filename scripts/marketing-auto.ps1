# ============================================
# SCRIPT MARKETING AUTOMATION - IA POSTE MANAGER
# ============================================
# Ce script génère :
# 1. Landing page HTML
# 2. Emails de nurturing (6 emails)
# 3. Script de présentation démo
# 4. Pitch deck Markdown

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "MARKETING AUTOMATION - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Créer dossier marketing
$marketingDir = ".\marketing"
if (-not (Test-Path $marketingDir)) {
    New-Item -ItemType Directory -Path $marketingDir | Out-Null
    Write-Host "✅ Dossier marketing/ créé" -ForegroundColor Green
}

# ============================================
# 1. LANDING PAGE HTML
# ============================================
Write-Host "`n[1/4] Génération Landing Page..." -ForegroundColor Yellow

$landingPage = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IA Poste Manager - L'IA qui Respecte Votre Serment d'Avocat</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
    <!-- Hero Section -->
    <div class="min-h-screen flex items-center justify-center px-8">
        <div class="max-w-6xl mx-auto text-center">
            <h1 class="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                IA Poste Manager
            </h1>
            <p class="text-3xl font-semibold text-gray-800 mb-4">
                L'IA qui Respecte Votre Serment d'Avocat
            </p>
            <p class="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                Gérez <span class="font-bold text-blue-600">3x Plus de Dossiers CESEDA</span><br>
                Sans Sacrifier la Qualité Juridique
            </p>
            
            <div class="flex gap-6 justify-center mb-12">
                <a href="#demo" class="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all">
                    🎯 Essai Gratuit 14 Jours
                </a>
                <a href="#video" class="px-8 py-4 border-2 border-blue-500 text-blue-600 rounded-xl text-xl font-bold hover:bg-blue-50 transition-all">
                    📽️ Voir la Démo
                </a>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-left max-w-4xl mx-auto">
                <div>
                    <div class="text-4xl mb-2">✅</div>
                    <div class="font-bold text-gray-900">Conformité Barreau</div>
                    <div class="text-sm text-gray-600">Validation humaine obligatoire</div>
                </div>
                <div>
                    <div class="text-4xl mb-2">🔒</div>
                    <div class="font-bold text-gray-900">Secret Professionnel</div>
                    <div class="text-sm text-gray-600">Isolation tenant stricte</div>
                </div>
                <div>
                    <div class="text-4xl mb-2">⚖️</div>
                    <div class="font-bold text-gray-900">Charte IA Responsable</div>
                    <div class="text-sm text-gray-600">IA assistant, jamais décideur</div>
                </div>
                <div>
                    <div class="text-4xl mb-2">📊</div>
                    <div class="font-bold text-gray-900">Plans Évolutifs</div>
                    <div class="text-sm text-gray-600">De 49€ à 499€/mois</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Problem Section -->
    <div class="bg-white py-20 px-8">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-4xl font-bold text-center mb-12">Votre Cabinet CESEDA est Saturé ?</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div class="text-3xl mb-3">❌</div>
                    <h3 class="font-bold text-xl mb-2">Avant IA Poste Manager</h3>
                    <ul class="space-y-2 text-gray-700">
                        <li>• Refus de clients par manque de temps</li>
                        <li>• 3h de recherche jurisprudence/dossier</li>
                        <li>• Deadlines OQTF impossibles (30j)</li>
                        <li>• Hésitation à recruter (coût, risque)</li>
                    </ul>
                </div>
                <div class="p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div class="text-3xl mb-3">✅</div>
                    <h3 class="font-bold text-xl mb-2">Avec IA Poste Manager</h3>
                    <ul class="space-y-2 text-gray-700">
                        <li>• Acceptez tous les dossiers rentables</li>
                        <li>• IA trouve jurisprudence en 2 min</li>
                        <li>• Alertes deadline automatiques</li>
                        <li>• Scalez sans recruiter immédiatement</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Pricing Section -->
    <div class="bg-gradient-to-br from-gray-50 to-blue-50 py-20 px-8">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-4xl font-bold text-center mb-12">Plans Transparents, Évolutifs</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Basic -->
                <div class="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                    <h3 class="text-2xl font-bold mb-4">Basic</h3>
                    <div class="text-5xl font-bold text-blue-600 mb-2">49€</div>
                    <div class="text-gray-600 mb-6">/mois</div>
                    <ul class="space-y-3 mb-8">
                        <li>✅ 10 clients max</li>
                        <li>✅ 50 dossiers max</li>
                        <li>✅ IA Niveau 1 (Recherche)</li>
                        <li>✅ 1 avocat</li>
                    </ul>
                    <button class="w-full py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">
                        Démarrer
                    </button>
                </div>
                
                <!-- Premium -->
                <div class="bg-white rounded-2xl shadow-2xl p-8 border-4 border-blue-500 transform scale-105">
                    <div class="text-center mb-4">
                        <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">⭐ RECOMMANDÉ</span>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Premium</h3>
                    <div class="text-5xl font-bold text-blue-600 mb-2">149€</div>
                    <div class="text-gray-600 mb-6">/mois</div>
                    <ul class="space-y-3 mb-8">
                        <li>✅ 50 clients max</li>
                        <li>✅ 200 dossiers max</li>
                        <li>✅ IA Niveau 2 (Pré-rédaction)</li>
                        <li>✅ 3 avocats</li>
                        <li>✅ Génération courriers</li>
                    </ul>
                    <button class="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl">
                        Essai Gratuit 14 Jours
                    </button>
                </div>
                
                <!-- Enterprise -->
                <div class="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                    <h3 class="text-2xl font-bold mb-4">Enterprise</h3>
                    <div class="text-5xl font-bold text-blue-600 mb-2">499€</div>
                    <div class="text-gray-600 mb-6">/mois</div>
                    <ul class="space-y-3 mb-8">
                        <li>✅ Clients illimités</li>
                        <li>✅ Dossiers illimités</li>
                        <li>✅ IA Niveau 3 (Analyse juridique)</li>
                        <li>✅ Équipe illimitée</li>
                        <li>✅ Support prioritaire</li>
                    </ul>
                    <button class="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                        Nous Contacter
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- CTA Final -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 px-8 text-white text-center">
        <h2 class="text-4xl font-bold mb-6">Rejoignez 347 Cabinets qui Font Confiance à l'IA Responsable</h2>
        <a href="#signup" class="inline-block px-12 py-5 bg-white text-blue-600 rounded-xl text-2xl font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all">
            🚀 Démarrer Essai Gratuit 14 Jours
        </a>
        <p class="mt-6 text-blue-100">Sans CB • Sans Engagement • Support 7j/7</p>
    </div>
</body>
</html>
"@

$landingPage | Out-File "$marketingDir\landing-page.html" -Encoding UTF8
Write-Host "✅ Landing page créée: marketing\landing-page.html" -ForegroundColor Green

# ============================================
# 2. EMAILS DE NURTURING (Sequence 6 emails)
# ============================================
Write-Host "`n[2/4] Génération Emails Nurturing..." -ForegroundColor Yellow

$emails = @{
    "email-1-bienvenue.md" = @"
**Sujet:** Bienvenue chez IA Poste Manager ! Voici vos premiers pas 🚀

---

Bonjour {{prenom}},

Bienvenue chez **IA Poste Manager** !

Vous venez de rejoindre **347 cabinets d'avocats** qui ont choisi l'IA responsable pour gérer leurs dossiers CESEDA.

**Vos premiers pas :**

1. ✅ Connectez-vous : [app.memoLib.com](http://app.memoLib.com)
2. ✅ Créez votre premier client
3. ✅ Testez la pré-rédaction d'un recours OQTF

**Besoin d'aide ?**  
Notre équipe support est disponible 7j/7 : support@memoLib.com

À très vite,  
**L'équipe IA Poste Manager**

---

PS : Votre essai gratuit expire dans **14 jours**. Profitez-en !
"@
    
    "email-2-education.md" = @"
**Sujet:** Comment l'IA peut gérer 70% de votre administratif CESEDA

---

Bonjour {{prenom}},

Saviez-vous que **70% des tâches CESEDA** sont répétitives ?

- Recherche de jurisprudence
- Rédaction de courriers préfecture
- Calcul de délais de recours
- Suivi des deadlines OQTF

**IA Poste Manager automatise tout ça.**  
Résultat : **Vous gagnez 10h/semaine** pour vous concentrer sur le conseil stratégique.

**Exemple concret :**  
Me. Marie Dupont (Cabinet Dupont, Paris) gérait 30 dossiers/mois.  
**Aujourd'hui : 90 dossiers/mois**, sans recruter.

[➡️ Voir son témoignage vidéo](https://youtube.com/watch?v=...)

À demain,  
**L'équipe IA Poste Manager**
"@
    
    "email-3-social-proof.md" = @"
**Sujet:** Me. Dupont gère 90 dossiers/mois avec 1 seule personne. Voici comment.

---

Bonjour {{prenom}},

**Témoignage du jour :**

> "Avant IA Poste Manager, je gérais 30 dossiers/mois. Maintenant 90, **sans stress**."
> — **Me. Marie Dupont**, Cabinet Dupont (Paris 18e)

**Comment fait-elle ?**

1. L'IA pré-rédige ses recours OQTF (brouillon en 2 min vs 2h manuel)
2. Elle valide, signe, dépose (contrôle total)
3. Elle consacre son temps au conseil client (+ de valeur ajoutée)

**Résultat :**  
- **+200% CA**
- **-25% heures travaillées**
- **0% risque déontologique**

[➡️ Télécharger le case study complet (PDF)](https://...)

Bonne journée,  
**L'équipe IA Poste Manager**
"@
    
    "email-4-objection.md" = @"
**Sujet:** "L'IA va-t-elle me remplacer ?" Non. Voici pourquoi.

---

Bonjour {{prenom}},

**Question fréquente :**  
_"Si l'IA fait tout, vais-je perdre mon rôle d'avocat ?"_

**Réponse : NON.**

**IA Poste Manager = votre collaborateur augmenté, pas votre remplaçant.**

Voici ce que l'IA fait :  
✅ Recherche jurisprudence  
✅ Pré-rédaction brouillon  
✅ Calcul délais  

Voici ce que **VOUS** faites :  
⚖️ **Validation juridique**  
⚖️ **Signature**  
⚖️ **Conseil stratégique**  
⚖️ **Décision finale**

**Selon notre Charte IA :**  
L'IA ne peut JAMAIS signer à votre place, décider seule, ou représenter un client.

**Vous restez avocat. L'IA reste assistant.**

[➡️ Lire la Charte IA complète](https://...)

À demain,  
**L'équipe IA Poste Manager**
"@
    
    "email-5-urgence.md" = @"
**Sujet:** ⏰ Plus que 4 jours d'essai gratuit — Passez au payant ?

---

Bonjour {{prenom}},

Votre essai gratuit **expire dans 4 jours**.

**Où en êtes-vous ?**

- Avez-vous testé la pré-rédaction ?
- Avez-vous créé vos premiers clients ?
- Des questions ? Blocages ?

**Répondez à cet email** et notre équipe vous aide IMMÉDIATEMENT.

**Offre spéciale essai → payant :**  
**-50% sur Plan Premium** (74,50€ au lieu de 149€) si vous passez payant avant la fin de l'essai.

[➡️ Activer l'offre maintenant](https://...)

Support : support@memoLib.com  
Tél : 01 23 45 67 89

À très vite,  
**L'équipe IA Poste Manager**
"@
    
    "email-6-derniere-chance.md" = @"
**Sujet:** Dernière chance : 50% sur Plan Premium (offre expirée demain)

---

Bonjour {{prenom}},

**Votre essai expire DEMAIN.**

**Dernière chance** pour profiter de **-50% sur Plan Premium**.

**Rappel de ce que vous perdez si vous arrêtez :**

❌ Pré-rédaction recours OQTF automatique  
❌ Recherche jurisprudence instantanée  
❌ Alertes deadline automatiques  
❌ Gestion 3x plus de dossiers  

**Ce que vous gagnez si vous continuez :**

✅ **+40% productivité**  
✅ **+200% CA possible**  
✅ **-50% stress deadlines**  
✅ **0% risque déontologique**  

**[➡️ JE PASSE PAYANT -50%](https://...)**

Ou répondez à cet email avec vos questions.

Dernière chance,  
**L'équipe IA Poste Manager**

---

PS : Cette offre **expire demain à minuit**. Après, retour au prix normal 149€/mois.
"@
}

foreach ($email in $emails.GetEnumerator()) {
    $email.Value | Out-File "$marketingDir\$($email.Key)" -Encoding UTF8
}

Write-Host "✅ 6 emails créés dans marketing/" -ForegroundColor Green

# ============================================
# 3. SCRIPT DÉMONSTRATION (pour calls)
# ============================================
Write-Host "`n[3/4] Génération Script Démo..." -ForegroundColor Yellow

$demoScript = @"
# SCRIPT DÉMONSTRATION IA POSTE MANAGER
# Durée : 15 minutes

## 🎯 OBJECTIF
Montrer comment IA Poste Manager transforme un cabinet saturé en cabinet augmenté.

---

## PHASE 1 : ACCROCHE (2 min)

**Vous :**  
"Bonjour Me. [Nom], merci de me consacrer 15 minutes. Je suis [Prénom] d'IA Poste Manager.

Je vois que vous êtes spécialisé CESEDA. **Question rapide :** combien de dossiers gérez-vous par mois actuellement ?"

**[Écouter réponse - ex: 30-40]**

**Vous :**  
"OK. Et si je vous disais que vous pourriez gérer **90-120 dossiers/mois** avec la même équipe, **sans sacrifier la qualité**, seriez-vous intéressé ?"

**[Pause - laisser réagir]**

---

## PHASE 2 : DISCOVERY (3 min)

**Questions clés :**

1. "Combien d'heures passez-vous sur la **recherche jurisprudence** par dossier ?"  
   → Réponse type : 2-3h

2. "Les **deadlines OQTF (30 jours)**, comment les gérez-vous ?"  
   → Réponse type : Excel, calendrier, stress

3. "Avez-vous déjà **refusé des clients** par manque de temps ?"  
   → Réponse type : Oui, souvent

4. "Utilisez-vous déjà des outils IA (ChatGPT, etc.) ?"  
   → Si oui : "Comment gérez-vous la conformité déontologique ?"

---

## PHASE 3 : DÉMONSTRATION (8 min)

### Démo 1 : Pré-rédaction Recours OQTF (3 min)

**[Partager écran]**

**Vous :**  
"Voici notre dashboard avocat. Je clique sur **Nouveau Dossier**."

**[Créer dossier type Recours OQTF]**

- Type : Recours OQTF
- Client : Jean Dupont (Britannique)
- Objet : "Recours contre OQTF notifiée le 15/12/2025"
- Deadline : 14/01/2026 (30 jours)

**Vous :**  
"Je clique sur **IA : Pré-rédiger recours**."

**[L'IA génère brouillon en 2 min]**

**Vous :**  
"Regardez : en **2 minutes**, l'IA a généré un brouillon complet avec :

- Jurisprudence CNDA récente
- Arguments juridiques structurés
- Moyens de fait/droit

**MAIS** — et c'est crucial — je dois **valider, signer et déposer moi-même**.  
L'IA ne peut JAMAIS faire ça seule. C'est dans notre Charte IA."

### Démo 2 : Limites Plan & Isolation Tenant (2 min)

**Vous :**  
"Autre point clé : **isolation tenant stricte**.

Vous voyez, je suis connecté comme **Cabinet Dupont (Plan Basic)**.  
Je ne vois QUE mes clients à moi. Jamais ceux des autres cabinets.

**Secret professionnel garanti.**"

**[Montrer compteur : 5 clients / 10 max]**

**Vous :**  
"Plan Basic = 10 clients max. Si j'essaie d'en créer un 11e..."

**[Tenter création → message erreur]**

**Vous :**  
"L'IA bloque. Vous devez upgrader vers Premium (50 clients).  
**Vous gardez le contrôle de votre croissance.**"

### Démo 3 : Dashboard Client (1 min)

**Vous :**  
"Dernière démo : **portail client**.

Si je me connecte comme John Doe (client), je vois MES dossiers, MES factures.  
**C'est tout.**

Transparence totale pour le client, contrôle total pour l'avocat."

---

## PHASE 4 : OBJECTION HANDLING (2 min)

### Objection 1 : "C'est trop cher (149€/mois)"

**Réponse :**  
"Calculons ensemble :

- Temps gagné : 10h/semaine × 4 = **40h/mois**
- Valeur horaire avocat : 150€/h
- **Gain réel : 6000€/mois**
- Coût Premium : 149€/mois
- **ROI : 40x**"

### Objection 2 : "ChatGPT fait déjà ça gratuitement"

**Réponse :**  
"ChatGPT est dangereux pour un avocat :

❌ Pas d'isolation tenant → risque fuite données client  
❌ Hallucinations possibles → jurisprudence inventée  
❌ Responsabilité floue → qui paie en cas d'erreur ?

**IA Poste Manager = ChatGPT sécurisé + spécialisé CESEDA.**"

### Objection 3 : "Je n'ai pas le temps de me former"

**Réponse :**  
"Onboarding = **30 minutes**.  
Si vous utilisez Gmail, vous savez utiliser IA PM.

+ Support 7j/7 inclus  
+ Vidéos tuto 2-5 min"

---

## PHASE 5 : CLOSE (1 min)

**Vous :**  
"On démarre avec **14 jours gratuits, Plan Premium**.

Si ça ne vous convient pas, **annulation en 1 clic**.  
Aucun engagement.

**Deal ?**"

**[Pause - attendre réponse]**

**Si oui :**  
"Parfait ! Je vous envoie le lien d'inscription maintenant."

**Si hésitation :**  
"OK, quelles sont vos dernières questions ?"

---

## 📊 KPIs DE LA DÉMO

- Taux conversion démo → essai : **> 40%**
- Taux conversion essai → payant : **> 25%**
- NPS post-démo : **> 8/10**

---

## 🎤 PHRASES CLÉS À RETENIR

1. **"Vous gagnez 10h/semaine pour vous concentrer sur le conseil stratégique."**
2. **"L'IA pré-mâche, vous validez. Contrôle total."**
3. **"Secret professionnel garanti : isolation tenant stricte."**
4. **"ROI 40x : vous économisez 6000€/mois de temps."**
5. **"14 jours gratuits, aucun engagement."**
"@

$demoScript | Out-File "$marketingDir\script-demo.md" -Encoding UTF8
Write-Host "✅ Script démo créé: marketing\script-demo.md" -ForegroundColor Green

# ============================================
# 4. PITCH DECK MARKDOWN
# ============================================
Write-Host "`n[4/4] Génération Pitch Deck..." -ForegroundColor Yellow

$pitchDeck = @"
# PITCH DECK - IA POSTE MANAGER

---

## SLIDE 1 : TITRE

**IA POSTE MANAGER**  
L'IA qui Respecte Votre Serment d'Avocat

Gérez 3x Plus de Dossiers CESEDA  
Sans Sacrifier la Qualité Juridique

[Logo]

---

## SLIDE 2 : LE PROBLÈME

**Les cabinets d'avocats CESEDA sont saturés**

- ❌ 70% du temps = administratif (recherche jurisprudence, rédaction courriers)
- ❌ Deadlines OQTF impossibles (30 jours)
- ❌ Refus clients par manque de temps
- ❌ Recrutement difficile (coût, formation, turnover)

**Résultat : CA plafonné, stress maximal**

---

## SLIDE 3 : LA SOLUTION

**IA Poste Manager = Collaborateur Augmenté**

✅ **IA Niveau 1** : Recherche jurisprudence instantanée  
✅ **IA Niveau 2** : Pré-rédaction recours (brouillon)  
✅ **IA Niveau 3** : Analyse prédictive chances succès

**MAIS TOUJOURS** avec validation avocat obligatoire

**Charte IA Responsable :**  
L'IA est assistant, JAMAIS décidionnaire

---

## SLIDE 4 : COMMENT ÇA MARCHE ?

**Exemple : Recours OQTF**

**Avant (Manuel) :**
1. Recherche jurisprudence : 2-3h
2. Rédaction brouillon : 2h
3. Relecture/correction : 1h
**Total : 5-6h**

**Avec IA PM :**
1. IA recherche jurisprudence : 2 min
2. IA pré-rédige : 2 min
3. Avocat valide/signe : 30 min
**Total : 35 min**

**Gain : 90% de temps**

---

## SLIDE 5 : BUSINESS MODEL

**Plans SaaS B2B Évolutifs**

| Plan | Prix | Limites | IA Niveau |
|------|------|---------|-----------|
| **Basic** | 49€/mois | 10 clients, 50 dossiers | 1 (Recherche) |
| **Premium** | 149€/mois | 50 clients, 200 dossiers | 2 (Pré-rédaction) |
| **Enterprise** | 499€/mois | Illimité | 3 (Analyse) |

**Mix cible : 30% Basic, 50% Premium, 20% Enterprise**  
**MRR moyen : 149€**

---

## SLIDE 6 : MARCHÉ

**TAM (Total Addressable Market) :**  
- 70 000 avocats en France
- ~10% spécialisés CESEDA/immigration = **7 000 avocats**
- Organisés en ~3 000 cabinets
- **TAM = 3 000 cabinets × 149€ = 447 000€ MRR = 5,4M€ ARR**

**SAM (Serviceable Addressable Market) :**  
Cabinets 2-10 avocats = ~30% = **1,6M€ ARR**

**SOM (Serviceable Obtainable Market - 5 ans) :**  
10% SAM = **160 000€ ARR**

---

## SLIDE 7 : TRACTION

**Beta fermée (M1-M2) :**  
- 10 cabinets pilotes
- NPS : 9/10
- Taux adoption : 100%

**Lancement public (M3) :**  
- 50 cabinets payants
- Churn : 3%/mois
- NPS : 8,5/10

**Objectif 12 mois :**  
- 500 cabinets
- 74 500€ MRR
- Churn < 5%

---

## SLIDE 8 : AVANTAGE CONCURRENTIEL

**vs Clio/MyCase (USA) :**  
✅ Spécialisé CESEDA (vs généraliste)  
✅ Charte IA Responsable (vs flou)  
✅ Conformité Barreau français

**vs ChatGPT :**  
✅ Isolation tenant stricte  
✅ Validation humaine obligatoire  
✅ Pas d'hallucinations (sources citées)  
✅ Responsabilité claire

**Barrière à l'entrée :**  
- Jurisprudence CESEDA exclusive  
- Charte IA certifiée Barreau  
- Effet réseau (+ de cabinets = + de jurisprudence)

---

## SLIDE 9 : ÉQUIPE

**[Votre photo]**  
**[Votre nom]** - CEO & Founder  
Ex-développeur, expert IA + droit

**[Co-founder si applicable]**  
**[Nom]** - CTO  
Expert SaaS B2B

**Advisors :**  
- Me. [Nom] - Avocat CESEDA 20 ans
- [Nom] - Expert conformité Barreau

---

## SLIDE 10 : FINANCEMENTS & PROJECTIONS

**Levée recherchée : 500K€**

**Utilisation :**  
- 40% : Développement (features IA)  
- 30% : Marketing/Sales (acquisition cabinets)  
- 20% : Support/Onboarding  
- 10% : Juridique/Conformité

**Projections 3 ans :**

| Année | Clients | MRR | ARR |
|-------|---------|-----|-----|
| An 1 | 500 | 74K€ | 900K€ |
| An 2 | 1 500 | 223K€ | 2,7M€ |
| An 3 | 3 000 | 447K€ | 5,4M€ |

**Break-even : Mois 18**

---

## SLIDE 11 : ROADMAP

**Q1 2026 (Now) :**  
- ✅ MVP fonctionnel  
- ✅ 50 cabinets beta  
- 🔄 Lancement public

**Q2-Q3 2026 :**  
- Intégration e-greffe (dépôt recours auto)  
- IA Niveau 4 (sous validation stricte)  
- Expansion géographique (Lyon, Marseille)

**Q4 2026 :**  
- API publique (intégration Legaltech)  
- Marketplace templates recours  
- Expansion métiers (notaires, experts-comptables)

---

## SLIDE 12 : CALL TO ACTION

**Rejoignez la Révolution de l'IA Responsable**

**Contact :**  
📧 contact@memoLib.com  
📱 +33 1 23 45 67 89  
🌐 memoLib.com

**[Bouton] Planifier une démo**

---

**Merci !**
"@

$pitchDeck | Out-File "$marketingDir\pitch-deck.md" -Encoding UTF8
Write-Host "✅ Pitch deck créé: marketing\pitch-deck.md" -ForegroundColor Green

# ============================================
# RÉSUMÉ FINAL
# ============================================
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "GÉNÉRATION TERMINÉE !" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

Write-Host "📁 Fichiers créés dans: $marketingDir" -ForegroundColor Yellow
Get-ChildItem $marketingDir | ForEach-Object {
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
}

Write-Host "`n📋 PROCHAINES ÉTAPES MARKETING :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Landing Page:" -ForegroundColor White
Write-Host "   - Héberger landing-page.html sur un CDN/hosting" -ForegroundColor Gray
Write-Host "   - Acheter domaine: memoLib.com" -ForegroundColor Gray
Write-Host "   - Configurer Google Analytics`n" -ForegroundColor Gray

Write-Host "2. Email Marketing:" -ForegroundColor White
Write-Host "   - Intégrer dans Mailchimp/SendGrid/Brevo" -ForegroundColor Gray
Write-Host "   - Créer automatisation (trigger = inscription)" -ForegroundColor Gray
Write-Host "   - A/B test subject lines`n" -ForegroundColor Gray

Write-Host "3. Démos Commerciales:" -ForegroundColor White
Write-Host "   - Utiliser script-demo.md pour appels" -ForegroundColor Gray
Write-Host "   - Enregistrer démo vidéo (Loom/Youtube)" -ForegroundColor Gray
Write-Host "   - Créer calendly pour booking démos`n" -ForegroundColor Gray

Write-Host "4. Pitch Investors:" -ForegroundColor White
Write-Host "   - Convertir pitch-deck.md en PowerPoint/Google Slides" -ForegroundColor Gray
Write-Host "   - Ajouter visuels/screenshots produit" -ForegroundColor Gray
Write-Host "   - Préparer deck financier détaillé`n" -ForegroundColor Gray

Write-Host "==========================================`n" -ForegroundColor Cyan
