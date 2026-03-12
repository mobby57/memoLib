# 🧭 Guide rapide: quand refactorer / quand reporter

## Objectif

Donner une règle simple d’équipe pour décider si une amélioration doit être faite **maintenant** ou mise en **backlog**.

---

## Refactorer maintenant (Go)

Refactorer dans la PR en cours si au moins un critère est vrai:

1. **Risque sécurité / conformité**
   - Ex: fuite potentielle de données, contrôle d’accès fragile, logs sensibles.
2. **Bloque la livraison ou la stabilité**
   - Ex: typecheck cassé, bug récurrent, dette qui empêche un correctif.
3. **Faible coût, fort gain**
   - Ex: duplication locale simple à extraire, helper partagé réutilisable immédiatement.
4. **Zone en cours de modification**
   - Si on touche déjà le module, faire le “nettoyage adjacent” minimal.

---

## Reporter en backlog (Wait)

Reporter si tous les points suivants sont vrais:

- Pas d’impact sécurité/compliance immédiat.
- Pas d’impact prod visible (pas d’incident, pas de régression).
- Changement large (plusieurs modules) avec risque de side effects.
- Valeur principalement long terme.

Dans ce cas, créer une tâche courte et actionnable: **contexte + impact + estimation + propriétaire**.

---

## Matrice de décision (30 secondes)

- **Impact élevé + effort faible** → faire maintenant.
- **Impact élevé + effort élevé** → découper en étapes et planifier.
- **Impact faible + effort faible** → faire si zone déjà ouverte.
- **Impact faible + effort élevé** → reporter.

---

## Règles de cadrage PR

1. Garder le refactor **local** à la zone touchée.
2. Éviter les changements “cosmétiques globaux” dans une PR fonctionnelle.
3. Conserver le comportement métier identique.
4. Vérifier systématiquement `lint` + `typecheck`.

---

## Exemples MemoLib

- ✅ **À faire maintenant**: centraliser `getToken` dans un helper partagé si plusieurs middlewares ont le même pattern.
- ✅ **À faire maintenant**: micro-optimisation sans impact fonctionnel (ex: éviter recherches répétées dans middleware quota).
- ⏳ **À reporter**: refonte complète de l’architecture des middlewares si aucune régression actuelle.
- ⏳ **À reporter**: migration massive de logs legacy tant qu’aucun risque RGPD n’est identifié.

---

## Format de ticket backlog recommandé

- **Titre**: verbe d’action + zone (`Refactor middleware quota`).
- **Pourquoi**: risque/coût actuel.
- **Critère de fin**: résultat observable.
- **Estimation**: S/M/L.
- **Owner**: responsable unique.
