"""
TemplateGenerator - Générateur de modèles de documents juridiques
"""

import os
from datetime import datetime
from typing import Dict, Optional

class TemplateGenerator:
    """Générateur de documents juridiques types"""
    
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.templates_dir = os.path.join(data_dir, 'templates')
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Créer les répertoires nécessaires"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        if not os.path.exists(self.templates_dir):
            os.makedirs(self.templates_dir)
    
    def generer_assignation(self, data: Dict) -> str:
        """Générer une assignation"""
        date_today = datetime.now().strftime('%d/%m/%Y')
        
        demandeur = data.get('demandeur', 'DEMANDEUR')
        defendeur = data.get('defendeur', 'DÉFENDEUR')
        tribunal = data.get('tribunal', 'TRIBUNAL')
        objet = data.get('objet', 'OBJET DU LITIGE')
        faits = data.get('faits', 'EXPOSÉ DES FAITS')
        pretentions = data.get('pretentions', 'PRÉTENTIONS')
        
        template = f"""ASSIGNATION

Par la présente,

{demandeur}

FAIT ASSIGNER

{defendeur}

À comparaître devant le {tribunal}

OBJET : {objet}

FAITS :

{faits}

PRÉTENTIONS :

{pretentions}

Fait le {date_today}
Maître NOM DE L'AVOCAT
"""
        
        filename = f"assignation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        filepath = os.path.join(self.templates_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(template)
        
        return template
    
    def generer_conclusions(self, data: Dict) -> str:
        """Générer des conclusions"""
        date_today = datetime.now().strftime('%d/%m/%Y')
        
        partie = data.get('partie', 'PARTIE')
        adverse = data.get('adverse', 'PARTIE ADVERSE')
        faits = data.get('faits', 'FAITS')
        dispositif = data.get('dispositif', 'DISPOSITIF')
        
        template = f"""CONCLUSIONS

POUR : {partie}
CONTRE : {adverse}

EXPOSE DES FAITS :

{faits}

PAR CES MOTIFS :

{dispositif}

Fait le {date_today}
Maître NOM DE L'AVOCAT
"""
        
        filename = f"conclusions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        filepath = os.path.join(self.templates_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(template)
        
        return template
    
    def generer_mise_en_demeure(self, data: Dict) -> str:
        """Générer une mise en demeure"""
        date_today = datetime.now().strftime('%d/%m/%Y')
        
        destinataire = data.get('destinataire', 'DESTINATAIRE')
        objet = data.get('objet', 'OBJET')
        demandes = data.get('demandes', 'DEMANDES')
        delai = data.get('delai', '8')
        
        template = f"""MISE EN DEMEURE

RECOMMANDÉ AVEC ACCUSÉ DE RÉCEPTION

Date : {date_today}

À : {destinataire}

Objet : {objet}

Madame, Monsieur,

{demandes}

Délai : {delai} jours

Maître NOM DE L'AVOCAT
"""
        
        filename = f"mise_en_demeure_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        filepath = os.path.join(self.templates_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(template)
        
        return template
    
    def generer_requete(self, data: Dict) -> str:
        """Générer une requête"""
        date_today = datetime.now().strftime('%d/%m/%Y')
        
        requerant = data.get('requerant', 'REQUÉRANT')
        objet = data.get('objet', 'OBJET')
        mesures = data.get('mesures_sollicitees', 'MESURES')
        
        template = f"""REQUÊTE

REQUÉRANT : {requerant}

OBJET : {objet}

MESURES SOLLICITÉES :

{mesures}

Fait le {date_today}
Maître NOM DE L'AVOCAT
"""
        
        filename = f"requete_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        filepath = os.path.join(self.templates_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(template)
        
        return template
    
    def lister_templates(self) -> list:
        """Lister tous les documents générés"""
        if not os.path.exists(self.templates_dir):
            return []
        
        files = os.listdir(self.templates_dir)
        templates = []
        
        for file in files:
            filepath = os.path.join(self.templates_dir, file)
            if os.path.isfile(filepath):
                templates.append({
                    'filename': file,
                    'path': filepath,
                    'created': datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                    'size': os.path.getsize(filepath)
                })
        
        return sorted(templates, key=lambda x: x['created'], reverse=True)
    
    def get_template(self, filename: str) -> Optional[str]:
        """Récupérer le contenu d'un template"""
        filepath = os.path.join(self.templates_dir, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        
        return None
