# 🚀 IA Poste Manager - Multi-Tenant sur Render

## Déploiement Automatique

### URLs de Production
- **Cabinet Dupont**: https://cabinet-dupont.onrender.com
- **Cabinet Martin**: https://cabinet-martin.onrender.com  
- **Cabinet Bernard**: https://cabinet-bernard.onrender.com

### Login Universel
- **Username**: `admin`
- **Password**: `admin123`

### Déploiement
1. Aller sur [render.com](https://render.com)
2. New > Blueprint
3. Connect Repository: `mobby57/iapostemanager`
4. Branch: `multitenant-render`
5. Deploy from `render.yaml`
6. 3 services créés automatiquement

### Features
- ✅ Multi-tenant avec isolation complète
- ✅ SSL automatique gratuit
- ✅ Déploiement Git automatique
- ✅ API REST sécurisée
- ✅ Interface Bootstrap responsive

### Architecture
Chaque client a sa propre instance isolée avec données séparées.
