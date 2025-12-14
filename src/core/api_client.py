"""Client API pour tests et développement"""
import requests
import json

class SecureVaultClient:
    def __init__(self, base_url='http://localhost:5000'):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, password):
        """Connexion"""
        response = self.session.post(f'{self.base_url}/login', 
            json={'password': password})
        return response.json()
    
    def send_email(self, recipient, subject, body):
        """Envoyer email"""
        response = self.session.post(f'{self.base_url}/api/send-email',
            json={
                'recipient': recipient,
                'subject': subject, 
                'body': body
            })
        return response.json()
    
    def generate_email(self, context, tone='professionnel'):
        """Générer email avec IA"""
        response = self.session.post(f'{self.base_url}/api/generate-content',
            json={
                'context': context,
                'tone': tone
            })
        return response.json()
    
    def get_stats(self):
        """Récupérer statistiques"""
        response = self.session.get(f'{self.base_url}/api/stats')
        return response.json()
    
    def health_check(self):
        """Vérification santé"""
        response = self.session.get(f'{self.base_url}/api/health/detailed')
        return response.json()

# Exemple d'utilisation
if __name__ == "__main__":
    client = SecureVaultClient()
    
    # Test connexion
    login_result = client.login('testpassword123')
    print(f"Login: {login_result}")
    
    # Test génération IA
    ai_result = client.generate_email('Demande de congés')
    print(f"IA: {ai_result}")
    
    # Test santé
    health = client.health_check()
    print(f"Health: {health}")