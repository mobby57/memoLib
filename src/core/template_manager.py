"""Gestionnaire de templates d'emails"""
import os
import json
from datetime import datetime

class TemplateManager:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.templates_file = os.path.join(app_dir, 'templates.json')
        self.ensure_templates_file()
    
    def ensure_templates_file(self):
        """S'assure que le fichier de templates existe"""
        if not os.path.exists(self.templates_file):
            default_templates = {
                "templates": [
                    {
                        "id": "demande_info",
                        "name": "Demande d'information",
                        "subject": "Demande d'information",
                        "body": "Bonjour,\n\nJ'espère que vous allez bien.\n\nJe me permets de vous contacter pour obtenir des informations concernant [SUJET].\n\nPourriez-vous m'indiquer [QUESTION PRÉCISE] ?\n\nJe vous remercie par avance pour votre réponse.\n\nCordialement",
                        "category": "professionnel"
                    },
                    {
                        "id": "reclamation",
                        "name": "Réclamation",
                        "subject": "Réclamation - [RÉFÉRENCE]",
                        "body": "Madame, Monsieur,\n\nJe vous écris pour vous faire part de mon mécontentement concernant [PROBLÈME].\n\nEn effet, [DESCRIPTION DU PROBLÈME].\n\nJe souhaiterais obtenir [SOLUTION DEMANDÉE].\n\nJe reste dans l'attente de votre retour.\n\nCordialement",
                        "category": "réclamation"
                    }
                ]
            }
            
            with open(self.templates_file, 'w', encoding='utf-8') as f:
                json.dump(default_templates, f, indent=2, ensure_ascii=False)
    
    def get_templates(self):
        """Récupère tous les templates"""
        try:
            with open(self.templates_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('templates', [])
        except:
            return []
    
    def list_templates(self):
        """Alias pour get_templates"""
        return self.get_templates()
    
    def save_template(self, name, subject, body, category='general'):
        """Sauvegarde un nouveau template"""
        try:
            templates = self.get_templates()
            
            new_template = {
                "id": f"template_{int(datetime.now().timestamp())}",
                "name": name,
                "subject": subject,
                "body": body,
                "category": category,
                "created_at": datetime.now().isoformat()
            }
            
            templates.append(new_template)
            
            with open(self.templates_file, 'w', encoding='utf-8') as f:
                json.dump({"templates": templates}, f, indent=2, ensure_ascii=False)
            
            return new_template["id"]
        except Exception as e:
            print(f"Erreur sauvegarde template: {e}")
            return None
    
    def delete_template(self, template_id):
        """Supprime un template"""
        try:
            templates = self.get_templates()
            templates = [t for t in templates if t.get('id') != template_id]
            
            with open(self.templates_file, 'w', encoding='utf-8') as f:
                json.dump({"templates": templates}, f, indent=2, ensure_ascii=False)
            
            return True
        except:
            return False
    
    def search_templates(self, query):
        """Recherche dans les templates"""
        templates = self.get_templates()
        query = query.lower()
        
        results = []
        for template in templates:
            if (query in template.get('name', '').lower() or 
                query in template.get('subject', '').lower() or 
                query in template.get('body', '').lower() or
                query in template.get('category', '').lower()):
                results.append(template)
        
        return results