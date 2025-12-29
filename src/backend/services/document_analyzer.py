"""
Module d'analyse documentaire avec IA locale (Ollama)
Extraction automatique : type, montants, délais, urgence
"""

import os
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests
import json

try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  pytesseract non installé. OCR désactivé.")

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("⚠️  PyPDF2 non installé. Extraction PDF désactivée.")


class DocumentAnalyzer:
    """
    Analyseur de documents avec IA locale (Ollama)
    Détecte automatiquement : type, montants, délais, urgence
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model = "llama3.2:latest"  # Modèle Ollama local
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extraction texte d'un PDF"""
        if not PDF_AVAILABLE:
            return "[PDF extraction non disponible - installer PyPDF2]"
            
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text()
        except Exception as e:
            print(f"❌ Erreur PDF extraction: {e}")
        return text
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extraction texte d'une image (OCR)"""
        if not OCR_AVAILABLE:
            return "[OCR non disponible - installer pytesseract et Pillow]"
            
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image, lang='fra')
            return text
        except Exception as e:
            print(f"❌ Erreur OCR: {e}")
            return ""
    
    def analyze_with_ollama(self, text: str) -> Dict:
        """
        Analyse du texte avec Ollama (IA locale)
        Détecte: type document, montants, délais, actions requises
        """
        
        prompt = f"""Analyse ce document et extrais les informations suivantes au format JSON strict:

DOCUMENT:
{text[:2000]}

Extrais EXACTEMENT ces champs (réponds UNIQUEMENT avec du JSON valide):
{{
  "type_document": "facture|devis|contrat|email|courrier|autre",
  "numero_document": "numéro du document ou null",
  "date_emission": "YYYY-MM-DD ou null",
  "date_echeance": "YYYY-MM-DD ou null",
  "montant_ht": nombre ou null,
  "montant_ttc": nombre ou null,
  "emetteur": "nom émetteur ou null",
  "destinataire": "nom destinataire ou null",
  "delai_reponse_jours": nombre de jours ou 7,
  "niveau_urgence": "faible|moyen|élevé|critique",
  "actions_requises": ["action1", "action2"],
  "mots_cles": ["mot1", "mot2"]
}}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après."""
        
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = json.loads(result['response'])
                return analysis
            else:
                print(f"⚠️  Ollama erreur {response.status_code}, utilisation fallback")
                return self._fallback_analysis(text)
                
        except Exception as e:
            print(f"⚠️  Ollama non disponible ({e}), utilisation fallback regex")
            return self._fallback_analysis(text)
    
    def _fallback_analysis(self, text: str) -> Dict:
        """
        Analyse de secours (regex) si Ollama échoue
        """
        analysis = {
            "type_document": self._detect_document_type(text),
            "numero_document": self._extract_numero(text),
            "date_emission": self._extract_date_emission(text),
            "date_echeance": self._extract_date_echeance(text),
            "montant_ht": self._extract_montant_ht(text),
            "montant_ttc": self._extract_montant_ttc(text),
            "emetteur": self._extract_emetteur(text),
            "destinataire": self._extract_destinataire(text),
            "delai_reponse_jours": self._calculate_delai(text),
            "niveau_urgence": self._detect_urgence(text),
            "actions_requises": self._extract_actions(text),
            "mots_cles": self._extract_keywords(text)
        }
        return analysis
    
    def _detect_document_type(self, text: str) -> str:
        """Détection type de document"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['facture', 'invoice', 'montant dû', 'à payer']):
            return "facture"
        elif any(word in text_lower for word in ['devis', 'quotation', 'proposition', 'estimation']):
            return "devis"
        elif any(word in text_lower for word in ['contrat', 'accord', 'convention', 'engagement']):
            return "contrat"
        elif any(word in text_lower for word in ['objet:', 'de:', 'à:', 'subject:']):
            return "email"
        elif any(word in text_lower for word in ['courrier', 'lettre', 'correspondance']):
            return "courrier"
        else:
            return "autre"
    
    def _extract_numero(self, text: str) -> Optional[str]:
        """Extraction numéro de document"""
        patterns = [
            r'n[°o\s]*(?:facture|devis|contrat)?[\s:]*(\d{4}[-/]\d{3,4})',
            r'(?:facture|devis|contrat)[\s:]*n[°o\s]*(\d+)',
            r'(?:ref|référence|reference)[\s:]*([A-Z0-9-/]+)',
            r'n[°o][\s]*([0-9]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_date_emission(self, text: str) -> Optional[str]:
        """Extraction date d'émission"""
        patterns = [
            r'(?:date|émis le|établi le|du)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(?:le\s)?(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
            r'(\d{4}-\d{2}-\d{2})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                return self._parse_date(date_str)
        return None
    
    def _extract_date_echeance(self, text: str) -> Optional[str]:
        """Extraction date d'échéance"""
        patterns = [
            r'(?:échéance|à payer avant le|limite|deadline|due date)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(?:paiement le|règlement le)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                return self._parse_date(date_str)
        return None
    
    def _extract_montant_ht(self, text: str) -> Optional[float]:
        """Extraction montant HT"""
        patterns = [
            r'(?:montant ht|total ht|sous-total)[\s:]*(\d+[,\s]?\d*(?:\.\d{2})?)\s*€',
            r'ht[\s:]*(\d+[,\s]?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1).replace(',', '.').replace(' ', ''))
                except:
                    pass
        return None
    
    def _extract_montant_ttc(self, text: str) -> Optional[float]:
        """Extraction montant TTC"""
        patterns = [
            r'(?:montant ttc|total ttc|à payer|net à payer)[\s:]*(\d+[,\s]?\d*(?:\.\d{2})?)\s*€',
            r'ttc[\s:]*(\d+[,\s]?\d*)',
            r'(\d+[,\s]?\d*)\s*€\s*ttc'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1).replace(',', '.').replace(' ', ''))
                except:
                    pass
        return None
    
    def _extract_emetteur(self, text: str) -> Optional[str]:
        """Extraction émetteur"""
        # Première ligne non-vide souvent = émetteur
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines[:5]:
            if len(line) > 5 and not any(word in line.lower() for word in ['facture', 'devis', 'date']):
                return line[:100]  # Limiter longueur
        return None
    
    def _extract_destinataire(self, text: str) -> Optional[str]:
        """Extraction destinataire"""
        patterns = [
            r'(?:client|à l\'attention de|destinataire|facturé à)[\s:]*([A-Za-zÀ-ÿ\s&\'-]+)',
            r'(?:à|pour)[\s:]*([A-Z][A-Za-zÀ-ÿ\s&\'-]{5,})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:100]
        return None
    
    def _calculate_delai(self, text: str) -> int:
        """Calcul délai de réponse en jours"""
        text_lower = text.lower()
        
        # Recherche délais explicites
        if any(word in text_lower for word in ['urgent', 'immédiat', 'immédiate']):
            return 1
        elif '48h' in text_lower or '48 heures' in text_lower:
            return 2
        elif '7 jours' in text_lower or 'une semaine' in text_lower:
            return 7
        elif '15 jours' in text_lower or 'quinze jours' in text_lower:
            return 15
        elif '30 jours' in text_lower or 'un mois' in text_lower:
            return 30
        
        # Par défaut selon type
        if 'facture' in text_lower:
            return 30  # Factures = 30 jours
        elif 'devis' in text_lower:
            return 15  # Devis = 15 jours
        else:
            return 7   # Autre = 7 jours
    
    def _detect_urgence(self, text: str) -> str:
        """Détection niveau d'urgence"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['urgent', 'critique', 'immédiat', 'impératif']):
            return "critique"
        elif any(word in text_lower for word in ['important', 'rapidement', 'sous 48h']):
            return "élevé"
        elif any(word in text_lower for word in ['rappel', 'relance', 'dernier']):
            return "élevé"
        else:
            return "moyen"
    
    def _extract_actions(self, text: str) -> List[str]:
        """Extraction actions requises"""
        actions = []
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['payer', 'règlement', 'virement']):
            actions.append("Effectuer le paiement")
        if 'signer' in text_lower:
            actions.append("Signer le document")
        if any(word in text_lower for word in ['retourner', 'renvoyer']):
            actions.append("Retourner le document signé")
        if any(word in text_lower for word in ['fournir', 'transmettre', 'envoyer']):
            actions.append("Fournir les documents demandés")
        if 'répondre' in text_lower:
            actions.append("Répondre au courrier")
        if 'valider' in text_lower:
            actions.append("Valider le devis")
            
        return actions if actions else ["Traiter le document"]
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extraction mots-clés importants"""
        keywords = []
        text_lower = text.lower()
        
        important_words = ['facture', 'devis', 'contrat', 'urgent', 'paiement', 
                          'échéance', 'honoraires', 'prestations', 'services']
        
        for word in important_words:
            if word in text_lower:
                keywords.append(word)
        
        return keywords[:5]  # Top 5
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date vers format YYYY-MM-DD"""
        try:
            # Essayer différents formats
            for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%Y-%m-%d', '%d.%m.%Y']:
                try:
                    dt = datetime.strptime(date_str.strip(), fmt)
                    # Si année sur 2 chiffres < 50 = 20XX, sinon 19XX
                    if dt.year < 100:
                        dt = dt.replace(year=dt.year + 2000 if dt.year < 50 else dt.year + 1900)
                    return dt.strftime('%Y-%m-%d')
                except:
                    continue
        except:
            pass
        return None
    
    def process_document(self, file_path: str) -> Dict:
        """
        Pipeline complet d'analyse d'un document
        Returns: Dict avec toutes les infos extraites
        """
        print(f"📄 Analyse de: {file_path}")
        
        # 1. Extraction texte
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            text = self.extract_text_from_pdf(file_path)
        elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            text = self.extract_text_from_image(file_path)
        elif ext in ['.txt', '.md']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        else:
            return {'error': f'Format non supporté: {ext}'}
        
        if not text or len(text) < 10:
            return {'error': 'Texte extrait vide ou trop court'}
        
        print(f"✅ Texte extrait: {len(text)} caractères")
        
        # 2. Analyse IA
        analysis = self.analyze_with_ollama(text)
        
        # 3. Enrichissement
        analysis['file_path'] = file_path
        analysis['file_name'] = os.path.basename(file_path)
        analysis['extracted_text'] = text[:500]  # Premier 500 chars
        analysis['text_length'] = len(text)
        analysis['analyzed_at'] = datetime.now().isoformat()
        
        # 4. Calcul date TODO
        if analysis.get('date_echeance'):
            analysis['todo_date'] = analysis['date_echeance']
        elif analysis.get('date_emission') and analysis.get('delai_reponse_jours'):
            try:
                base_date = datetime.strptime(analysis['date_emission'], '%Y-%m-%d')
                todo_date = base_date + timedelta(days=analysis['delai_reponse_jours'])
                analysis['todo_date'] = todo_date.strftime('%Y-%m-%d')
            except:
                analysis['todo_date'] = None
        else:
            # Par défaut = aujourd'hui + délai
            delai = analysis.get('delai_reponse_jours', 7)
            todo_date = datetime.now() + timedelta(days=delai)
            analysis['todo_date'] = todo_date.strftime('%Y-%m-%d')
        
        # 5. Calcul jours restants
        if analysis.get('todo_date'):
            try:
                todo_dt = datetime.strptime(analysis['todo_date'], '%Y-%m-%d')
                days_left = (todo_dt - datetime.now()).days
                analysis['days_remaining'] = days_left
                
                # Ajuster urgence si deadline proche
                if days_left <= 1 and analysis.get('niveau_urgence') != 'critique':
                    analysis['niveau_urgence'] = 'critique'
                elif days_left <= 3 and analysis.get('niveau_urgence') == 'moyen':
                    analysis['niveau_urgence'] = 'élevé'
            except:
                analysis['days_remaining'] = None
        
        print(f"✅ Analyse complète: {analysis.get('type_document')} - Urgence: {analysis.get('niveau_urgence')}")
        
        return analysis


# ============ EXEMPLE D'UTILISATION ============

if __name__ == "__main__":
    analyzer = DocumentAnalyzer()
    
    # Test avec un fichier texte simple
    test_text = """
    FACTURE N° 2025-0142
    
    Cabinet DUPONT & ASSOCIÉS
    Avocats au Barreau de Paris
    
    Client: SAS TECHNO SOLUTIONS
    
    Date: 15/11/2025
    Échéance: 15/12/2025
    
    Honoraires conseil juridique: 3500.00 € HT
    TVA 20%: 700.00 €
    TOTAL TTC: 4200.00 €
    
    Paiement à 30 jours
    """
    
    # Créer fichier de test
    with open('test_facture.txt', 'w', encoding='utf-8') as f:
        f.write(test_text)
    
    # Analyser
    result = analyzer.process_document('test_facture.txt')
    
    print("\n" + "="*60)
    print("📄 RÉSULTAT ANALYSE:")
    print("="*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Nettoyer
    os.remove('test_facture.txt')
