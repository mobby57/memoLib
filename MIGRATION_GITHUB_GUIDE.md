# 🎯 MIGRATION CLOUDFLARE → GITHUB : GUIDE RAPIDE

## ✅ Situation Actuelle

Votre projet **iaPostemanage** utilise maintenant **Cloudflare Tunnel** (plus ngrok).

**URL Permanente Cloudflare :**
```
https://votes-additional-filed-definitions.trycloudflare.com
```

---

## 🚀 3 ACTIONS À FAIRE SUR GITHUB

### 1️⃣ Mettre à Jour les Webhooks (5 min)

**Lien direct :** https://github.com/mobby57/iapostemanager/settings/hooks

**Étapes :**
1. Cliquer sur le webhook existant (ou "Add webhook" si aucun)
2. Dans **Payload URL**, mettre :
   ```
   https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
   ```
3. Dans **Secret**, mettre :
   ```
   117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889
   ```
4. **Content type** : `application/json`
5. Cliquer **Update webhook** (ou **Add webhook**)
6. Tester avec "Redeliver" dans "Recent Deliveries"

---

### 2️⃣ Ajouter GitHub Secrets (2 min)

**Lien direct :** https://github.com/mobby57/iapostemanager/settings/secrets/actions

**Secret à ajouter :**
```
Name: GITHUB_WEBHOOK_SECRET
Value: 117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889
```

**Comment :**
1. Cliquer **New repository secret**
2. Copier/coller le nom et la valeur ci-dessus
3. Cliquer **Add secret**

---

### 3️⃣ Ajouter GitHub Variables (3 min)

**Lien direct :** https://github.com/mobby57/iapostemanager/settings/variables/actions

**Variables à ajouter :**

**Variable 1 :**
```
Name: CLOUDFLARE_TUNNEL_URL
Value: https://votes-additional-filed-definitions.trycloudflare.com
```

**Variable 2 :**
```
Name: WEBHOOK_URL
Value: https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
```

**Variable 3 :**
```
Name: PUBLIC_WEBHOOK_URL
Value: https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
```

**Comment :**
Pour chaque variable :
1. Cliquer **New repository variable**
2. Copier/coller le nom et la valeur
3. Cliquer **Add variable**

---

## ✅ Vérification Locale

Avant de modifier GitHub, vérifiez votre configuration :

```powershell
.\verify-cloudflare-migration.ps1
```

**Ce qui doit être OK :**
- ✅ ngrok n'est pas actif
- ✅ Cloudflare Tunnel est actif
- ✅ Fichier .env configuré avec Cloudflare

---

## 🧪 Test Final

Après avoir configuré GitHub :

```bash
# 1. Faire un commit de test
echo "# Test webhook Cloudflare" >> test.txt
git add test.txt
git commit -m "test: webhook Cloudflare"
git push

# 2. Vérifier sur GitHub
# Aller dans Settings → Webhooks → Recent Deliveries
# Doit afficher ✅ 200 OK
```

---

## 📚 Documentation Complète

- 📄 [CLOUDFLARE_GITHUB_ACTIONS.md](./CLOUDFLARE_GITHUB_ACTIONS.md) - Guide détaillé
- 📄 [GITHUB_TODO.md](./GITHUB_TODO.md) - Checklist complète
- 📄 [GITHUB_CLOUDFLARE_INTEGRATION.md](./GITHUB_CLOUDFLARE_INTEGRATION.md) - Intégration

---

## 🎯 Résumé Ultra-Rapide

| Où | Quoi | Valeur |
|----|------|--------|
| **Webhooks** | Payload URL | `https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github` |
| **Webhooks** | Secret | `117545...f7f889` |
| **Secrets** | GITHUB_WEBHOOK_SECRET | `117545...f7f889` |
| **Variables** | CLOUDFLARE_TUNNEL_URL | `https://votes-additional-filed-definitions.trycloudflare.com` |
| **Variables** | WEBHOOK_URL | `https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github` |
| **Variables** | PUBLIC_WEBHOOK_URL | `https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github` |

---

## ❓ Questions

**Q: L'URL va changer ?**
Non, elle est permanente (contrairement à ngrok qui changeait à chaque démarrage).

**Q: Dois-je refaire ça souvent ?**
Non, une seule fois ! C'est justement l'avantage de Cloudflare.

**Q: Et si ça ne marche pas ?**
1. Vérifiez que Cloudflare Tunnel est actif : `.\cloudflare-start.ps1`
2. Vérifiez que Next.js tourne : `npm run dev`
3. Vérifiez que le secret est identique partout

---

**🎉 C'est tout ! Une fois ces 3 actions faites, votre migration sera complète.**
