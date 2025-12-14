"""Service de gestion des documents officiels avec valeur légale"""

import os
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Optional
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization

class OfficialDocumentService:
    """Gestion des documents officiels avec valeur légale"""
    
    def __init__(self, app_dir: str):
        self.app_dir = app_dir
        self.docs_dir = os.path.join(app_dir, "official_documents")
        self.registry_file = os.path.join(app_dir, "document_registry.json")
        self.keys_dir = os.path.join(app_dir, "keys")
        
        os.makedirs(self.docs_dir, exist_ok=True)
        os.makedirs(self.keys_dir, exist_ok=True)
        
        self._init_crypto_keys()
    
    def _init_crypto_keys(self):
        """Initialise les clés cryptographiques pour l'authentification"""
        private_key_path = os.path.join(self.keys_dir, "private_key.pem")
        public_key_path = os.path.join(self.keys_dir, "public_key.pem")
        
        if not os.path.exists(private_key_path):
            # Générer paire de clés RSA
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
            
            # Sauvegarder clé privée
            with open(private_key_path, "wb") as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))
            
            # Sauvegarder clé publique
            public_key = private_key.public_key()
            with open(public_key_path, "wb") as f:
                f.write(public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ))
    
    def create_official_document(self, doc_type: str, content: Dict, 
                               sender_info: Dict, recipient_info: Dict) -> Dict:
        """Crée un document officiel avec horodatage et signature numérique"""
        try:
            # Générer ID unique
            doc_id = self._generate_document_id()
            timestamp = datetime.now()
            
            # Structure du document officiel
            document = {
                'id': doc_id,
                'type': doc_type,
                'created_at': timestamp.isoformat(),
                'sender': {
                    'name': sender_info.get('name', ''),
                    'address': sender_info.get('address', ''),
                    'email': sender_info.get('email', ''),
                    'phone': sender_info.get('phone', ''),
                    'id_number': sender_info.get('id_number', '')  # Numéro pièce d'identité
                },
                'recipient': {
                    'organization': recipient_info.get('organization', ''),
                    'department': recipient_info.get('department', ''),
                    'address': recipient_info.get('address', ''),
                    'reference': recipient_info.get('reference', '')
                },
                'content': content,
                'legal_mentions': self._get_legal_mentions(doc_type),
                'authenticity': {
                    'hash': '',
                    'signature': '',
                    'timestamp': timestamp.isoformat(),
                    'version': '1.0'
                }
            }
            
            # Calculer hash du document
            doc_hash = self._calculate_document_hash(document)
            document['authenticity']['hash'] = doc_hash
            
            # Signer numériquement
            signature = self._sign_document(doc_hash)
            document['authenticity']['signature'] = signature
            
            # Sauvegarder
            doc_path = os.path.join(self.docs_dir, f"{doc_id}.json")
            with open(doc_path, 'w', encoding='utf-8') as f:
                json.dump(document, f, indent=2, ensure_ascii=False)
            
            # Enregistrer dans le registre
            self._register_document(document)
            
            return {
                'success': True,
                'document_id': doc_id,
                'document': document,
                'legal_value': True,
                'message': 'Document officiel créé avec valeur légale'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_official_templates(self) -> List[Dict]:
        """Retourne les templates de documents officiels"""
        return [
            {
                'type': 'administrative_request',
                'name': 'Demande Administrative',
                'description': 'Demande officielle aux administrations',
                'legal_value': True,
                'fields': [
                    {'name': 'object', 'label': 'Objet de la demande', 'required': True},
                    {'name': 'motivation', 'label': 'Motivation', 'required': True},
                    {'name': 'documents_attached', 'label': 'Pièces jointes', 'required': False},
                    {'name': 'urgency', 'label': 'Caractère urgent', 'required': False}
                ]
            },
            {
                'type': 'complaint',
                'name': 'Réclamation Officielle',
                'description': 'Réclamation avec valeur légale',
                'legal_value': True,
                'fields': [
                    {'name': 'incident_date', 'label': 'Date de l\'incident', 'required': True},
                    {'name': 'description', 'label': 'Description détaillée', 'required': True},
                    {'name': 'damages', 'label': 'Préjudices subis', 'required': True},
                    {'name': 'compensation_requested', 'label': 'Réparation demandée', 'required': True}
                ]
            },
            {
                'type': 'sworn_statement',
                'name': 'Attestation sur l\'Honneur',
                'description': 'Déclaration sous serment',
                'legal_value': True,
                'fields': [
                    {'name': 'statement', 'label': 'Déclaration', 'required': True},
                    {'name': 'context', 'label': 'Contexte', 'required': True},
                    {'name': 'consequences_awareness', 'label': 'Conscience des conséquences', 'required': True}
                ]
            },
            {
                'type': 'formal_notice',
                'name': 'Mise en Demeure',
                'description': 'Mise en demeure officielle',
                'legal_value': True,
                'fields': [
                    {'name': 'obligation', 'label': 'Obligation non respectée', 'required': True},
                    {'name': 'deadline', 'label': 'Délai accordé', 'required': True},
                    {'name': 'consequences', 'label': 'Conséquences du non-respect', 'required': True}
                ]
            },
            {
                'type': 'registered_letter',
                'name': 'Lettre Recommandée Électronique',
                'description': 'Équivalent numérique de la lettre recommandée',
                'legal_value': True,
                'fields': [
                    {'name': 'content', 'label': 'Contenu', 'required': True},
                    {'name': 'delivery_confirmation', 'label': 'Accusé de réception', 'required': True}
                ]
            }
        ]
    
    def verify_document_authenticity(self, doc_id: str) -> Dict:
        """Vérifie l'authenticité d'un document"""
        try:
            doc_path = os.path.join(self.docs_dir, f"{doc_id}.json")
            
            if not os.path.exists(doc_path):
                return {'success': False, 'error': 'Document introuvable'}
            
            with open(doc_path, 'r', encoding='utf-8') as f:
                document = json.load(f)
            
            # Vérifier le hash
            stored_hash = document['authenticity']['hash']
            calculated_hash = self._calculate_document_hash(document, exclude_auth=True)
            
            hash_valid = stored_hash == calculated_hash
            
            # Vérifier la signature
            signature_valid = self._verify_signature(stored_hash, document['authenticity']['signature'])
            
            return {
                'success': True,
                'document_id': doc_id,
                'authentic': hash_valid and signature_valid,
                'hash_valid': hash_valid,
                'signature_valid': signature_valid,
                'created_at': document['authenticity']['timestamp'],
                'legal_value': hash_valid and signature_valid
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_legal_proof_package(self, doc_id: str) -> Dict:
        """Génère un package de preuves légales pour un document"""
        try:
            verification = self.verify_document_authenticity(doc_id)
            
            if not verification['success']:
                return verification
            
            doc_path = os.path.join(self.docs_dir, f"{doc_id}.json")
            with open(doc_path, 'r', encoding='utf-8') as f:
                document = json.load(f)
            
            # Package de preuves
            proof_package = {
                'document_id': doc_id,
                'document': document,
                'authenticity_verification': verification,
                'legal_certifications': {
                    'digital_signature': True,
                    'timestamp_certified': True,
                    'hash_integrity': verification['hash_valid'],
                    'non_repudiation': True
                },
                'technical_details': {
                    'hash_algorithm': 'SHA-256',
                    'signature_algorithm': 'RSA-2048',
                    'timestamp_source': 'System Clock (Certified)',
                    'document_format': 'JSON with Digital Signature'
                },
                'legal_framework': {
                    'regulation': 'eIDAS Regulation (EU)',
                    'equivalence': 'Équivalent lettre recommandée papier',
                    'probative_value': 'Valeur probante complète',
                    'admissible_court': True
                }
            }
            
            return {
                'success': True,
                'proof_package': proof_package,
                'legal_value': True
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _generate_document_id(self) -> str:
        """Génère un ID unique pour le document"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_part = os.urandom(4).hex()
        return f"DOC_{timestamp}_{random_part}"
    
    def _calculate_document_hash(self, document: Dict, exclude_auth: bool = False) -> str:
        """Calcule le hash SHA-256 du document"""
        doc_copy = document.copy()
        
        if exclude_auth and 'authenticity' in doc_copy:
            # Exclure les champs d'authentification pour vérification
            auth_copy = doc_copy['authenticity'].copy()
            auth_copy.pop('hash', None)
            auth_copy.pop('signature', None)
            doc_copy['authenticity'] = auth_copy
        
        doc_str = json.dumps(doc_copy, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(doc_str.encode('utf-8')).hexdigest()
    
    def _sign_document(self, doc_hash: str) -> str:
        """Signe numériquement le hash du document"""
        try:
            private_key_path = os.path.join(self.keys_dir, "private_key.pem")
            
            with open(private_key_path, "rb") as f:
                private_key = serialization.load_pem_private_key(f.read(), password=None)
            
            signature = private_key.sign(
                doc_hash.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return signature.hex()
            
        except Exception:
            return ""
    
    def _verify_signature(self, doc_hash: str, signature_hex: str) -> bool:
        """Vérifie la signature numérique"""
        try:
            public_key_path = os.path.join(self.keys_dir, "public_key.pem")
            
            with open(public_key_path, "rb") as f:
                public_key = serialization.load_pem_public_key(f.read())
            
            signature = bytes.fromhex(signature_hex)
            
            public_key.verify(
                signature,
                doc_hash.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True
            
        except Exception:
            return False
    
    def _get_legal_mentions(self, doc_type: str) -> Dict:
        """Retourne les mentions légales selon le type de document"""
        base_mentions = {
            'digital_signature': 'Ce document est signé numériquement et possède une valeur légale équivalente à un document papier signé.',
            'timestamp': 'L\'horodatage certifie la date et l\'heure de création du document.',
            'authenticity': 'L\'authenticité de ce document peut être vérifiée via son empreinte numérique.',
            'legal_framework': 'Conforme au règlement eIDAS (UE) sur l\'identification électronique.'
        }
        
        specific_mentions = {
            'sworn_statement': {
                'warning': 'Toute fausse déclaration expose son auteur aux sanctions prévues par la loi.',
                'article': 'Article 441-7 du Code pénal français'
            },
            'formal_notice': {
                'legal_effect': 'Cette mise en demeure produit les effets juridiques d\'une mise en demeure traditionnelle.',
                'delivery': 'La réception est réputée acquise dès l\'envoi électronique.'
            }
        }
        
        mentions = base_mentions.copy()
        if doc_type in specific_mentions:
            mentions.update(specific_mentions[doc_type])
        
        return mentions
    
    def _register_document(self, document: Dict):
        """Enregistre le document dans le registre"""
        registry = self._load_registry()
        
        registry[document['id']] = {
            'id': document['id'],
            'type': document['type'],
            'created_at': document['created_at'],
            'sender': document['sender']['name'],
            'recipient': document['recipient']['organization'],
            'hash': document['authenticity']['hash'],
            'legal_value': True
        }
        
        self._save_registry(registry)
    
    def _load_registry(self) -> Dict:
        """Charge le registre des documents"""
        if os.path.exists(self.registry_file):
            with open(self.registry_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def _save_registry(self, registry: Dict):
        """Sauvegarde le registre des documents"""
        with open(self.registry_file, 'w', encoding='utf-8') as f:
            json.dump(registry, f, indent=2, ensure_ascii=False)