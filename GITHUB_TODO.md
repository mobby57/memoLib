# ✅ MIGRATION CLOUDFLARE - CHECKLIST GITHUB

## 🎯 Résumé Rapide

Votre projet local utilise maintenant **Cloudflare Tunnel** au lieu de **ngrok**.

**URL Permanente :**
```
https://votes-additional-filed-definitions.trycloudflare.com
```

---

## 📋 Actions Requises sur GitHub (10 min)

### ✅ Checklist Complète

#### 1. Webhooks GitHub
- [ ] Aller sur https://github.com/mobby57/iapostemanager/settings/hooks
- [ ] Éditer chaque webhook existant (ou créer un nouveau)
- [ ] Changer **Payload URL** vers :
  ```
  https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
  ```
- [ ] Vérifier le **Secret** :
  ```
  117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889
  ```
- [ ] Tester avec "Redeliver" sur Recent Deliveries

#### 2. GitHub Secrets
- [ ] Aller sur https://github.com/mobby57/iapostemanager/settings/secrets/actions
- [ ] Ajouter/Modifier le secret :
  ```
  Name: GITHUB_WEBHOOK_SECRET
  Value: 117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889
  ```

#### 3. GitHub Variables
- [ ] Aller sur https://github.com/mobby57/iapostemanager/settings/variables/actions
- [ ] Ajouter ces 3 variables :
  ```
  Name: CLOUDFLARE_TUNNEL_URL
  Value: https://votes-additional-filed-definitions.trycloudflare.com

  Name: WEBHOOK_URL
  Value: https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github

  Name: PUBLIC_WEBHOOK_URL
  Value: https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
  ```

#### 4. Nettoyage (Optionnel)
- [ ] Supprimer anciens secrets ngrok (si présents) :
  - `NGROK_URL`
  - `NGROK_AUTHTOKEN`

#### 5. Test Final
- [ ] Faire un commit de test
- [ ] Vérifier que le webhook fonctionne dans GitHub → Settings → Webhooks → Recent Deliveries

---

## 🚀 Vérification Locale

Avant de modifier GitHub, lancez ce script pour vérifier votre configuration :

```powershell
.\verify-cloudflare-migration.ps1
```

Ce script vérifie :
- ✅ ngrok est bien arrêté
- ✅ Cloudflare Tunnel est actif
- ✅ Fichier .env est correct
- ✅ URL Cloudflare répond

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- 📘 [CLOUDFLARE_GITHUB_ACTIONS.md](./CLOUDFLARE_GITHUB_ACTIONS.md) - Guide complet
- 📘 [GITHUB_CLOUDFLARE_INTEGRATION.md](./GITHUB_CLOUDFLARE_INTEGRATION.md) - Intégration détaillée
- 📘 [MIGRATION_NGROK_TO_CLOUDFLARE.md](./MIGRATION_NGROK_TO_CLOUDFLARE.md) - Rapport migration

---

## 🎯 Liens Directs GitHub

| Action | Lien Direct |
|--------|-------------|
| **Webhooks** | https://github.com/mobby57/iapostemanager/settings/hooks |
| **Secrets** | https://github.com/mobby57/iapostemanager/settings/secrets/actions |
| **Variables** | https://github.com/mobby57/iapostemanager/settings/variables/actions |
| **Workflows** | https://github.com/mobby57/iapostemanager/actions |

---

## ❓ Questions Fréquentes

**Q: L'URL Cloudflare va changer ?**
R: Non, elle est permanente (contrairement à ngrok)

**Q: Que faire si le webhook ne marche pas ?**
R: Vérifier :
1. Cloudflare Tunnel est actif : `.\cloudflare-start.ps1`
2. Next.js tourne : `npm run dev`
3. Secret identique dans GitHub et `.env`

**Q: Dois-je faire ça souvent ?**
R: Non, une seule fois ! C'était le problème avec ngrok.

---

## ✅ Après Configuration

Une fois tout configuré, testez :

```bash
# 1. Faire un commit
git add .
git commit -m "test: webhook Cloudflare"
git push

# 2. Vérifier dans GitHub
# Settings → Webhooks → Recent Deliveries
# Doit afficher ✅ 200 OK
```

---

**🎉 C'est tout ! Votre migration est complète une fois ces actions GitHub faites.**
