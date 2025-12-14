"""
Gestionnaire de répertoire de contacts avec recherche IA
Gestion des destinataires et recherche automatique d'emails d'institutions
"""
import json
import os
from typing import Dict, List, Optional
from datetime import datetime

class ContactsManager:
    """Gestion intelligente des contacts et destinataires"""
    
    # Base de données d'institutions françaises
    INSTITUTIONS_DB = {
        'mairie': {
            'type': 'administration',
            'keywords': ['mairie', 'ville', 'municipal', 'commune'],
            'email_patterns': ['mairie@', 'contact@mairie', 'accueil@ville'],
            'tone': 'formel'
        },
        'prefecture': {
            'type': 'administration',
            'keywords': ['préfecture', 'sous-préfecture', 'préfet'],
            'email_patterns': ['prefecture@', 'contact@', 'accueil@'],
            'tone': 'très_formel'
        },
        'caf': {
            'type': 'sociale',
            'keywords': ['caf', 'allocations familiales', 'prestations'],
            'email_patterns': ['@caf.fr', 'contact@caf'],
            'tone': 'formel'
        },
        'impots': {
            'type': 'fiscale',
            'keywords': ['impôts', 'finances publiques', 'trésor public', 'dgfip'],
            'email_patterns': ['@dgfip.finances.gouv.fr', 'impots@'],
            'tone': 'très_formel'
        },
        'cpam': {
            'type': 'santé',
            'keywords': ['cpam', 'assurance maladie', 'sécurité sociale'],
            'email_patterns': ['@assurance-maladie.fr', '@cpam'],
            'tone': 'formel'
        },
        'pole_emploi': {
            'type': 'emploi',
            'keywords': ['pôle emploi', 'france travail', 'chômage'],
            'email_patterns': ['@pole-emploi.fr', '@francetravail.fr'],
            'tone': 'formel'
        },
        'education': {
            'type': 'education',
            'keywords': ['école', 'collège', 'lycée', 'académie', 'rectorat'],
            'email_patterns': ['@ac-', '@education.gouv.fr'],
            'tone': 'formel'
        },
        'banque': {
            'type': 'finance',
            'keywords': ['banque', 'crédit', 'compte'],
            'email_patterns': ['@', 'contact@', 'service.client@'],
            'tone': 'professionnel'
        },
        'assurance': {
            'type': 'assurance',
            'keywords': ['assurance', 'mutuelle', 'garantie'],
            'email_patterns': ['@', 'contact@', 'client@'],
            'tone': 'professionnel'
        },
        'fournisseur_energie': {
            'type': 'energie',
            'keywords': ['edf', 'engie', 'électricité', 'gaz'],
            'email_patterns': ['@edf.fr', '@engie.com', 'client@'],
            'tone': 'professionnel'
        }
    }
    
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.contacts_file = os.path.join(data_dir, 'contacts.json')
        self.history_file = os.path.join(data_dir, 'contacts_history.json')
        self.contacts = self._load_contacts()
    
    def _load_contacts(self) -> Dict:
        """Charge le répertoire de contacts"""
        if os.path.exists(self.contacts_file):
            with open(self.contacts_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            'custom': [],  # Contacts ajoutés manuellement
            'institutions': {},  # Institutions trouvées
            'frequent': []  # Destinataires fréquents
        }
    
    def _save_contacts(self):
        """Sauvegarde le répertoire"""
        with open(self.contacts_file, 'w', encoding='utf-8') as f:
            json.dump(self.contacts, f, indent=2, ensure_ascii=False)
    
    def add_contact(self, name: str, email: str, category: str = 'custom', 
                   metadata: Dict = None) -> bool:
        """Ajoute un contact au répertoire"""
        
        contact = {
            'name': name,
            'email': email,
            'category': category,
            'added_date': datetime.now().isoformat(),
            'metadata': metadata or {},
            'email_count': 0
        }
        
        # Éviter les doublons
        if category == 'custom':
            if not any(c['email'] == email for c in self.contacts['custom']):
                self.contacts['custom'].append(contact)
                self._save_contacts()
                return True
        
        return False
    
    def search_institution(self, query: str, openai_service=None) -> List[Dict]:
        """
        Recherche une institution et suggère des contacts
        
        Args:
            query: Texte de recherche (ex: "mairie de Paris", "CAF")
            openai_service: Service OpenAI pour recherche avancée
            
        Returns:
            Liste de contacts suggérés
        """
        query_lower = query.lower()
        results = []
        
        # Recherche dans la base d'institutions
        for inst_key, inst_data in self.INSTITUTIONS_DB.items():
            if any(kw in query_lower for kw in inst_data['keywords']):
                results.append({
                    'type': inst_key,
                    'name': inst_key.replace('_', ' ').title(),
                    'category': inst_data['type'],
                    'tone_recommende': inst_data['tone'],
                    'email_patterns': inst_data['email_patterns'],
                    'source': 'database'
                })
        
        # Recherche avec IA si disponible
        if openai_service and not results:
            ai_results = self._search_with_ai(query, openai_service)
            results.extend(ai_results)
        
        # Recherche dans contacts existants
        for contact in self.contacts['custom']:
            if (query_lower in contact['name'].lower() or 
                query_lower in contact.get('metadata', {}).get('organization', '').lower()):
                results.append({
                    'type': 'saved',
                    'name': contact['name'],
                    'email': contact['email'],
                    'category': contact['category'],
                    'source': 'saved'
                })
        
        return results
    
    def _search_with_ai(self, query: str, openai_service) -> List[Dict]:
        """Recherche avancée avec IA"""
        
        prompt = f"""Identifie l'institution ou l'organisation mentionnée et fournis des informations:

REQUÊTE: "{query}"

Réponds en JSON:
{{
    "institution": "nom de l'institution",
    "type": "administration/entreprise/association/autre",
    "ville": "ville si mentionnée",
    "departement": "département si connu",
    "email_type": "type d'email probable",
    "ton_recommande": "formel/très_formel/professionnel",
    "infos_utiles": "informations complémentaires"
}}
"""
        
        try:
            response = openai_service.generate_completion(
                prompt=prompt,
                max_tokens=300,
                temperature=0.3
            )
            data = json.loads(response)
            return [{
                'type': 'ai_found',
                'name': data.get('institution', 'Inconnu'),
                'category': data.get('type', 'autre'),
                'tone_recommende': data.get('ton_recommande', 'formel'),
                'metadata': data,
                'source': 'ai'
            }]
        except:
            return []
    
    def get_suggested_recipients(self, document_analysis: Dict) -> List[Dict]:
        """Suggère des destinataires basés sur l'analyse du document"""
        
        suggestions = []
        doc_type = document_analysis.get('type_document', '')
        destinataire_suggere = document_analysis.get('destinataire_suggere', '')
        
        # Recherche basée sur le type de document
        if destinataire_suggere:
            suggestions.extend(self.search_institution(destinataire_suggere))
        
        # Recherche basée sur les entités trouvées
        entites = document_analysis.get('entites', [])
        for entite in entites:
            suggestions.extend(self.search_institution(entite))
        
        # Dédoublonnage
        seen = set()
        unique_suggestions = []
        for sugg in suggestions:
            key = sugg.get('email', sugg.get('name', ''))
            if key and key not in seen:
                seen.add(key)
                unique_suggestions.append(sugg)
        
        return unique_suggestions[:10]  # Top 10
    
    def record_email_sent(self, recipient: str, recipient_name: str = ""):
        """Enregistre l'envoi d'un email pour statistiques"""
        
        # Incrémenter le compteur pour contacts existants
        for contact in self.contacts['custom']:
            if contact['email'] == recipient:
                contact['email_count'] = contact.get('email_count', 0) + 1
                contact['last_email'] = datetime.now().isoformat()
                break
        else:
            # Ajouter aux fréquents si nouveau
            freq_contact = {
                'email': recipient,
                'name': recipient_name or recipient.split('@')[0],
                'email_count': 1,
                'first_email': datetime.now().isoformat(),
                'last_email': datetime.now().isoformat()
            }
            
            # Mettre à jour ou ajouter
            found = False
            for fc in self.contacts['frequent']:
                if fc['email'] == recipient:
                    fc['email_count'] += 1
                    fc['last_email'] = datetime.now().isoformat()
                    found = True
                    break
            
            if not found:
                self.contacts['frequent'].append(freq_contact)
        
        self._save_contacts()
    
    def get_frequent_contacts(self, limit: int = 10) -> List[Dict]:
        """Retourne les contacts les plus fréquemment contactés"""
        
        all_contacts = self.contacts['custom'] + self.contacts['frequent']
        sorted_contacts = sorted(
            all_contacts,
            key=lambda x: x.get('email_count', 0),
            reverse=True
        )
        
        return sorted_contacts[:limit]
    
    def get_all_contacts(self) -> Dict:
        """Retourne tous les contacts"""
        return self.contacts
    
    def delete_contact(self, email: str) -> bool:
        """Supprime un contact"""
        
        # Supprimer des contacts custom
        self.contacts['custom'] = [
            c for c in self.contacts['custom'] if c['email'] != email
        ]
        
        # Supprimer des fréquents
        self.contacts['frequent'] = [
            c for c in self.contacts['frequent'] if c['email'] != email
        ]
        
        self._save_contacts()
        return True
    
    def export_contacts_vcf(self, output_path: str) -> bool:
        """Exporte les contacts au format VCF (vCard)"""
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                for contact in self.contacts['custom']:
                    f.write("BEGIN:VCARD\n")
                    f.write("VERSION:3.0\n")
                    f.write(f"FN:{contact['name']}\n")
                    f.write(f"EMAIL:{contact['email']}\n")
                    if 'organization' in contact.get('metadata', {}):
                        f.write(f"ORG:{contact['metadata']['organization']}\n")
                    f.write("END:VCARD\n\n")
            return True
        except:
            return False
