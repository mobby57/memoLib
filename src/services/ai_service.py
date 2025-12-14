"""Service IA pour génération d'emails"""
import openai
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, api_key):
        self.api_key = api_key
        openai.api_key = api_key
    
    def generate_email(self, context, tone='professionnel'):
        """Générer un email avec GPT"""
        try:
            prompt = f"Génère un email {tone} pour: {context}"
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un assistant qui génère des emails professionnels."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            email_content = response.choices[0].message.content
            logger.info("Email généré par IA")
            return True, email_content
            
        except Exception as e:
            logger.error(f"Erreur génération IA: {e}")
            return False, str(e)
