"""Service IA fonctionnel avec OpenAI"""
import openai
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, api_key):
        self.client = openai.OpenAI(api_key=api_key)
    
    def generate_email(self, context, tone='professionnel', length='moyen'):
        try:
            prompts = {
                'professionnel': f"Rédige un email professionnel concernant: {context}",
                'amical': f"Rédige un email amical concernant: {context}",
                'formel': f"Rédige un email formel concernant: {context}",
                'urgent': f"Rédige un email urgent concernant: {context}"
            }
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu génères des emails en français. Format: Objet: [sujet]\n\n[corps]"},
                    {"role": "user", "content": prompts.get(tone, prompts['professionnel'])}
                ],
                max_tokens=300 if length == 'court' else 500,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            lines = content.split('\n', 1)
            subject = lines[0].replace('Objet:', '').strip()
            body = lines[1].strip() if len(lines) > 1 else content
            
            return True, {'subject': subject, 'body': body}
            
        except Exception as e:
            logger.error(f"Erreur IA: {e}")
            return False, str(e)