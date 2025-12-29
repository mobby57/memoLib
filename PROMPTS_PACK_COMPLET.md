# 🚀 PACK COMPLET DE PROMPTS - IA POSTE MANAGER MVP
# Copier-coller ces prompts dans Amazon Q / Cursor pour génération automatique

## 📋 ORDRE D'EXÉCUTION RECOMMANDÉ
1. Modules Python Core (Prompts 1-5)
2. Backend API (Prompts 6-7) 
3. Configuration (Prompt 8)
4. Intégrations (Prompt 9)
5. Tests & Déploiement (Prompt 10)

---

## 🔥 PROMPT 1 - MODULE WORKSPACE CORE

```
Génère un module Python complet `src/core/workspace.py` pour IA Poste Manager MVP.

FONCTIONNALITÉS REQUISES:
- Classe WorkspaceManager avec méthodes: create_workspace(), analyze_email(), detect_missing_info(), get_workspace_status()
- Analyse automatique emails entrants (sujet, corps, pièces jointes, expéditeur)
- Détection informations manquantes via patterns et IA locale
- Gestion états: NOUVEAU, EN_ANALYSE, ATTENTE_INFO, PRET_REPONSE, TERMINE
- Support multi-client avec isolation données
- Journalisation anonymisée RGPD

STRUCTURE DE DONNÉES:
```python
workspace = {
    'id': 'ws_uuid',
    'client_id': 'client_123', 
    'email_data': {...},
    'analysis': {...},
    'missing_info': [...],
    'status': 'EN_ANALYSE',
    'priority': 'MEDIUM',
    'created_at': datetime,
    'updated_at': datetime
}
```

EXIGENCES TECHNIQUES:
- Compatible Python 3.8+
- Utiliser SQLite pour stockage local
- Chiffrement données sensibles
- Logs détaillés avec rotation
- Gestion erreurs robuste
- Documentation complète dans le code

SORTIE: Code Python fonctionnel avec tests unitaires intégrés.
```

---

## 🔥 PROMPT 2 - SIMULATION QUESTIONS HUMAINES

```
Génère un module Python `src/core/human_thought_sim.py` pour simuler raisonnement humain.

FONCTIONNALITÉS:
- Classe HumanThoughtSimulator
- Méthode generate_questions(email_analysis, missing_info) -> List[Question]
- Simulation questions logiques qu'un humain poserait
- Priorisation questions par importance et urgence
- Adaptation selon type de courrier (administratif, commercial, personnel)

TYPES DE QUESTIONS:
- Clarification: "Pouvez-vous préciser..."
- Information manquante: "Il nous manque..."  
- Confirmation: "Confirmez-vous que..."
- Alternative: "Préférez-vous... ou..."

STRUCTURE QUESTION:
```python
question = {
    'id': 'q_uuid',
    'type': 'clarification|missing|confirmation|alternative',
    'text': 'Question en français',
    'priority': 1-5,
    'required': True/False,
    'field_type': 'text|number|date|choice|file',
    'options': [...] # pour type choice
}
```

EXIGENCES:
- Algorithmes de génération basés sur patterns
- Support multi-langues (FR prioritaire)
- Accessibilité (texte clair, simple)
- Validation logique des questions
- Documentation complète

SORTIE: Module Python avec exemples d'utilisation.
```

---

## 🔥 PROMPT 3 - GÉNÉRATEUR DE FORMULAIRES

```
Génère un module Python `src/core/form_generator.py` pour créer formulaires adaptatifs.

FONCTIONNALITÉS:
- Classe FormGenerator
- Méthode create_form(questions, client_config) -> Form
- Génération HTML/JSON selon questions détectées
- Formulaires adaptatifs selon handicap utilisateur
- Validation côté client et serveur

TYPES DE CHAMPS SUPPORTÉS:
- TextInput, NumberInput, DateInput
- SelectBox, RadioButtons, CheckBoxes  
- FileUpload, TextArea
- Signature électronique

ACCESSIBILITÉ INTÉGRÉE:
- Labels ARIA complets
- Navigation clavier
- Contraste élevé
- Taille police ajustable
- Lecteur d'écran compatible

STRUCTURE FORMULAIRE:
```python
form = {
    'id': 'form_uuid',
    'workspace_id': 'ws_uuid',
    'title': 'Titre du formulaire',
    'fields': [...],
    'validation_rules': {...},
    'accessibility_options': {...},
    'submit_url': '/api/forms/submit'
}
```

GÉNÉRATION MULTI-FORMAT:
- HTML5 avec CSS accessible
- JSON pour API mobile
- PDF pour impression
- Email embed pour envoi direct

EXIGENCES:
- Templates personnalisables par client
- Validation robuste (XSS, injection)
- Responsive design
- Performance optimisée
- Tests automatisés

SORTIE: Module complet avec templates et exemples.
```

---

## 🔥 PROMPT 4 - GÉNÉRATEUR DE RÉPONSES IA

```
Génère un module Python `src/core/responder.py` pour génération réponses intelligentes.

FONCTIONNALITÉS PRINCIPALES:
- Classe AIResponder
- Méthode generate_response(workspace, form_data, client_config) -> Response
- Adaptation ton selon type courrier et client
- Génération multi-format (email, courrier, SMS)
- Intégration IA locale + fallback externe

TYPES DE RÉPONSES:
- Accusé réception automatique
- Demande informations complémentaires  
- Réponse complète avec solution
- Transfert vers service spécialisé
- Réponse d'attente avec délai

PERSONNALISATION TON:
```python
tone_config = {
    'formal': 'Madame, Monsieur, nous accusons réception...',
    'friendly': 'Bonjour, merci pour votre message...',
    'urgent': 'Votre demande urgente a été prise en compte...',
    'administrative': 'Suite à votre courrier du...'
}
```

TEMPLATES DYNAMIQUES:
- Variables automatiques: {nom}, {date}, {reference}
- Conditions logiques: {% if urgent %}...{% endif %}
- Boucles: {% for document in documents %}...{% endfor %}
- Formatage: {montant|currency}, {date|format}

MULTI-LANGUES:
- Détection langue automatique
- Traduction si nécessaire
- Adaptation culturelle
- Validation native speaker

QUALITÉ & SÉCURITÉ:
- Vérification orthographe/grammaire
- Détection contenu sensible
- Anonymisation automatique
- Audit trail complet

EXIGENCES:
- Performance < 2 secondes
- Cache intelligent
- Gestion erreurs gracieuse
- Métriques qualité
- A/B testing intégré

SORTIE: Module avec IA locale + templates + tests.
```

---

## 🔥 PROMPT 5 - SÉCURITÉ & JOURNALISATION

```
Génère deux modules Python: `src/security/security.py` et `src/logging/logger.py`.

MODULE SECURITY.PY:
- Classe SecurityManager
- Chiffrement AES-256 pour données sensibles
- Anonymisation RGPD automatique
- Contrôle accès multi-client
- Audit trail sécurisé

FONCTIONS SÉCURITÉ:
```python
def encrypt_sensitive_data(data: dict) -> str
def decrypt_data(encrypted: str) -> dict  
def anonymize_email(email_content: str) -> str
def check_client_access(client_id: str, resource: str) -> bool
def log_security_event(event_type: str, details: dict)
```

ANONYMISATION RGPD:
- Détection automatique PII (noms, emails, téléphones, adresses)
- Remplacement par tokens: [NOM], [EMAIL], [TEL], [ADRESSE]
- Mapping sécurisé pour dé-anonymisation si autorisée
- Purge automatique selon rétention

MODULE LOGGER.PY:
- Classe AuditLogger
- Journalisation structurée JSON
- Rotation automatique logs
- Niveaux: DEBUG, INFO, WARN, ERROR, AUDIT

ÉVÉNEMENTS TRACKÉS:
- Création/modification workspace
- Accès données client
- Génération formulaires/réponses
- Actions utilisateur
- Erreurs système
- Événements sécurité

STRUCTURE LOG:
```json
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "event_type": "workspace_created", 
    "client_id": "client_123",
    "workspace_id": "ws_uuid",
    "user_id": "user_456",
    "details": {...},
    "anonymized": true
}
```

CONFORMITÉ:
- RGPD Article 30 (registre traitements)
- ISO 27001 logging requirements
- Retention configurable par type données
- Export audit pour autorités

EXIGENCES:
- Performance minimale impact
- Stockage sécurisé
- Recherche rapide
- Alertes temps réel
- Dashboard monitoring

SORTIE: Modules sécurité complets avec documentation conformité.
```

---

## 🔥 PROMPT 6 - BACKEND API NODE.JS

```
Génère un serveur Node.js complet `src/backend/server.js` avec APIs REST.

ARCHITECTURE:
- Express.js avec middleware sécurité
- Routes modulaires dans `/routes`
- Controllers dans `/controllers` 
- Services dans `/services`
- Middleware auth/validation

ROUTES PRINCIPALES:
```javascript
// Workspaces
POST   /api/workspaces              // Créer workspace
GET    /api/workspaces              // Lister workspaces
GET    /api/workspaces/:id          // Détails workspace
PUT    /api/workspaces/:id          // Mettre à jour
DELETE /api/workspaces/:id          // Supprimer

// Emails
POST   /api/emails/receive          // Recevoir email
POST   /api/emails/analyze          // Analyser email
GET    /api/emails/:id/analysis     // Récupérer analyse

// Formulaires  
POST   /api/forms/generate          // Générer formulaire
POST   /api/forms/submit            // Soumettre formulaire
GET    /api/forms/:id               // Récupérer formulaire

// Réponses
POST   /api/responses/generate      // Générer réponse
POST   /api/responses/send          // Envoyer réponse
GET    /api/responses/templates     // Templates disponibles

// Multi-canal
POST   /api/channels/email          // Canal email
POST   /api/channels/sms            // Canal SMS  
POST   /api/channels/chat           // Canal chat
POST   /api/channels/social         // Réseaux sociaux
```

MIDDLEWARE SÉCURITÉ:
- Authentification JWT
- Rate limiting par client
- Validation input (Joi)
- Sanitization XSS
- CORS configuré
- Helmet.js security headers

INTÉGRATIONS:
- Base données (PostgreSQL/MongoDB)
- Cache Redis
- Queue Bull pour jobs async
- WebSockets pour temps réel
- Monitoring (Prometheus)

GESTION ERREURS:
```javascript
const errorHandler = (err, req, res, next) => {
    logger.error('API Error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        client_id: req.client_id
    });
    
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
};
```

DOCUMENTATION API:
- Swagger/OpenAPI 3.0
- Exemples requêtes/réponses
- Codes erreur détaillés
- Guide intégration

EXIGENCES:
- Performance > 1000 req/s
- Uptime > 99.9%
- Logs structurés
- Tests automatisés (Jest)
- Docker ready

SORTIE: Serveur Node.js complet avec documentation API.
```

---

## 🔥 PROMPT 7 - DASHBOARD TEMPS RÉEL

```
Génère un dashboard web complet `src/frontend/dashboard/` avec React.js.

COMPOSANTS PRINCIPAUX:
- WorkspaceList: Liste workspaces avec filtres
- WorkspaceDetail: Détail workspace avec actions
- AnalyticsDashboard: Métriques et graphiques
- NotificationCenter: Alertes temps réel
- ClientManager: Gestion multi-client

FONCTIONNALITÉS DASHBOARD:
```jsx
// Métriques temps réel
const MetricsWidget = () => {
    const [metrics, setMetrics] = useState({
        total_workspaces: 0,
        pending_responses: 0,
        avg_response_time: 0,
        client_satisfaction: 0
    });
    
    // WebSocket pour updates temps réel
    useEffect(() => {
        const ws = new WebSocket('/ws/metrics');
        ws.onmessage = (event) => {
            setMetrics(JSON.parse(event.data));
        };
    }, []);
};
```

FILTRES AVANCÉS:
- Par client, canal, priorité, statut
- Recherche textuelle full-text
- Filtres temporels (aujourd'hui, semaine, mois)
- Filtres personnalisés sauvegardés

GRAPHIQUES & ANALYTICS:
- Volume emails par heure/jour
- Temps de traitement moyen
- Taux de résolution automatique
- Satisfaction client par canal
- Tendances et prédictions

ACTIONS RAPIDES:
- Répondre directement depuis dashboard
- Escalader vers humain
- Marquer comme prioritaire
- Assigner à équipe spécifique
- Exporter données

NOTIFICATIONS INTELLIGENTES:
```jsx
const NotificationSystem = () => {
    const notifications = [
        {
            type: 'urgent',
            message: 'Email prioritaire client VIP',
            workspace_id: 'ws_123',
            timestamp: new Date(),
            actions: ['Voir', 'Traiter', 'Escalader']
        }
    ];
};
```

ACCESSIBILITÉ:
- Navigation clavier complète
- Lecteur d'écran compatible
- Contraste élevé disponible
- Taille police ajustable
- Raccourcis clavier

RESPONSIVE DESIGN:
- Mobile first approach
- Tablette optimisé
- Desktop full features
- PWA capabilities

EXIGENCES TECHNIQUES:
- React 18+ avec hooks
- State management (Redux/Zustand)
- WebSocket temps réel
- Charts (Chart.js/D3)
- Tests (Jest + React Testing Library)

SORTIE: Dashboard React complet avec composants réutilisables.
```

---

## 🔥 PROMPT 8 - CONFIGURATION MULTI-CLIENT

```
Génère des fichiers de configuration JSON pour gestion multi-client.

FICHIER: `config/clients.json`
```json
{
    "clients": {
        "client_001": {
            "name": "Entreprise Alpha",
            "type": "enterprise",
            "settings": {
                "auto_response": true,
                "human_validation": false,
                "priority_keywords": ["urgent", "facture", "commande"],
                "response_tone": "formal",
                "languages": ["fr", "en"],
                "channels": ["email", "chat", "phone"],
                "business_hours": {
                    "timezone": "Europe/Paris",
                    "monday": "09:00-18:00",
                    "tuesday": "09:00-18:00",
                    "wednesday": "09:00-18:00", 
                    "thursday": "09:00-18:00",
                    "friday": "09:00-17:00",
                    "saturday": "closed",
                    "sunday": "closed"
                },
                "escalation_rules": {
                    "high_priority_delay": 30,
                    "medium_priority_delay": 120,
                    "low_priority_delay": 480
                },
                "templates": {
                    "acknowledgment": "template_ack_formal_fr",
                    "information_request": "template_info_formal_fr",
                    "resolution": "template_resolution_formal_fr"
                }
            }
        },
        "client_002": {
            "name": "Startup Beta", 
            "type": "startup",
            "settings": {
                "auto_response": true,
                "human_validation": true,
                "priority_keywords": ["bug", "feature", "support"],
                "response_tone": "friendly",
                "languages": ["fr"],
                "channels": ["email", "chat"],
                "business_hours": {
                    "timezone": "Europe/Paris",
                    "monday": "10:00-19:00",
                    "tuesday": "10:00-19:00",
                    "wednesday": "10:00-19:00",
                    "thursday": "10:00-19:00", 
                    "friday": "10:00-18:00",
                    "saturday": "closed",
                    "sunday": "closed"
                }
            }
        }
    }
}
```

FICHIER: `config/channels.json`
```json
{
    "channels": {
        "email": {
            "enabled": true,
            "providers": ["gmail", "outlook", "custom_smtp"],
            "settings": {
                "max_attachment_size": "25MB",
                "allowed_extensions": [".pdf", ".doc", ".docx", ".jpg", ".png"],
                "auto_reply_delay": 5,
                "signature_template": "signature_default"
            }
        },
        "chat": {
            "enabled": true,
            "providers": ["webchat", "whatsapp", "telegram"],
            "settings": {
                "session_timeout": 1800,
                "max_message_length": 1000,
                "typing_indicator": true
            }
        },
        "sms": {
            "enabled": false,
            "providers": ["twilio", "nexmo"],
            "settings": {
                "max_length": 160,
                "delivery_reports": true
            }
        }
    }
}
```

FICHIER: `config/ai_settings.json`
```json
{
    "ai_models": {
        "local": {
            "enabled": true,
            "model_path": "./models/local_model",
            "confidence_threshold": 0.8,
            "fallback_to_external": true
        },
        "external": {
            "enabled": true,
            "provider": "openai",
            "model": "gpt-4",
            "api_key_env": "OPENAI_API_KEY",
            "max_tokens": 1000,
            "temperature": 0.7
        }
    },
    "analysis": {
        "sentiment_analysis": true,
        "language_detection": true,
        "priority_detection": true,
        "attachment_analysis": true
    },
    "response_generation": {
        "max_response_length": 2000,
        "include_signature": true,
        "personalization": true,
        "fact_checking": true
    }
}
```

VALIDATION SCHEMA:
- JSON Schema pour validation config
- Validation au démarrage application
- Hot reload configuration
- Backup automatique avant modification

GESTION VERSIONS:
- Versioning configuration
- Migration automatique
- Rollback en cas d'erreur
- Audit trail modifications

SORTIE: Configuration complète avec validation et documentation.
```

---

## 🔥 PROMPT 9 - INTÉGRATION IA EXTERNE

```
Génère un module Python `src/integrations/external_ai.py` pour IA externe.

FONCTIONNALITÉS:
- Classe ExternalAIManager
- Intégration OpenAI, Claude, Gemini
- Fallback automatique si IA locale insuffisante
- Cache intelligent réponses
- Monitoring coûts et usage

PROVIDERS SUPPORTÉS:
```python
class AIProvider:
    OPENAI = "openai"
    CLAUDE = "claude" 
    GEMINI = "gemini"
    CUSTOM = "custom"

class ExternalAIManager:
    def __init__(self, config):
        self.providers = {
            AIProvider.OPENAI: OpenAIClient(config.openai),
            AIProvider.CLAUDE: ClaudeClient(config.claude),
            AIProvider.GEMINI: GeminiClient(config.gemini)
        }
        self.cache = AICache()
        self.cost_tracker = CostTracker()
    
    async def analyze_complex_email(self, email_data, context):
        # Logique de sélection provider optimal
        provider = self.select_best_provider(email_data.complexity)
        
        # Cache check
        cache_key = self.generate_cache_key(email_data)
        if cached_result := self.cache.get(cache_key):
            return cached_result
            
        # Appel IA externe
        result = await provider.analyze(email_data, context)
        
        # Cache result
        self.cache.set(cache_key, result, ttl=3600)
        
        # Track costs
        self.cost_tracker.record_usage(provider.name, result.tokens_used)
        
        return result
```

SÉLECTION INTELLIGENTE:
- Complexité email (simple -> IA locale, complexe -> externe)
- Coût par provider (optimisation budget)
- Latence requise (temps réel vs batch)
- Spécialisation (juridique, technique, commercial)

GESTION COÛTS:
```python
class CostTracker:
    def __init__(self):
        self.daily_limits = {
            AIProvider.OPENAI: 100.0,  # $100/jour
            AIProvider.CLAUDE: 50.0,   # $50/jour
            AIProvider.GEMINI: 75.0    # $75/jour
        }
    
    def check_budget_available(self, provider, estimated_cost):
        today_usage = self.get_today_usage(provider)
        return (today_usage + estimated_cost) <= self.daily_limits[provider]
    
    def get_cost_optimization_suggestion(self, request):
        # Suggère le provider le moins cher pour le besoin
        providers_cost = {}
        for provider in self.providers:
            providers_cost[provider] = self.estimate_cost(provider, request)
        
        return min(providers_cost, key=providers_cost.get)
```

CACHE INTELLIGENT:
- Cache par similarité sémantique
- Invalidation intelligente
- Compression réponses
- Métriques hit/miss

MONITORING:
- Latence par provider
- Taux d'erreur
- Coût par requête
- Qualité réponses (feedback)

FALLBACK STRATEGY:
```python
async def generate_response_with_fallback(self, email_data):
    try:
        # Essai IA locale d'abord
        local_result = await self.local_ai.generate_response(email_data)
        if local_result.confidence > 0.8:
            return local_result
    except Exception as e:
        logger.warning(f"Local AI failed: {e}")
    
    try:
        # Fallback IA externe
        external_result = await self.external_ai.generate_response(email_data)
        return external_result
    except Exception as e:
        logger.error(f"External AI failed: {e}")
        
        # Fallback template
        return self.template_generator.generate_fallback_response(email_data)
```

SÉCURITÉ:
- Chiffrement données envoyées
- Anonymisation avant envoi externe
- Audit trail complet
- Conformité RGPD

EXIGENCES:
- Async/await pour performance
- Retry logic avec backoff
- Circuit breaker pattern
- Métriques Prometheus

SORTIE: Module intégration IA externe complet avec monitoring.
```

---

## 🔥 PROMPT 10 - TESTS & DÉPLOIEMENT MVP

```
Génère une suite complète de tests et scripts déploiement pour MVP.

FICHIER: `tests/test_mvp_complete.py`
```python
import pytest
import asyncio
from unittest.mock import Mock, patch
from src.core.workspace import WorkspaceManager
from src.core.human_thought_sim import HumanThoughtSimulator
from src.core.form_generator import FormGenerator
from src.core.responder import AIResponder

class TestMVPComplete:
    
    @pytest.fixture
    def sample_email(self):
        return {
            'from': 'client@example.com',
            'subject': 'Demande de remboursement urgent',
            'body': 'Bonjour, je souhaite un remboursement pour ma commande #12345 du 15/01/2024. Merci.',
            'attachments': [],
            'received_at': '2024-01-20T10:30:00Z'
        }
    
    @pytest.fixture
    def client_config(self):
        return {
            'client_id': 'test_client',
            'auto_response': True,
            'human_validation': False,
            'response_tone': 'formal',
            'language': 'fr'
        }
    
    async def test_complete_workflow(self, sample_email, client_config):
        """Test du workflow complet MVP"""
        
        # 1. Création workspace
        workspace_manager = WorkspaceManager()
        workspace = await workspace_manager.create_workspace(
            email_data=sample_email,
            client_config=client_config
        )
        
        assert workspace['id'] is not None
        assert workspace['status'] == 'NOUVEAU'
        
        # 2. Analyse email
        analysis = await workspace_manager.analyze_email(workspace['id'])
        
        assert analysis['sentiment'] in ['positive', 'neutral', 'negative']
        assert analysis['priority'] in ['LOW', 'MEDIUM', 'HIGH']
        assert analysis['category'] is not None
        
        # 3. Détection infos manquantes
        missing_info = await workspace_manager.detect_missing_info(workspace['id'])
        
        assert isinstance(missing_info, list)
        
        # 4. Génération questions humaines
        thought_sim = HumanThoughtSimulator()
        questions = await thought_sim.generate_questions(analysis, missing_info)
        
        assert len(questions) > 0
        assert all('text' in q for q in questions)
        
        # 5. Génération formulaire
        form_gen = FormGenerator()
        form = await form_gen.create_form(questions, client_config)
        
        assert form['id'] is not None
        assert len(form['fields']) == len(questions)
        
        # 6. Simulation réponse formulaire
        form_data = {
            'numero_commande': '12345',
            'date_achat': '2024-01-15',
            'montant': '99.99',
            'raison_remboursement': 'Produit défectueux'
        }
        
        # 7. Génération réponse IA
        responder = AIResponder()
        response = await responder.generate_response(
            workspace=workspace,
            form_data=form_data,
            client_config=client_config
        )
        
        assert response['content'] is not None
        assert response['tone'] == client_config['response_tone']
        assert len(response['content']) > 50  # Réponse substantielle
        
        # 8. Vérification logs
        logs = await workspace_manager.get_workspace_logs(workspace['id'])
        assert len(logs) > 0
        
        print("✅ Test workflow complet MVP réussi!")
```

FICHIER: `tests/test_integration.py`
```python
class TestIntegration:
    
    async def test_multi_client_isolation(self):
        """Test isolation données multi-client"""
        # Créer workspaces pour 2 clients différents
        # Vérifier qu'ils ne peuvent pas accéder aux données de l'autre
        pass
    
    async def test_multi_channel_support(self):
        """Test support multi-canal"""
        # Tester réception via email, chat, SMS
        # Vérifier traitement uniforme
        pass
    
    async def test_accessibility_compliance(self):
        """Test conformité accessibilité"""
        # Vérifier formulaires accessibles
        # Tester navigation clavier
        # Valider ARIA labels
        pass
    
    async def test_gdpr_compliance(self):
        """Test conformité RGPD"""
        # Vérifier anonymisation
        # Tester droit à l'oubli
        # Valider consentement
        pass
```

SCRIPT DÉPLOIEMENT: `deploy/deploy_mvp.sh`
```bash
#!/bin/bash

echo "🚀 Déploiement MVP IA Poste Manager"

# 1. Vérifications pré-déploiement
echo "📋 Vérifications..."
python -m pytest tests/ -v
if [ $? -ne 0 ]; then
    echo "❌ Tests échoués, arrêt déploiement"
    exit 1
fi

# 2. Build application
echo "🔨 Build application..."
cd src/frontend && npm run build
cd ../backend && npm run build

# 3. Configuration environnement
echo "⚙️ Configuration environnement..."
cp config/production.env .env
docker-compose -f docker-compose.prod.yml up -d

# 4. Migration base de données
echo "🗄️ Migration BDD..."
python manage.py migrate

# 5. Démarrage services
echo "🚀 Démarrage services..."
systemctl start iapostemanager-backend
systemctl start iapostemanager-frontend
systemctl start iapostemanager-worker

# 6. Tests post-déploiement
echo "🧪 Tests post-déploiement..."
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:8000/api/health || exit 1

# 7. Monitoring
echo "📊 Activation monitoring..."
systemctl start prometheus
systemctl start grafana

echo "✅ Déploiement MVP terminé avec succès!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:8000"
echo "📊 Monitoring: http://localhost:3001"
```

DOCKER CONFIGURATION: `docker-compose.prod.yml`
```yaml
version: '3.8'
services:
  backend:
    build: ./src/backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/iapostemanager
    depends_on:
      - db
      - redis
    
  frontend:
    build: ./src/frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:8000
    
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=iapostemanager
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    
  worker:
    build: ./src/backend
    command: python worker.py
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
```

MONITORING: `monitoring/prometheus.yml`
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'iapostemanager-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    
  - job_name: 'iapostemanager-frontend'
    static_configs:
      - targets: ['frontend:3000']
```

EXIGENCES:
- Tests automatisés complets
- Déploiement zero-downtime
- Rollback automatique si échec
- Monitoring temps réel
- Alertes configurées

SORTIE: Suite complète tests + déploiement production ready.
```

---

## 🎯 INSTRUCTIONS D'UTILISATION

### 1. ORDRE D'EXÉCUTION
Copier-coller les prompts dans cet ordre:
1. **Prompts 1-5**: Modules Python core
2. **Prompts 6-7**: Backend et Frontend  
3. **Prompt 8**: Configuration
4. **Prompt 9**: Intégrations IA
5. **Prompt 10**: Tests et déploiement

### 2. PERSONNALISATION
Avant d'exécuter, adapter:
- Noms de fichiers selon votre structure
- Chemins selon votre projet
- Configuration client selon vos besoins
- Providers IA selon vos accès

### 3. VALIDATION
Après chaque prompt:
- Vérifier la génération de code
- Tester les fonctionnalités
- Adapter si nécessaire
- Passer au prompt suivant

### 4. DÉPLOIEMENT
Une fois tous les modules générés:
- Exécuter les tests (Prompt 10)
- Configurer l'environnement
- Déployer avec le script fourni

---

**🚀 RÉSULTAT ATTENDU**: MVP complet IA Poste Manager avec tous les modules, tests et déploiement automatisé, prêt pour production !