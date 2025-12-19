import requests
import json
from typing import Dict, List, Optional, Any

class CRMConnector:
    def __init__(self, crm_type: str, api_key: str, base_url: str = ""):
        self.crm_type = crm_type.lower()
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self._setup_auth()
    
    def _setup_auth(self):
        if self.crm_type == 'salesforce':
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            })
        elif self.crm_type == 'hubspot':
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            })
    
    def get_contacts(self, limit: int = 100) -> List[Dict]:
        try:
            if self.crm_type == 'hubspot':
                return self._get_hubspot_contacts(limit)
            return []
        except Exception as e:
            return []
    
    def _get_hubspot_contacts(self, limit: int) -> List[Dict]:
        url = f"{self.base_url}/crm/v3/objects/contacts"
        params = {
            'limit': limit,
            'properties': 'firstname,lastname,email,phone'
        }
        
        response = self.session.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            return [self._normalize_contact(contact, 'hubspot') 
                   for contact in data.get('results', [])]
        return []
    
    def _normalize_contact(self, contact: Dict, source: str) -> Dict:
        normalized = {
            'id': contact.get('id', ''),
            'name': '',
            'email': '',
            'phone': '',
            'source': source
        }
        
        if source == 'hubspot':
            props = contact.get('properties', {})
            normalized.update({
                'name': f"{props.get('firstname', '')} {props.get('lastname', '')}".strip(),
                'email': props.get('email', ''),
                'phone': props.get('phone', '')
            })
        
        return normalized
    
    def test_connection(self) -> Dict[str, Any]:
        try:
            if self.crm_type == 'hubspot':
                url = f"{self.base_url}/crm/v3/objects/contacts?limit=1"
            else:
                return {'success': False, 'error': 'CRM non supporté'}
            
            response = self.session.get(url)
            
            if response.status_code == 200:
                return {'success': True, 'message': 'Connexion réussie'}
            else:
                return {'success': False, 'error': f'Erreur HTTP {response.status_code}'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}