import re
import json
from typing import Dict, List
from datetime import datetime

class EmailClassifier:
    def __init__(self):
        self.patterns = {
            'finance': [
                r'\b(facture|invoice|payment|paiement|bill|remboursement)\b',
                r'\b(€|$|USD|EUR|\d+[.,]\d+)\b',
                r'\b(bank|banque|credit|debit)\b'
            ],
            'urgent': [
                r'\b(urgent|asap|emergency|immediat|deadline)\b',
                r'\b(important|critique|priorit[eé])\b',
                r'[!]{2,}'
            ],
            'meeting': [
                r'\b(meeting|r[eé]union|rendez-vous|calendar|agenda)\b',
                r'\b(zoom|teams|skype|conference)\b',
                r'\b(\d{1,2}[h:]\d{2}|\d{1,2}h)\b'
            ],
            'marketing': [
                r'\b(newsletter|promotion|offer|offre|discount|reduction)\b',
                r'\b(unsubscribe|d[eé]sabonnement)\b',
                r'\b(sale|vente|special|limited)\b'
            ]
        }
        
        self.priority_patterns = {
            'high': [
                r'\b(urgent|asap|emergency|immediat)\b',
                r'[!]{2,}',
                r'\b(deadline|[eé]ch[eé]ance)\b'
            ],
            'medium': [
                r'\b(important|priorit[eé])\b',
                r'\b(please|s\'il vous pla[iî]t)\b'
            ]
        }
    
    def categorize_email(self, subject: str, body: str, sender: str) -> str:
        text = f"{subject} {body} {sender}".lower()
        
        scores = {}
        for category, patterns in self.patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                score += matches
            scores[category] = score
        
        if max(scores.values()) == 0:
            return 'general'
        
        return max(scores, key=scores.get)
    
    def get_priority(self, subject: str, body: str) -> str:
        text = f"{subject} {body}".lower()
        
        for priority, patterns in self.priority_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return priority
        
        return 'low'
    
    def extract_domain_info(self, sender: str) -> Dict:
        domain_match = re.search(r'@([^>]+)', sender)
        domain = domain_match.group(1) if domain_match else ''
        
        # Analyse du type de domaine
        domain_type = 'unknown'
        if any(x in domain for x in ['gmail', 'yahoo', 'hotmail', 'outlook']):
            domain_type = 'personal'
        elif any(x in domain for x in ['.gov', '.edu', '.org']):
            domain_type = 'institutional'
        elif domain and '.' in domain:
            domain_type = 'business'
        
        return {
            'domain': domain,
            'type': domain_type,
            'is_trusted': domain_type in ['institutional', 'business']
        }
    
    def analyze_content_quality(self, body: str) -> Dict:
        if not body:
            return {'quality': 'low', 'spam_score': 0.8}
        
        spam_indicators = [
            r'\b(free money|lottery|winner|congratulations)\b',
            r'\b(click here|act now|limited time)\b',
            r'[A-Z]{5,}',  # Excessive caps
            r'[!]{3,}'     # Multiple exclamations
        ]
        
        spam_score = 0
        for pattern in spam_indicators:
            if re.search(pattern, body, re.IGNORECASE):
                spam_score += 0.2
        
        quality = 'high' if spam_score < 0.3 else 'medium' if spam_score < 0.6 else 'low'
        
        return {
            'quality': quality,
            'spam_score': min(spam_score, 1.0),
            'word_count': len(body.split()),
            'has_links': bool(re.search(r'https?://', body))
        }