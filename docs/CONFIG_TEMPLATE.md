# CONFIGURATION - TEMPLATE DE PERSONNALISATION

Ce fichier contient tous les champs à personnaliser dans la documentation. Remplissez ce template et utilisez-le pour effectuer des recherches/remplacements globales dans les fichiers docs.

---

## 1. INFORMATIONS SOCIÉTÉ

### Identité juridique

```yaml
# À remplacer dans tous les fichiers docs
société_nom: "[Votre Société SAS]"
société_nom_réel: "MonCabinet Innovation SAS"  # Exemple

siret: "[Numéro SIRET]"
siret_réel: "123 456 789 00012"  # Exemple

rcs_ville: "[Ville]"
rcs_ville_réel: "Paris"  # Exemple

capital: "[montant]"
capital_réel: "50 000 euros"  # Exemple

adresse_siège: "[Adresse complète]"
adresse_siège_réel: "42 Avenue des Champs-Élysées, 75008 Paris"  # Exemple
```

### Contact

```yaml
email_général: "contact@votre-societe.com"
email_général_réel: "contact@moncabinet-innovation.fr"  # Exemple

email_support: "support@votre-societe.com"
email_support_réel: "support@moncabinet-innovation.fr"  # Exemple

email_dpo: "dpo@votre-societe.com"
email_dpo_réel: "dpo@moncabinet-innovation.fr"  # Exemple

email_rgpd: "rgpd@votre-societe.com"
email_rgpd_réel: "rgpd@moncabinet-innovation.fr"  # Exemple

téléphone_général: "[Numéro]"
téléphone_général_réel: "+33 1 42 XX XX XX"  # Exemple

téléphone_dpo: "[Numéro]"
téléphone_dpo_réel: "+33 1 42 XX XX XX"  # Exemple
```

---

## 2. RESPONSABLES

### DPO (Délégué à la Protection des Données)

```yaml
dpo_nom: "[Nom DPO]"
dpo_nom_réel: "Marie DUPONT"  # Exemple

dpo_email: "dpo@votre-societe.com"
dpo_email_réel: "marie.dupont@moncabinet-innovation.fr"  # Exemple

dpo_téléphone: "[Numéro]"
dpo_téléphone_réel: "+33 6 12 34 56 78"  # Exemple
```

### Direction

```yaml
ceo_nom: "[Votre nom]"
ceo_nom_réel: "Jean MARTIN"  # Exemple

ceo_background: "[Background]"
ceo_background_réel: "Avocat spécialisé en droit des étrangers (15 ans d'expérience) + MBA"  # Exemple

ceo_email: "[votre-email]"
ceo_email_réel: "jean.martin@moncabinet-innovation.fr"  # Exemple

ceo_linkedin: "[votre-profil]"
ceo_linkedin_réel: "linkedin.com/in/jeanmartin"  # Exemple
```

---

## 3. INFORMATIONS TECHNIQUES

### Hébergement

```yaml
hébergeur: "[Nom hébergeur]"
hébergeur_réel: "OVHcloud"  # Exemple

hébergeur_localisation: "[Pays/Ville]"
hébergeur_localisation_réel: "Roubaix, France (UE)"  # Exemple

datacenter_zones: "[Zones]"
datacenter_zones_réel: "France (RBX) + Allemagne (FRA) - Backup multi-zone"  # Exemple
```

### Sécurité

```yaml
certificats: "[Certificats obtenus]"
certificats_réel: "ISO 27001:2022 (en cours), HDS (Hébergeur de Données de Santé - Non applicable)"  # Exemple

pentest_fréquence: "[Fréquence]"
pentest_fréquence_réel: "Annuel (dernier : Janvier 2025 - Cabinet ACME Security)"  # Exemple

pentest_dernière_date: "[Date]"
pentest_dernière_date_réel: "15 janvier 2025"  # Exemple
```

---

## 4. DATES ET VALIDATION

### Documents officiels

```yaml
# DPIA (Data Protection Impact Assessment)
dpia_date_validation: "[À compléter]"
dpia_date_validation_réel: "1er février 2026"  # Exemple

dpia_signature_dpo: "[À compléter]"
dpia_signature_dpo_réel: "Marie DUPONT - DPO"  # Exemple

# DOSSIER CNIL
dossier_cnil_date_MAJ: "[Date de mise à jour]"
dossier_cnil_date_MAJ_réel: "1er février 2026"  # Exemple

# CGU/CGV
cgu_date_entrée_vigueur: "[Date]"
cgu_date_entrée_vigueur_réel: "1er mars 2026"  # Exemple
```

---

## 5. SOUS-TRAITANTS

### Liste complète (pour DOSSIER_CNIL.md)

```yaml
sous_traitant_1_nom: "[Nom]"
sous_traitant_1_nom_réel: "OVHcloud"  # Exemple

sous_traitant_1_service: "[Service]"
sous_traitant_1_service_réel: "Hébergement infrastructure cloud (serveurs, base de données)"

sous_traitant_1_localisation: "[Localisation]"
sous_traitant_1_localisation_réel: "France (Roubaix)"

sous_traitant_1_garanties: "[Garanties]"
sous_traitant_1_garanties_réel: "DPA signé, ISO 27001, RGPD"

# Ajouter sous_traitant_2, sous_traitant_3, etc.
```

---

## 6. INFORMATIONS COMMERCIALES

### Tarification

```yaml
plan_starter_prix: "[Prix]"
plan_starter_prix_réel: "99 € HT/mois"  # Exemple

plan_pro_prix: "[Prix]"
plan_pro_prix_réel: "299 € HT/mois"  # Exemple

plan_enterprise_prix: "[Prix]"
plan_enterprise_prix_réel: "Sur devis (à partir de 999 € HT/mois)"  # Exemple
```

### Investissement (pour PITCH_INVESTISSEURS.md)

```yaml
levée_montant: "[Montant]"
levée_montant_réel: "500 000 €"  # Exemple

levée_utilisation: "[Utilisation]"
levée_utilisation_réel: "Développement produit (40%), Commercial/Marketing (30%), R&D IA (20%), Juridique/Conformité (10%)"  # Exemple

valorisation_pré_money: "[Valorisation]"
valorisation_pré_money_réel: "2 000 000 €"  # Exemple
```

---

## 7. LIENS ET URLS

### Site web

```yaml
site_web: "[URL site]"
site_web_réel: "https://www.iapostemanager.fr"  # Exemple

url_cgu: "[URL CGU]"
url_cgu_réel: "https://www.iapostemanager.fr/cgu"  # Exemple

url_politique: "[URL Politique]"
url_politique_réel: "https://www.iapostemanager.fr/confidentialite"  # Exemple

url_gestion_cookies: "[lien-gestion-cookies]"
url_gestion_cookies_réel: "https://www.iapostemanager.fr/cookies"  # Exemple
```

---

## 8. CHAMPS SPÉCIFIQUES

### CHARTE_IA_JURIDIQUE.md

```yaml
charte_validateur: "*Document validé par : [À compléter]*"
charte_validateur_réel: "*Document validé par : Marie DUPONT (DPO) et Jean MARTIN (CEO) - 1er février 2026*"  # Exemple
```

### SYSTEM_PROMPTS.md

```yaml
prompt_marker_montant: '{"marker": "[À COMPLÉTER]", "reason": "Montant exact"}'
# Ce marker est intentionnel pour l'IA - à laisser tel quel
```

---

## 9. PROCÉDURE DE REMPLACEMENT

### Étape 1 : Remplir ce fichier

1. Remplacez tous les `_réel` par vos valeurs réelles
2. Vérifiez que tous les champs sont cohérents

### Étape 2 : Recherche/Remplacement manuel

**Méthode VS Code :**

1. Ouvrir "Rechercher et Remplacer" (Ctrl + Shift + H)
2. Activer "Recherche dans les fichiers"
3. Filtrer : `docs/**/*.md`
4. Remplacer un par un (exemples) :

```
Rechercher: [Votre Société SAS]
Remplacer par: MonCabinet Innovation SAS

Rechercher: [Numéro SIRET]
Remplacer par: 123 456 789 00012

Rechercher: [Adresse complète]
Remplacer par: 42 Avenue des Champs-Élysées, 75008 Paris
```

### Étape 3 : Script automatisé (optionnel)

**PowerShell script** (à créer : `scripts/replace-template.ps1`) :

```powershell
# Lire ce fichier et extraire les valeurs _réel
# Effectuer des remplacements automatiques dans docs/**/*.md
# Non fourni - à développer selon vos besoins
```

---

## 10. FICHIERS CONCERNÉS

**Liste des fichiers contenant des champs à remplacer :**

1. ✅ `docs/DPIA.md` (7 occurrences)
2. ✅ `docs/DOSSIER_CNIL.md` (3 occurrences)
3. ✅ `docs/PITCH_INVESTISSEURS.md` (5 occurrences)
4. ✅ `docs/CGU_CGV.md` (6 occurrences)
5. ✅ `docs/POLITIQUE_CONFIDENTIALITE.md` (8 occurrences)
6. ⚠️ `docs/CHARTE_IA_JURIDIQUE.md` (1 occurrence - validation)
7. ℹ️ `docs/prompts/SYSTEM_PROMPTS.md` (1 occurrence - marker IA intentionnel)

**Total : ~30 champs à personnaliser**

---

## 11. CHECKLIST DE VALIDATION

Après avoir complété tous les remplacements :

- [ ] Tous les `[Votre Société SAS]` remplacés
- [ ] Tous les `[Numéro SIRET]` remplacés
- [ ] Tous les `[Adresse complète]` remplacés
- [ ] Tous les `[Numéro]` (téléphone) remplacés
- [ ] Tous les `[Votre nom]` remplacés
- [ ] Toutes les dates `[À compléter]` remplacées
- [ ] Tous les emails personnalisés
- [ ] Tous les liens/URLs fonctionnels
- [ ] Relecture globale de la cohérence
- [ ] Validation par le DPO
- [ ] Validation par le responsable légal

---

## 12. RAPPEL LÉGAL

⚠️ **Important :** Certaines informations sont **obligatoires** légalement :

- **SIRET** : Vérifier sur https://entreprise.data.gouv.fr
- **DPO** : Désignation obligatoire (RGPD Art. 37) si traitement grande échelle de données sensibles
- **Adresse siège** : Doit correspondre au Kbis
- **Capital social** : Montant inscrit au RCS

**Vérifier la cohérence avec vos documents officiels (Kbis, statuts, etc.)**

---

**📝 Document de travail - Ne pas publier**

*Dernière mise à jour : Janvier 2026*
