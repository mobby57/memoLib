# 🎛️ Contrôle Total de l'Automatisation par l'Utilisateur

## 🎯 Philosophie

**L'utilisateur est MAÎTRE de son automatisation à TOUS les niveaux.**

Chaque fonctionnalité automatique peut être :
- ✅ Activée/Désactivée individuellement
- ⚙️ Configurée selon les besoins
- 🎚️ Ajustée en temps réel
- 🔄 Réinitialisée aux valeurs par défaut

---

## 📋 Paramètres Contrôlables

### 1. **Email Monitoring** 📧

```json
{
  "autoMonitorEmails": true,              // Activer/désactiver le monitoring
  "emailCheckIntervalSeconds": 60,        // Fréquence de vérification (30-3600s)
  "autoCreateCaseFromEmail": true,        // Créer dossier automatiquement
  "autoCreateClientFromEmail": true,      // Créer client automatiquement
  "autoExtractClientInfo": true           // Extraire téléphone/adresse
}
```

**Cas d'usage :**
- Cabinet occupé → `emailCheckIntervalSeconds: 30` (vérif toutes les 30s)
- Cabinet calme → `emailCheckIntervalSeconds: 300` (vérif toutes les 5min)
- Contrôle manuel → `autoCreateCaseFromEmail: false` (créer manuellement)

---

### 2. **Gestion Dossiers** 📁

```json
{
  "autoAssignCases": false,               // Assigner automatiquement
  "defaultAssignedUserId": "guid",        // À qui assigner par défaut
  "autoSetPriority": false,               // Définir priorité auto
  "defaultPriority": 3,                   // Priorité par défaut (1-5)
  "autoAddTags": false,                   // Ajouter tags auto
  "defaultTags": ["urgent", "nouveau"]    // Tags par défaut
}
```

**Cas d'usage :**
- Avocat solo → `autoAssignCases: true, defaultAssignedUserId: self`
- Cabinet équipe → `autoAssignCases: false` (manager assigne)
- Triage auto → `autoSetPriority: true, defaultPriority: 3`

---

### 3. **Notifications** 🔔

```json
{
  "enableNotifications": true,            // Activer/désactiver tout
  "notifyNewEmail": true,                 // Notif nouvel email
  "notifyCaseAssigned": true,             // Notif dossier assigné
  "notifyHighPriority": true,             // Notif priorité haute
  "notifyDeadlineApproaching": true       // Notif échéance proche
}
```

**Cas d'usage :**
- Mode focus → `enableNotifications: false` (silence total)
- Urgences uniquement → `notifyHighPriority: true, notifyNewEmail: false`
- Tout savoir → Tout à `true`

---

### 4. **Communication** 💬

```json
{
  "autoForwardToSignal": false,           // Transférer vers Signal
  "signalPhoneNumber": "+33603983709",    // Numéro Signal
  "autoReplyEnabled": false,              // Réponse automatique
  "autoReplyMessage": "Merci..."          // Message auto
}
```

**Cas d'usage :**
- Vacances → `autoReplyEnabled: true, autoReplyMessage: "Absent jusqu'au..."`
- Signal Hub → `autoForwardToSignal: true`
- Contrôle total → Tout à `false`

---

### 5. **Détection Doublons** 🔍

```json
{
  "autoMergeDuplicateCases": false,       // Fusionner dossiers doublons
  "autoMergeDuplicateClients": false      // Fusionner clients doublons
}
```

**Cas d'usage :**
- Confiance totale → `true` (fusion auto)
- Prudence → `false` (vérification manuelle)

---

### 6. **Recherche & IA** 🤖

```json
{
  "enableSemanticSearch": true,           // Recherche sémantique IA
  "enableEmbeddings": true                // Embeddings vectoriels
}
```

**Cas d'usage :**
- Performance max → `true` (toutes les fonctionnalités)
- Économie ressources → `false` (recherche classique uniquement)

---

### 7. **Sécurité** 🔒

```json
{
  "requireApprovalForDelete": true,       // Confirmation avant suppression
  "requireApprovalForExport": false       // Confirmation avant export
}
```

**Cas d'usage :**
- Sécurité max → Tout à `true`
- Utilisateur expérimenté → `false` (pas de confirmation)

---

## 🎚️ Presets Prédéfinis

### 1. **Conservateur** 🛡️
*Automatisation minimale, contrôle manuel maximum*

```json
{
  "autoMonitorEmails": true,
  "autoCreateCaseFromEmail": false,       // ❌ Création manuelle
  "autoCreateClientFromEmail": false,     // ❌ Création manuelle
  "autoExtractClientInfo": true,
  "autoAssignCases": false,               // ❌ Assignation manuelle
  "autoMergeDuplicateCases": false,       // ❌ Fusion manuelle
  "enableNotifications": true,
  "requireApprovalForDelete": true
}
```

**Pour qui :** Utilisateurs prudents, cabinets sensibles, débutants

---

### 2. **Équilibré** ⚖️
*Automatisation modérée avec contrôle* (PAR DÉFAUT)

```json
{
  "autoMonitorEmails": true,
  "autoCreateCaseFromEmail": true,        // ✅ Création auto
  "autoCreateClientFromEmail": true,      // ✅ Création auto
  "autoExtractClientInfo": true,
  "autoAssignCases": false,               // ❌ Assignation manuelle
  "autoMergeDuplicateCases": false,       // ❌ Fusion manuelle
  "enableNotifications": true,
  "requireApprovalForDelete": true
}
```

**Pour qui :** Majorité des utilisateurs, cabinets moyens

---

### 3. **Agressif** 🚀
*Automatisation maximale, intervention minimale*

```json
{
  "autoMonitorEmails": true,
  "autoCreateCaseFromEmail": true,        // ✅ Création auto
  "autoCreateClientFromEmail": true,      // ✅ Création auto
  "autoExtractClientInfo": true,
  "autoAssignCases": true,                // ✅ Assignation auto
  "autoMergeDuplicateCases": true,        // ✅ Fusion auto
  "enableNotifications": true,
  "requireApprovalForDelete": false       // ❌ Pas de confirmation
}
```

**Pour qui :** Utilisateurs expérimentés, cabinets très actifs, power users

---

## 🔌 API Endpoints

### 1. Récupérer les Paramètres
```http
GET /api/automation/settings
Authorization: Bearer {token}

Response:
{
  "id": "guid",
  "userId": "guid",
  "autoMonitorEmails": true,
  "emailCheckIntervalSeconds": 60,
  ...
}
```

### 2. Mettre à Jour les Paramètres
```http
PATCH /api/automation/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "autoMonitorEmails": false,
  "emailCheckIntervalSeconds": 120,
  "autoCreateCaseFromEmail": true
}

Response: Paramètres mis à jour
```

### 3. Réinitialiser aux Valeurs par Défaut
```http
POST /api/automation/settings/reset
Authorization: Bearer {token}

Response: Paramètres réinitialisés (preset "Équilibré")
```

### 4. Obtenir les Presets
```http
GET /api/automation/settings/presets
Authorization: Bearer {token}

Response:
{
  "conservative": { ... },
  "balanced": { ... },
  "aggressive": { ... }
}
```

---

## 💻 Interface Utilisateur

### Page de Configuration

```html
<div class="automation-settings">
  <h2>⚙️ Paramètres d'Automatisation</h2>
  
  <!-- Presets rapides -->
  <div class="presets">
    <button onclick="applyPreset('conservative')">🛡️ Conservateur</button>
    <button onclick="applyPreset('balanced')">⚖️ Équilibré</button>
    <button onclick="applyPreset('aggressive')">🚀 Agressif</button>
  </div>
  
  <!-- Email Monitoring -->
  <section>
    <h3>📧 Email Monitoring</h3>
    <label>
      <input type="checkbox" id="autoMonitorEmails" checked>
      Activer le monitoring automatique
    </label>
    <label>
      Vérifier toutes les
      <input type="number" id="emailCheckIntervalSeconds" value="60" min="30" max="3600">
      secondes
    </label>
    <label>
      <input type="checkbox" id="autoCreateCaseFromEmail" checked>
      Créer automatiquement un dossier depuis chaque email
    </label>
  </section>
  
  <!-- Dossiers -->
  <section>
    <h3>📁 Gestion Dossiers</h3>
    <label>
      <input type="checkbox" id="autoAssignCases">
      Assigner automatiquement les nouveaux dossiers
    </label>
    <label>
      <input type="checkbox" id="autoSetPriority">
      Définir automatiquement la priorité
    </label>
  </section>
  
  <!-- Notifications -->
  <section>
    <h3>🔔 Notifications</h3>
    <label>
      <input type="checkbox" id="enableNotifications" checked>
      Activer les notifications
    </label>
    <label>
      <input type="checkbox" id="notifyNewEmail" checked>
      Notifier pour chaque nouvel email
    </label>
  </section>
  
  <button onclick="saveSettings()">💾 Enregistrer</button>
  <button onclick="resetSettings()">🔄 Réinitialiser</button>
</div>
```

### JavaScript

```javascript
async function loadSettings() {
  const response = await fetch('/api/automation/settings', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const settings = await response.json();
  
  // Remplir le formulaire
  document.getElementById('autoMonitorEmails').checked = settings.autoMonitorEmails;
  document.getElementById('emailCheckIntervalSeconds').value = settings.emailCheckIntervalSeconds;
  // ...
}

async function saveSettings() {
  const settings = {
    autoMonitorEmails: document.getElementById('autoMonitorEmails').checked,
    emailCheckIntervalSeconds: parseInt(document.getElementById('emailCheckIntervalSeconds').value),
    // ...
  };
  
  await fetch('/api/automation/settings', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  
  alert('✅ Paramètres enregistrés !');
}

async function applyPreset(presetName) {
  const response = await fetch('/api/automation/settings/presets', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const presets = await response.json();
  const preset = presets[presetName];
  
  // Appliquer le preset
  await fetch('/api/automation/settings', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preset)
  });
  
  loadSettings();
  alert(`✅ Preset "${preset.name}" appliqué !`);
}
```

---

## 🎯 Scénarios d'Usage

### Scénario 1: Avocat Solo Débordé
```json
{
  "emailCheckIntervalSeconds": 30,        // Vérif rapide
  "autoCreateCaseFromEmail": true,        // Tout automatique
  "autoCreateClientFromEmail": true,
  "autoAssignCases": true,                // S'assigner automatiquement
  "defaultAssignedUserId": "self",
  "notifyHighPriority": true,             // Seulement urgences
  "notifyNewEmail": false                 // Pas de spam
}
```

### Scénario 2: Cabinet avec Secrétaire
```json
{
  "autoCreateCaseFromEmail": false,       // Secrétaire crée manuellement
  "autoCreateClientFromEmail": false,
  "autoAssignCases": false,               // Manager assigne
  "notifyNewEmail": true,                 // Secrétaire notifiée
  "requireApprovalForDelete": true        // Sécurité max
}
```

### Scénario 3: Vacances
```json
{
  "autoMonitorEmails": false,             // Pause monitoring
  "autoReplyEnabled": true,               // Réponse auto
  "autoReplyMessage": "Absent jusqu'au 15/02. Urgences: +33...",
  "enableNotifications": false            // Silence total
}
```

### Scénario 4: Migration/Test
```json
{
  "autoCreateCaseFromEmail": false,       // Tout manuel
  "autoCreateClientFromEmail": false,
  "autoMergeDuplicateCases": false,
  "requireApprovalForDelete": true,       // Sécurité max
  "requireApprovalForExport": true
}
```

---

## ✅ Avantages

### Pour l'Utilisateur
- ✅ Contrôle total
- ✅ Flexibilité maximale
- ✅ Adaptation à son workflow
- ✅ Pas de surprise
- ✅ Confiance

### Pour le Système
- ✅ Respect des préférences
- ✅ Moins d'erreurs
- ✅ Meilleure adoption
- ✅ Satisfaction utilisateur
- ✅ Conformité RGPD

---

## 🔐 Sécurité & Confidentialité

### Stockage
- ✅ Paramètres par utilisateur (isolation)
- ✅ Chiffrés en base de données
- ✅ Pas de partage entre utilisateurs

### Audit
- ✅ Chaque modification loggée
- ✅ Historique des changements
- ✅ Traçabilité complète

### RGPD
- ✅ Consentement explicite
- ✅ Droit de modification
- ✅ Droit de réinitialisation
- ✅ Transparence totale

---

## 📖 Fichiers Créés

- `Models/UserAutomationSettings.cs` - Modèle de données
- `Controllers/AutomationSettingsController.cs` - API REST
- `Data/MemoLibDbContext.cs` - DbSet ajouté
- `CONTROLE_AUTOMATISATION.md` - Documentation

---

## 🎯 Résultat

**Avant :**
- ❌ Automatisation imposée
- ❌ Pas de contrôle
- ❌ Frustration utilisateur

**Après :**
- ✅ Utilisateur maître de son automatisation
- ✅ Contrôle granulaire à tous les niveaux
- ✅ Presets pour démarrage rapide
- ✅ Flexibilité maximale
- ✅ Satisfaction +1000%

**🎛️ Contrôle Total +100% !**
