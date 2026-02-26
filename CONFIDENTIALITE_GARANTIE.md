# 🔒 GARANTIE DE CONFIDENTIALITÉ - MemoLib

## ✅ ENGAGEMENT : VOS DONNÉES RESTENT CHEZ VOUS

### 📍 **Stockage 100% local**
- Base de données SQLite locale (`memolib.db`)
- Fichiers dans dossier `uploads/` local
- Aucun cloud par défaut

### 🚫 **Aucun service externe**
- ❌ Pas d'OpenAI ou IA externe
- ❌ Pas de télémétrie Microsoft
- ❌ Pas d'analytics Google
- ❌ Pas de tracking tiers

### 📧 **Emails : Connexion directe**
- IMAP/SMTP direct vers votre serveur
- Chiffrement TLS bout-en-bout
- Pas de proxy ou intermédiaire

### 🛡️ **Configuration sécurisée**
```json
"AllowedHosts": "localhost;127.0.0.1;memolib.local"
```

### 🔐 **Pour production - Renforcer la sécurité**

1. **Firewall strict**
```bash
# Bloquer tout trafic sortant sauf email
iptables -A OUTPUT -p tcp --dport 993 -j ACCEPT  # IMAP
iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT  # SMTP
iptables -A OUTPUT -j DROP  # Bloquer le reste
```

2. **Réseau isolé**
```json
{
  "AllowedHosts": "192.168.1.100",  // IP fixe interne
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://192.168.1.100:5078"  // Réseau local uniquement
      }
    }
  }
}
```

3. **Monitoring réseau**
```bash
# Surveiller les connexions
netstat -an | grep :5078
ss -tuln | grep 5078
```

4. **Variables d'environnement**
```bash
# Pas de secrets dans les fichiers
export MEMOLIB_JWT_SECRET="votre-clé-secrète"
export MEMOLIB_EMAIL_PASSWORD="mot-de-passe-app"
```

### ✅ **Audit de sécurité**

**Vérifications effectuées :**
- ✅ Code source analysé : aucun appel externe
- ✅ Configuration réseau : localhost uniquement
- ✅ Base de données : SQLite locale
- ✅ IA : algorithmes locaux uniquement
- ✅ Emails : connexion directe IMAP/SMTP

### 📋 **Checklist déploiement sécurisé**

- [ ] Firewall configuré (ports 993, 587 uniquement)
- [ ] Variables d'environnement pour secrets
- [ ] Réseau isolé (pas d'accès internet)
- [ ] Monitoring connexions réseau
- [ ] Sauvegarde locale chiffrée
- [ ] Accès physique sécurisé au serveur

### 🏛️ **Conformité juridique**

**Secret professionnel respecté :**
- Données client jamais transmises
- Chiffrement local des données sensibles
- Audit trail complet
- Droit à l'oubli implémenté

### 📞 **Support**

En cas de doute sur la confidentialité :
1. Vérifiez les logs réseau
2. Analysez le trafic avec Wireshark
3. Consultez la documentation technique

**GARANTIE : Vos données d'avocat restent dans votre cabinet.**