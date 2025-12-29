"""
Client exemple pour tester l'API MVP IA Poste Manager
=====================================================

Exemples d'utilisation de l'API.
"""

import requests
import json
from typing import Dict, Any, Optional
import time


class IAPosteManagerClient:
    """Client Python pour l'API MVP"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        """
        Initialise le client
        
        Args:
            base_url: URL de base de l'API
        """
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
    
    def health_check(self) -> Dict[str, Any]:
        """Vérifie la santé de l'API"""
        
        response = self.session.get(f"{self.base_url}/api/v1/health")
        response.raise_for_status()
        return response.json()
    
    def send_message(
        self,
        content: str,
        subject: str = "",
        sender: str = "",
        channel: str = "email",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Envoie un message à traiter
        
        Args:
            content: Contenu du message
            subject: Sujet
            sender: Expéditeur
            channel: Canal (email, chat, sms, whatsapp)
            metadata: Métadonnées additionnelles
        
        Returns:
            Résultat avec workspace_id et résultat du traitement
        """
        
        payload = {
            'content': content,
            'subject': subject,
            'sender': sender,
            'channel': channel,
            'metadata': metadata or {}
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/messages",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def submit_form(
        self,
        form_id: str,
        workspace_id: str,
        responses: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Soumet un formulaire
        
        Args:
            form_id: ID du formulaire
            workspace_id: ID du workspace
            responses: Réponses du formulaire
            user_id: ID utilisateur (optionnel)
        
        Returns:
            Résultat de la soumission
        """
        
        payload = {
            'workspace_id': workspace_id,
            'responses': responses,
            'user_id': user_id
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/forms/{form_id}",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_workspace(self, workspace_id: str) -> Dict[str, Any]:
        """
        Récupère les informations d'un workspace
        
        Args:
            workspace_id: ID du workspace
        
        Returns:
            Données du workspace
        """
        
        response = self.session.get(
            f"{self.base_url}/api/v1/workspaces/{workspace_id}"
        )
        response.raise_for_status()
        return response.json()
    
    def list_channels(self) -> Dict[str, Any]:
        """Liste les canaux supportés"""
        
        response = self.session.get(f"{self.base_url}/api/v1/channels")
        response.raise_for_status()
        return response.json()


# ============================================================================
# EXEMPLES D'UTILISATION
# ============================================================================

def exemple_1_demande_mdph():
    """Exemple 1 : Demande MDPH avec informations manquantes"""
    
    print("\n" + "="*70)
    print("EXEMPLE 1 : Demande MDPH avec informations manquantes")
    print("="*70)
    
    client = IAPosteManagerClient()
    
    # 1. Vérifier que l'API fonctionne
    print("\n1️⃣ Health check...")
    health = client.health_check()
    print(f"   Status : {health['status']}")
    print(f"   Version : {health['version']}")
    
    # 2. Envoyer un message incomplet
    print("\n2️⃣ Envoi d'un message incomplet...")
    result = client.send_message(
        content="Je voudrais faire une demande MDPH",
        subject="Demande MDPH",
        sender="jean.dupont@example.com",
        channel="email"
    )
    
    workspace_id = result['workspace_id']
    processing_result = result['result']
    
    print(f"   ✅ Workspace créé : {workspace_id}")
    print(f"   ⏱️  Temps de traitement : {result['processing_time']:.2f}s")
    
    # 3. Afficher les questions générées
    if processing_result.get('needs_user_input'):
        print("\n3️⃣ Questions générées :")
        questions = processing_result.get('questions', [])
        for i, q in enumerate(questions[:3], 1):  # Afficher les 3 premières
            print(f"   {i}. {q.get('question', q)}")
        
        # 4. Afficher le formulaire
        form = processing_result.get('form', {})
        form_id = form.get('form_id')
        fields = form.get('fields', [])
        
        print(f"\n4️⃣ Formulaire généré : {form_id}")
        print(f"   Nombre de champs : {len(fields)}")
        
        # 5. Simuler la soumission du formulaire
        print("\n5️⃣ Soumission du formulaire...")
        form_responses = {
            'nom': 'Dupont',
            'prenom': 'Jean',
            'date_naissance': '1980-01-01',
            'adresse': '123 rue de la Paix, 75001 Paris',
            'telephone': '0123456789'
        }
        
        submit_result = client.submit_form(
            form_id=form_id,
            workspace_id=workspace_id,
            responses=form_responses
        )
        
        print(f"   ✅ Formulaire soumis : {submit_result['success']}")
    
    print("\n✅ Exemple 1 terminé\n")


def exemple_2_demande_complete():
    """Exemple 2 : Demande complète qui génère directement une réponse"""
    
    print("\n" + "="*70)
    print("EXEMPLE 2 : Demande complète avec toutes les informations")
    print("="*70)
    
    client = IAPosteManagerClient()
    
    print("\n1️⃣ Envoi d'un message complet...")
    result = client.send_message(
        content="""
        Bonjour,
        
        Je souhaite faire une demande de reconnaissance de handicap MDPH.
        
        Informations :
        - Nom : Martin
        - Prénom : Sophie
        - Date de naissance : 15/03/1985
        - Adresse : 456 avenue des Champs, 69001 Lyon
        - Téléphone : 0987654321
        - Email : sophie.martin@example.com
        
        Je suis atteinte de troubles visuels importants suite à une maladie.
        J'ai des difficultés pour me déplacer et travailler.
        
        Cordialement,
        Sophie Martin
        """,
        subject="Demande MDPH - Reconnaissance handicap",
        sender="sophie.martin@example.com",
        channel="email"
    )
    
    workspace_id = result['workspace_id']
    processing_result = result['result']
    
    print(f"   ✅ Workspace créé : {workspace_id}")
    print(f"   ⏱️  Temps de traitement : {result['processing_time']:.2f}s")
    
    # Vérifier le résultat
    if processing_result.get('needs_user_input'):
        print(f"\n2️⃣ Informations supplémentaires nécessaires")
        questions = processing_result.get('questions', [])
        print(f"   Nombre de questions : {len(questions)}")
    else:
        print(f"\n2️⃣ Réponse générée directement")
        response = processing_result.get('response', {})
        print(f"   Type de réponse : {response.get('type', 'N/A')}")
    
    print("\n✅ Exemple 2 terminé\n")


def exemple_3_multi_canal():
    """Exemple 3 : Test de plusieurs canaux"""
    
    print("\n" + "="*70)
    print("EXEMPLE 3 : Test multi-canal")
    print("="*70)
    
    client = IAPosteManagerClient()
    
    # Lister les canaux supportés
    print("\n1️⃣ Canaux supportés :")
    channels_data = client.list_channels()
    channels = channels_data.get('channels', [])
    for channel in channels:
        print(f"   - {channel}")
    
    # Tester quelques canaux
    test_channels = ['email', 'chat', 'sms']
    
    print(f"\n2️⃣ Test de {len(test_channels)} canaux...")
    for channel in test_channels:
        print(f"\n   📡 Canal : {channel}")
        
        result = client.send_message(
            content=f"Test message via {channel}",
            subject="Test",
            sender="test@example.com",
            channel=channel
        )
        
        print(f"   ✅ Workspace créé : {result['workspace_id']}")
        print(f"   ⏱️  Temps : {result['processing_time']:.2f}s")
    
    print("\n✅ Exemple 3 terminé\n")


def run_all_examples():
    """Exécute tous les exemples"""
    
    print("\n" + "="*70)
    print("🚀 DÉMONSTRATION CLIENT API MVP IA POSTE MANAGER")
    print("="*70)
    
    try:
        # Vérifier que l'API est accessible
        client = IAPosteManagerClient()
        health = client.health_check()
        
        if health.get('status') != 'healthy':
            print("\n❌ L'API n'est pas accessible")
            print("   Veuillez démarrer l'API avec : python src/backend/api_mvp.py")
            return
        
        # Exécuter les exemples
        exemple_1_demande_mdph()
        time.sleep(1)
        
        exemple_2_demande_complete()
        time.sleep(1)
        
        exemple_3_multi_canal()
        
        print("\n" + "="*70)
        print("✅ TOUS LES EXEMPLES TERMINÉS AVEC SUCCÈS")
        print("="*70 + "\n")
    
    except requests.exceptions.ConnectionError:
        print("\n❌ Impossible de se connecter à l'API")
        print("   Veuillez démarrer l'API avec : python src/backend/api_mvp.py")
    
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    run_all_examples()
