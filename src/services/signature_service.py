"""Service de signature numérique manuscrite"""

import os
import json
import base64
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import io
from typing import Dict, List, Optional

class SignatureService:
    """Gestion des signatures numériques manuscrites"""
    
    def __init__(self, app_dir: str):
        self.app_dir = app_dir
        self.signatures_file = os.path.join(app_dir, "signatures.json")
        self.signatures_dir = os.path.join(app_dir, "signatures")
        os.makedirs(self.signatures_dir, exist_ok=True)
    
    def save_signature(self, signature_data: str, name: str, user_id: str = "default") -> Dict:
        """Sauvegarde une signature manuscrite"""
        try:
            # Décoder la signature base64
            signature_bytes = base64.b64decode(signature_data.split(',')[1])
            
            # Générer nom de fichier unique
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"signature_{user_id}_{timestamp}.png"
            filepath = os.path.join(self.signatures_dir, filename)
            
            # Sauvegarder l'image
            with open(filepath, 'wb') as f:
                f.write(signature_bytes)
            
            # Métadonnées
            signature_info = {
                'id': f"{user_id}_{timestamp}",
                'name': name,
                'filename': filename,
                'filepath': filepath,
                'user_id': user_id,
                'created_at': datetime.now().isoformat(),
                'size': len(signature_bytes)
            }
            
            # Sauvegarder dans le registre
            signatures = self.load_signatures()
            signatures[signature_info['id']] = signature_info
            self.save_signatures(signatures)
            
            return {
                'success': True,
                'signature_id': signature_info['id'],
                'message': 'Signature sauvegardée'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_signatures(self, user_id: str = "default") -> List[Dict]:
        """Récupère toutes les signatures d'un utilisateur"""
        signatures = self.load_signatures()
        user_signatures = []
        
        for sig_id, sig_info in signatures.items():
            if sig_info.get('user_id') == user_id:
                # Vérifier que le fichier existe
                if os.path.exists(sig_info['filepath']):
                    user_signatures.append(sig_info)
        
        return user_signatures
    
    def get_signature_image(self, signature_id: str) -> Optional[str]:
        """Récupère une signature en base64"""
        signatures = self.load_signatures()
        
        if signature_id in signatures:
            filepath = signatures[signature_id]['filepath']
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    image_data = f.read()
                return base64.b64encode(image_data).decode()
        
        return None
    
    def delete_signature(self, signature_id: str) -> Dict:
        """Supprime une signature"""
        try:
            signatures = self.load_signatures()
            
            if signature_id in signatures:
                filepath = signatures[signature_id]['filepath']
                
                # Supprimer le fichier
                if os.path.exists(filepath):
                    os.remove(filepath)
                
                # Supprimer du registre
                del signatures[signature_id]
                self.save_signatures(signatures)
                
                return {'success': True, 'message': 'Signature supprimée'}
            else:
                return {'success': False, 'error': 'Signature introuvable'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def apply_signature_to_document(self, document_path: str, signature_id: str, 
                                  position: Dict = None) -> Dict:
        """Applique une signature sur un document"""
        try:
            signatures = self.load_signatures()
            
            if signature_id not in signatures:
                return {'success': False, 'error': 'Signature introuvable'}
            
            signature_path = signatures[signature_id]['filepath']
            
            if not os.path.exists(signature_path):
                return {'success': False, 'error': 'Fichier signature introuvable'}
            
            # Ouvrir le document (image)
            with Image.open(document_path) as doc_img:
                # Ouvrir la signature
                with Image.open(signature_path) as sig_img:
                    # Convertir en RGBA pour transparence
                    if doc_img.mode != 'RGBA':
                        doc_img = doc_img.convert('RGBA')
                    if sig_img.mode != 'RGBA':
                        sig_img = sig_img.convert('RGBA')
                    
                    # Position par défaut (coin bas droit)
                    if not position:
                        position = {
                            'x': doc_img.width - sig_img.width - 50,
                            'y': doc_img.height - sig_img.height - 50
                        }
                    
                    # Redimensionner la signature si nécessaire
                    max_width = doc_img.width // 4
                    max_height = doc_img.height // 6
                    
                    if sig_img.width > max_width or sig_img.height > max_height:
                        sig_img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                    
                    # Appliquer la signature
                    doc_img.paste(sig_img, (position['x'], position['y']), sig_img)
                    
                    # Sauvegarder le document signé
                    signed_filename = f"signed_{os.path.basename(document_path)}"
                    signed_path = os.path.join(self.signatures_dir, signed_filename)
                    doc_img.save(signed_path, 'PNG')
                    
                    return {
                        'success': True,
                        'signed_document': signed_path,
                        'message': 'Document signé avec succès'
                    }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_signature_template(self, text: str, width: int = 300, height: int = 100) -> str:
        """Crée un template de signature avec du texte"""
        try:
            # Créer image
            img = Image.new('RGBA', (width, height), (255, 255, 255, 0))
            draw = ImageDraw.Draw(img)
            
            # Police (utiliser police système)
            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()
            
            # Calculer position centrée
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            # Dessiner le texte
            draw.text((x, y), text, fill=(0, 0, 0, 255), font=font)
            
            # Convertir en base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_data = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_data}"
            
        except Exception as e:
            return ""
    
    def load_signatures(self) -> Dict:
        """Charge le registre des signatures"""
        if os.path.exists(self.signatures_file):
            try:
                with open(self.signatures_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_signatures(self, signatures: Dict):
        """Sauvegarde le registre des signatures"""
        with open(self.signatures_file, 'w', encoding='utf-8') as f:
            json.dump(signatures, f, indent=2, ensure_ascii=False)
    
    def get_document_types(self) -> List[Dict]:
        """Retourne les types de documents officiels supportés"""
        return [
            {
                'type': 'demande_administrative',
                'name': 'Demande Administrative',
                'description': 'Courriers officiels aux administrations',
                'signature_required': True
            },
            {
                'type': 'reclamation',
                'name': 'Réclamation',
                'description': 'Lettres de réclamation',
                'signature_required': True
            },
            {
                'type': 'attestation',
                'name': 'Attestation',
                'description': 'Attestations sur l\'honneur',
                'signature_required': True
            },
            {
                'type': 'contrat',
                'name': 'Contrat',
                'description': 'Documents contractuels',
                'signature_required': True
            }
        ]