"""
Générateur de TODO automatiques depuis l'analyse de documents
Crée notifications multi-canal (email, push, SMS)
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json


class TodoGenerator:
    """
    Génère des TODO automatiques depuis l'analyse IA
    Crée notifications programmées (J-7, J-3, J-1, Jour J)
    """
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.todos = []  # Stockage en mémoire si pas de DB
        self.notifications = []
    
    def generate_from_analysis(self, analysis: Dict, user_id: int, document_id: int = None) -> Dict:
        """
        Crée un TODO automatique depuis l'analyse IA
        
        Args:
            analysis: Résultat de DocumentAnalyzer.process_document()
            user_id: ID de l'utilisateur
            document_id: ID du document (optionnel)
        
        Returns:
            Dict avec todo_id, title, due_date, priority, notifications créées
        """
        
        # Générer ID unique
        todo_id = len(self.todos) + 1
        
        # Créer le TODO
        todo = {
            'id': todo_id,
            'user_id': user_id,
            'document_id': document_id,
            'title': self._generate_title(analysis),
            'description': self._generate_description(analysis),
            'due_date': analysis.get('todo_date'),
            'priority': self._map_priority(analysis.get('niveau_urgence', 'moyen')),
            'status': 'pending',
            'type': analysis.get('type_document', 'autre'),
            'metadata': {
                'numero_document': analysis.get('numero_document'),
                'montant_ttc': analysis.get('montant_ttc'),
                'emetteur': analysis.get('emetteur'),
                'actions_requises': analysis.get('actions_requises', []),
                'file_path': analysis.get('file_path')
            },
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        self.todos.append(todo)
        
        # Créer les notifications
        notifs = self._create_notifications(todo, analysis)
        
        print(f"✅ TODO créé: {todo['title']}")
        print(f"📅 Échéance: {todo['due_date']}")
        print(f"⚡ Priorité: {todo['priority']} ({analysis.get('niveau_urgence')})")
        print(f"🔔 {len(notifs)} notifications programmées")
        
        return {
            'todo_id': todo['id'],
            'title': todo['title'],
            'due_date': todo['due_date'],
            'priority': todo['priority'],
            'status': todo['status'],
            'notifications_created': len(notifs),
            'notifications': notifs
        }
    
    def _generate_title(self, analysis: Dict) -> str:
        """Génère un titre explicite et actionnable"""
        doc_type = analysis.get('type_document', 'Document')
        numero = analysis.get('numero_document', '')
        montant = analysis.get('montant_ttc')
        emetteur = analysis.get('emetteur', '')[:30]  # Limiter longueur
        
        # Icônes par type
        icons = {
            'facture': '💶',
            'devis': '📋',
            'contrat': '📜',
            'email': '📧',
            'courrier': '✉️',
            'autre': '📄'
        }
        icon = icons.get(doc_type, '📄')
        
        if doc_type == 'facture':
            if montant:
                return f"{icon} Payer facture {numero} - {montant:.2f}€"
            else:
                return f"{icon} Traiter facture {numero}"
        
        elif doc_type == 'devis':
            if montant:
                return f"{icon} Valider devis {numero} - {montant:.2f}€"
            else:
                return f"{icon} Valider devis {numero}"
        
        elif doc_type == 'contrat':
            return f"{icon} Signer contrat {numero}"
        
        elif doc_type == 'email':
            return f"{icon} Répondre email de {emetteur}"
        
        elif doc_type == 'courrier':
            return f"{icon} Traiter courrier de {emetteur}"
        
        else:
            return f"{icon} Traiter {doc_type} {numero}"
    
    def _generate_description(self, analysis: Dict) -> str:
        """Génère description détaillée"""
        parts = []
        
        if analysis.get('emetteur'):
            parts.append(f"📤 Émetteur: {analysis['emetteur']}")
        
        if analysis.get('destinataire'):
            parts.append(f"📥 Destinataire: {analysis['destinataire']}")
        
        if analysis.get('date_emission'):
            parts.append(f"📅 Émis le: {analysis['date_emission']}")
        
        if analysis.get('date_echeance'):
            parts.append(f"⏰ Échéance: {analysis['date_echeance']}")
        
        if analysis.get('montant_ht') or analysis.get('montant_ttc'):
            if analysis.get('montant_ht'):
                parts.append(f"💰 Montant HT: {analysis['montant_ht']:.2f}€")
            if analysis.get('montant_ttc'):
                parts.append(f"💶 Montant TTC: {analysis['montant_ttc']:.2f}€")
        
        if analysis.get('days_remaining') is not None:
            days = analysis['days_remaining']
            if days < 0:
                parts.append(f"⚠️  EN RETARD de {abs(days)} jour(s)")
            elif days == 0:
                parts.append(f"🚨 À TRAITER AUJOURD'HUI")
            elif days == 1:
                parts.append(f"⏰ À traiter DEMAIN")
            else:
                parts.append(f"📌 Reste {days} jours")
        
        if analysis.get('actions_requises'):
            parts.append("\n✅ Actions requises:")
            for action in analysis['actions_requises']:
                parts.append(f"  • {action}")
        
        if analysis.get('mots_cles'):
            parts.append(f"\n🏷️  Mots-clés: {', '.join(analysis['mots_cles'])}")
        
        return "\n".join(parts)
    
    def _map_priority(self, urgence: str) -> int:
        """
        Map niveau urgence → priorité numérique
        1 = Faible, 2 = Moyen, 3 = Élevé, 4 = Critique
        """
        mapping = {
            'faible': 1,
            'moyen': 2,
            'élevé': 3,
            'critique': 4
        }
        return mapping.get(urgence.lower(), 2)
    
    def _create_notifications(self, todo: Dict, analysis: Dict) -> List[Dict]:
        """
        Crée notifications programmées (J-7, J-3, J-1, Jour J)
        
        Returns:
            Liste des notifications créées
        """
        if not todo['due_date']:
            return []
        
        try:
            due_date = datetime.strptime(todo['due_date'], '%Y-%m-%d')
        except:
            return []
        
        urgence = analysis.get('niveau_urgence', 'moyen')
        
        # Définir points de notification selon urgence
        if urgence == 'critique':
            notification_points = [-1, 0]  # J-1, Jour J
        elif urgence == 'élevé':
            notification_points = [-3, -1, 0]  # J-3, J-1, Jour J
        else:
            notification_points = [-7, -3, -1, 0]  # J-7, J-3, J-1, Jour J
        
        created_notifs = []
        
        for days_before in notification_points:
            notif_date = due_date + timedelta(days=days_before)
            
            # Ne pas créer notif dans le passé
            if notif_date < datetime.now() - timedelta(days=1):
                continue
            
            notification = {
                'id': len(self.notifications) + 1,
                'user_id': todo['user_id'],
                'todo_id': todo['id'],
                'scheduled_at': notif_date.strftime('%Y-%m-%d %H:%M:%S'),
                'type': self._get_notification_type(days_before, urgence),
                'channel': self._get_notification_channel(days_before, urgence),
                'message': self._generate_notification_message(todo, days_before),
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }
            
            self.notifications.append(notification)
            created_notifs.append(notification)
        
        return created_notifs
    
    def _get_notification_type(self, days_before: int, urgence: str) -> str:
        """Détermine type de notification"""
        if days_before == 0:
            return 'deadline'
        elif days_before == -1:
            return 'urgent'
        elif days_before == -3:
            return 'reminder'
        else:
            return 'info'
    
    def _get_notification_channel(self, days_before: int, urgence: str) -> str:
        """
        Détermine canal de notification selon urgence et timing
        - email: notifications standard
        - push: notifications urgentes
        - sms: deadline critique
        """
        if days_before == 0 and urgence == 'critique':
            return 'sms'  # SMS pour deadline critique
        elif days_before <= -1:
            return 'push'  # Push pour J-1 et Jour J
        else:
            return 'email'  # Email pour rappels anticipés
    
    def _generate_notification_message(self, todo: Dict, days_before: int) -> str:
        """Génère message de notification personnalisé"""
        title = todo['title']
        
        if days_before == 0:
            return f"🚨 AUJOURD'HUI : {title}"
        elif days_before == -1:
            return f"⏰ DEMAIN : {title}"
        elif days_before == -3:
            return f"📅 Dans 3 jours : {title}"
        elif days_before == -7:
            return f"📌 Dans 7 jours : {title}"
        else:
            return f"📢 Dans {abs(days_before)} jours : {title}"
    
    def get_todos(self, user_id: Optional[int] = None, status: Optional[str] = None) -> List[Dict]:
        """
        Récupère la liste des TODOs
        
        Args:
            user_id: Filtrer par utilisateur (optionnel)
            status: Filtrer par statut (pending, completed, cancelled)
        
        Returns:
            Liste de TODOs
        """
        todos = self.todos
        
        if user_id:
            todos = [t for t in todos if t['user_id'] == user_id]
        
        if status:
            todos = [t for t in todos if t['status'] == status]
        
        # Trier par priorité (desc) puis date (asc)
        todos.sort(key=lambda x: (-x['priority'], x['due_date'] or '9999-99-99'))
        
        return todos
    
    def get_notifications_to_send(self) -> List[Dict]:
        """
        Récupère les notifications à envoyer maintenant
        
        Returns:
            Liste des notifications pending dont l'heure est passée
        """
        now = datetime.now()
        
        to_send = []
        for notif in self.notifications:
            if notif['status'] != 'pending':
                continue
            
            try:
                scheduled = datetime.strptime(notif['scheduled_at'], '%Y-%m-%d %H:%M:%S')
                if scheduled <= now:
                    to_send.append(notif)
            except:
                pass
        
        return to_send
    
    def mark_notification_sent(self, notification_id: int):
        """Marque une notification comme envoyée"""
        for notif in self.notifications:
            if notif['id'] == notification_id:
                notif['status'] = 'sent'
                notif['sent_at'] = datetime.now().isoformat()
                break
    
    def update_todo_status(self, todo_id: int, status: str):
        """Met à jour le statut d'un TODO"""
        for todo in self.todos:
            if todo['id'] == todo_id:
                todo['status'] = status
                todo['updated_at'] = datetime.now().isoformat()
                
                if status == 'completed':
                    todo['completed_at'] = datetime.now().isoformat()
                
                print(f"✅ TODO {todo_id} → {status}")
                break
    
    def export_todos_json(self, filepath: str = 'todos_export.json'):
        """Exporte les TODOs en JSON"""
        data = {
            'todos': self.todos,
            'notifications': self.notifications,
            'exported_at': datetime.now().isoformat()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Export: {filepath}")


# ============ EXEMPLE D'UTILISATION ============

if __name__ == "__main__":
    generator = TodoGenerator()
    
    # Simuler une analyse de facture
    analysis = {
        'type_document': 'facture',
        'numero_document': '2025-0142',
        'date_emission': '2025-11-15',
        'date_echeance': '2025-12-15',
        'montant_ht': 3500.0,
        'montant_ttc': 4200.0,
        'emetteur': 'Cabinet DUPONT & ASSOCIÉS',
        'destinataire': 'SAS TECHNO SOLUTIONS',
        'delai_reponse_jours': 30,
        'niveau_urgence': 'élevé',
        'actions_requises': ['Effectuer le paiement'],
        'mots_cles': ['facture', 'honoraires', 'conseil'],
        'todo_date': '2025-12-15',
        'days_remaining': 20,
        'file_path': '/uploads/facture_2025_142.pdf'
    }
    
    # Générer TODO
    result = generator.generate_from_analysis(analysis, user_id=1, document_id=42)
    
    print("\n" + "="*60)
    print("📋 TODO GÉNÉRÉ:")
    print("="*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    print("\n" + "="*60)
    print("🔔 NOTIFICATIONS PROGRAMMÉES:")
    print("="*60)
    for notif in result['notifications']:
        print(f"{notif['scheduled_at']} - [{notif['channel'].upper()}] {notif['message']}")
    
    # Récupérer tous les TODOs
    print("\n" + "="*60)
    print("📝 TOUS LES TODOS:")
    print("="*60)
    todos = generator.get_todos(user_id=1)
    for todo in todos:
        print(f"[P{todo['priority']}] {todo['title']} - {todo['due_date']}")
    
    # Exporter
    generator.export_todos_json('todos_test.json')
