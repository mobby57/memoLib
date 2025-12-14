"""Service OpenAI pour génération d'emails"""
import openai
import logging

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self, api_key, org_id=None):
        openai.api_key = api_key
        if org_id:
            openai.organization = org_id
        self.api_key = api_key
        self.org_id = org_id
    
    def generate_email(self, context, tone='professionnel', email_type='general'):
        """Générer un email avec OpenAI"""
        try:
            # Prompts améliorés pour développement
            tone_prompts = {
                'professionnel': f'Rédige un email professionnel très bien développé et courtois concernant: {context}. Développe le contexte, explique l\'importance, propose des solutions, demande des précisions si nécessaire. Sois persuasif mais respectueux. Minimum 150 mots.',
                'amical': f'Rédige un email amical et chaleureux concernant: {context}. Explique bien la situation, montre ton intérêt, développe tes arguments de manière naturelle. Sois authentique et engageant.',
                'formel': f'Rédige un email très formel et respectueux concernant: {context}. Utilise un langage soutenu, développe les arguments juridiques/administratifs, cite les références pertinentes. Structure parfaite.',
                'urgent': f'Rédige un email urgent mais très poli concernant: {context}. Explique pourquoi c\'est urgent, les conséquences possibles, propose des solutions rapides. Reste respectueux malgré l\'urgence.'
            }
            
            prompt = f"{tone_prompts.get(tone, tone_prompts['professionnel'])} Format obligatoire: Objet: [sujet précis]\\n\\n[corps développé du message]"
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un expert en rédaction d'emails professionnels en français. Tu développes les idées, structures parfaitement, utilises un vocabulaire riche et persuasif. Tes emails sont toujours bien argumentés et convaincants."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            # Parser la réponse
            if "Objet:" in content:
                lines = content.split('\n', 1)
                subject = lines[0].replace('Objet:', '').strip()
                body = lines[1].strip() if len(lines) > 1 else content
            else:
                # Fallback si format non respecté
                subject = f"Concernant {context}"
                body = content
            
            logger.info("Email généré par OpenAI")
            return {
                'success': True,
                'subject': subject,
                'body': body
            }
            
        except openai.error.AuthenticationError:
            error = 'Clé API OpenAI invalide'
            logger.error("OpenAI Auth Error")
            return {'success': False, 'error': error}
            
        except openai.error.RateLimitError:
            error = 'Limite de taux OpenAI atteinte'
            logger.error("OpenAI Rate Limit")
            return {'success': False, 'error': error}
            
        except Exception as e:
            error = f'Erreur OpenAI: {str(e)}'
            logger.error(f"OpenAI Error: {e}")
            return {'success': False, 'error': error}