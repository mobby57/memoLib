"""Gestionnaire de templates d'emails"""
import json
import os
from datetime import datetime

class TemplateManager:
    def __init__(self, app_dir):
        self.templates_file = os.path.join(app_dir, 'templates.json')
        self.ensure_templates_file()
    
    def ensure_templates_file(self):
        """Créer le fichier templates s'il n'existe pas"""
        if not os.path.exists(self.templates_file):
            default_templates = {
                'professionnel': {
                    'name': 'Email Professionnel',
                    'subject': 'Concernant {sujet}',
                    'body': 'Bonjour,\n\nJ\'espère que vous allez bien. Je vous contacte concernant {sujet}.\n\nCordialement',
                    'category': 'business'
                }
            }
            with open(self.templates_file, 'w', encoding='utf-8') as f:
                json.dump(default_templates, f, indent=2, ensure_ascii=False)
    
    def get_templates(self):
        """Récupérer tous les templates"""
        try:
            with open(self.templates_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    
    def save_template(self, template_id, name, subject, body, category='general'):
        """Sauvegarder un template"""
        try:
            templates = self.get_templates()
            templates[template_id] = {
                'name': name,
                'subject': subject,
                'body': body,
                'category': category,
                'created_at': datetime.now().isoformat()
            }
            with open(self.templates_file, 'w', encoding='utf-8') as f:
                json.dump(templates, f, indent=2, ensure_ascii=False)
            return True
        except:
            return False
    
    def delete_template(self, template_id):
        """Supprimer un template"""
        try:
            templates = self.get_templates()
            if template_id in templates:
                del templates[template_id]
                with open(self.templates_file, 'w', encoding='utf-8') as f:
                    json.dump(templates, f, indent=2, ensure_ascii=False)
                return True
            return False
        except:
            return False