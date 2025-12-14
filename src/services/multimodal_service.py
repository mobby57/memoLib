"""Service d'analyse multimodale avec GPT-4 Vision"""
import os
import base64
from openai import OpenAI

class MultimodalService:
    """Service pour analyser des images et générer du contenu avec GPT-4 Vision"""
    
    def __init__(self, api_key=None):
        """
        Initialise le service multimodal
        
        Args:
            api_key: Clé API OpenAI (optionnel, utilise variable d'environnement si non fourni)
        """
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
    
    def analyze_image(self, image_path, prompt=None, detail_level="auto"):
        """
        Analyse une image avec GPT-4 Vision
        
        Args:
            image_path: Chemin vers l'image à analyser
            prompt: Prompt personnalisé (par défaut: description générale)
            detail_level: Niveau de détail ('low', 'high', 'auto')
        
        Returns:
            str: Description ou analyse de l'image
        """
        try:
            # Encoder l'image en base64
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Déterminer le type MIME
            extension = os.path.splitext(image_path)[1].lower()
            mime_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }
            mime_type = mime_types.get(extension, 'image/jpeg')
            
            # Prompt par défaut si non fourni
            if not prompt:
                prompt = "Décris cette image en détail en français. Si c'est un document, extrait le texte visible."
            
            # Appel à l'API GPT-4 Vision
            response = self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}",
                                    "detail": detail_level
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            return response.choices[0].message.content
            
        except FileNotFoundError:
            raise ValueError(f"Image non trouvée: {image_path}")
        except Exception as e:
            raise Exception(f"Erreur lors de l'analyse de l'image: {str(e)}")
    
    def extract_text_from_image(self, image_path):
        """
        Extrait le texte d'une image (OCR via Vision)
        
        Args:
            image_path: Chemin vers l'image
        
        Returns:
            str: Texte extrait
        """
        prompt = """Extrait tout le texte visible dans cette image.
        Retourne uniquement le texte, sans description de l'image.
        Formate le texte de manière lisible en conservant la structure si possible."""
        
        return self.analyze_image(image_path, prompt, detail_level="high")
    
    def analyze_for_email_context(self, image_path):
        """
        Analyse une image pour générer du contexte pour un email
        
        Args:
            image_path: Chemin vers l'image
        
        Returns:
            str: Contexte formaté pour inclusion dans un email
        """
        prompt = """Analyse cette image et fournis un résumé structuré qui pourrait être utile 
        pour rédiger un email professionnel. Inclus:
        - Le type de document/image
        - Les informations clés
        - Les éléments pertinents à mentionner
        
        Formate ta réponse de manière concise en français."""
        
        return self.analyze_image(image_path, prompt, detail_level="high")
    
    def generate_email_from_image(self, image_path, tone="professionnel", recipient_context=""):
        """
        Génère un email complet basé sur le contenu d'une image
        
        Args:
            image_path: Chemin vers l'image
            tone: Ton de l'email ('professionnel', 'amical', 'formel')
            recipient_context: Contexte sur le destinataire
        
        Returns:
            dict: {'subject': str, 'body': str}
        """
        tone_descriptions = {
            'professionnel': 'professionnel et courtois',
            'amical': 'amical et chaleureux',
            'formel': 'très formel et structuré',
            'concis': 'direct et concis'
        }
        
        tone_desc = tone_descriptions.get(tone, 'professionnel')
        
        prompt = f"""Analyse cette image et génère un email complet en français.
        
        Ton: {tone_desc}
        Contexte destinataire: {recipient_context if recipient_context else "Non spécifié"}
        
        Fournis ta réponse au format suivant:
        OBJET: [objet de l'email]
        
        CORPS:
        [corps de l'email]
        
        L'email doit être pertinent par rapport au contenu de l'image."""
        
        try:
            response = self.analyze_image(image_path, prompt, detail_level="high")
            
            # Parser la réponse
            lines = response.split('\n')
            subject = ""
            body_lines = []
            in_body = False
            
            for line in lines:
                if line.startswith('OBJET:'):
                    subject = line.replace('OBJET:', '').strip()
                elif line.startswith('CORPS:'):
                    in_body = True
                elif in_body:
                    body_lines.append(line)
            
            body = '\n'.join(body_lines).strip()
            
            # Fallback si parsing échoue
            if not subject or not body:
                subject = "Information concernant le document joint"
                body = response
            
            return {
                'subject': subject,
                'body': body
            }
            
        except Exception as e:
            raise Exception(f"Erreur génération email depuis image: {str(e)}")
    
    def batch_analyze_images(self, image_paths, prompt=None):
        """
        Analyse plusieurs images et retourne un résumé consolidé
        
        Args:
            image_paths: Liste de chemins vers les images
            prompt: Prompt personnalisé (optionnel)
        
        Returns:
            str: Analyse consolidée de toutes les images
        """
        analyses = []
        
        for i, image_path in enumerate(image_paths, 1):
            try:
                analysis = self.analyze_image(image_path, prompt)
                analyses.append(f"Image {i} ({os.path.basename(image_path)}):\n{analysis}")
            except Exception as e:
                analyses.append(f"Image {i} ({os.path.basename(image_path)}): Erreur - {str(e)}")
        
        return "\n\n---\n\n".join(analyses)
