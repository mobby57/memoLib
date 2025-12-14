"""Service d'entraînement IA basé sur votre base de données"""

import os
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional
import re
from collections import Counter

class AITrainingService:
    """Entraîne l'IA uniquement avec vos données locales"""
    
    def __init__(self, app_dir: str):
        self.app_dir = app_dir
        self.training_db = os.path.join(app_dir, "ai_training.db")
        self.patterns_file = os.path.join(app_dir, "learned_patterns.json")
        
        self._init_training_db()
        self._load_patterns()
    
    def _init_training_db(self):
        """Initialise la base d'entraînement"""
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        # Table des emails envoyés pour apprentissage
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sent_emails_training (
                id INTEGER PRIMARY KEY,
                recipient TEXT,
                subject TEXT,
                body TEXT,
                category TEXT,
                tone TEXT,
                success_rate REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des patterns appris
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS learned_patterns (
                id INTEGER PRIMARY KEY,
                pattern_type TEXT,
                pattern_text TEXT,
                frequency INTEGER DEFAULT 1,
                effectiveness REAL DEFAULT 1.0,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def feed_from_email_history(self):
        """Alimente l'IA avec l'historique des emails envoyés"""
        try:
            # Récupérer les emails de la base principale
            main_db = os.path.join(self.app_dir, "app.db")
            if not os.path.exists(main_db):
                return {'success': False, 'error': 'Base principale introuvable'}
            
            main_conn = sqlite3.connect(main_db)
            main_cursor = main_conn.cursor()
            
            # Récupérer tous les emails envoyés
            main_cursor.execute('''
                SELECT recipient, subject, body, created_at 
                FROM email_history 
                WHERE status = 'sent'
                ORDER BY created_at DESC
            ''')
            
            emails = main_cursor.fetchall()
            main_conn.close()
            
            if not emails:
                return {'success': True, 'message': 'Aucun email à analyser', 'processed': 0}
            
            # Analyser et stocker pour l'IA
            processed = 0
            training_conn = sqlite3.connect(self.training_db)
            training_cursor = training_conn.cursor()
            
            for email in emails:
                recipient, subject, body, created_at = email
                
                # Analyser le contenu
                analysis = self._analyze_email_content(subject, body, recipient)
                
                # Stocker pour l'entraînement
                training_cursor.execute('''
                    INSERT OR REPLACE INTO sent_emails_training 
                    (recipient, subject, body, category, tone, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (recipient, subject, body, analysis['category'], 
                     analysis['tone'], created_at))
                
                # Extraire et stocker les patterns
                self._extract_patterns(subject, body, analysis, training_cursor)
                
                processed += 1
            
            training_conn.commit()
            training_conn.close()
            
            # Mettre à jour les patterns appris
            self._update_learned_patterns()
            
            return {
                'success': True, 
                'processed': processed,
                'message': f'{processed} emails analysés pour l\'IA'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _analyze_email_content(self, subject: str, body: str, recipient: str) -> Dict:
        """Analyse le contenu d'un email pour catégorisation"""
        content = (subject + " " + body).lower()
        
        # Détection de catégorie
        categories = {
            'administrative': ['demande', 'attestation', 'dossier', 'administration', 'service', 'mairie', 'caf', 'pole emploi'],
            'reclamation': ['réclamation', 'plainte', 'problème', 'erreur', 'dysfonctionnement', 'insatisfait'],
            'remerciement': ['merci', 'remercie', 'gratitude', 'reconnaissance', 'satisfait'],
            'information': ['information', 'renseignement', 'question', 'demande de', 'pourriez-vous'],
            'relance': ['relance', 'suite', 'rappel', 'sans réponse', 'attente']
        }
        
        category_scores = {}
        for cat, keywords in categories.items():
            score = sum(1 for keyword in keywords if keyword in content)
            if score > 0:
                category_scores[cat] = score
        
        category = max(category_scores, key=category_scores.get) if category_scores else 'general'
        
        # Détection de ton
        formal_indicators = ['madame', 'monsieur', 'veuillez agréer', 'distinguées', 'honneur']
        simple_indicators = ['bonjour', 'cordialement', 'merci', 'bonne journée']
        
        formal_score = sum(1 for indicator in formal_indicators if indicator in content)
        simple_score = sum(1 for indicator in simple_indicators if indicator in content)
        
        if formal_score > simple_score:
            tone = 'professionnel'
        elif simple_score > 0:
            tone = 'simple'
        else:
            tone = 'neutre'
        
        return {'category': category, 'tone': tone}
    
    def _extract_patterns(self, subject: str, body: str, analysis: Dict, cursor):
        """Extrait les patterns utiles pour l'IA"""
        # Patterns de sujet
        subject_patterns = [
            r'Demande (?:de |d\'|concernant )(.*)',
            r'Réclamation - (.*)',
            r'Information sur (.*)',
            r'Suite à (.*)'
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                cursor.execute('''
                    INSERT OR IGNORE INTO learned_patterns 
                    (pattern_type, pattern_text, frequency)
                    VALUES (?, ?, 1)
                ''', ('subject_template', pattern))
        
        # Patterns d'ouverture
        opening_patterns = [
            r'^(Madame, Monsieur,?\s*\n\n.*?\.)',
            r'^(Bonjour,?\s*\n\n.*?\.)',
            r'^(J\'ai l\'honneur.*?\.)'
        ]
        
        for pattern in opening_patterns:
            match = re.search(pattern, body, re.IGNORECASE | re.DOTALL)
            if match:
                cursor.execute('''
                    INSERT OR IGNORE INTO learned_patterns 
                    (pattern_type, pattern_text, frequency)
                    VALUES (?, ?, 1)
                ''', ('opening_template', match.group(1)))
        
        # Patterns de fermeture
        closing_patterns = [
            r'(En vous remerciant.*?salutations.*?\.)$',
            r'(Cordialement\.?)$',
            r'(Bien à vous\.?)$'
        ]
        
        for pattern in closing_patterns:
            match = re.search(pattern, body, re.IGNORECASE | re.DOTALL)
            if match:
                cursor.execute('''
                    INSERT OR IGNORE INTO learned_patterns 
                    (pattern_type, pattern_text, frequency)
                    VALUES (?, ?, 1)
                ''', ('closing_template', match.group(1)))
    
    def _update_learned_patterns(self):
        """Met à jour les patterns appris dans le fichier JSON"""
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        # Récupérer tous les patterns
        cursor.execute('''
            SELECT pattern_type, pattern_text, frequency, effectiveness
            FROM learned_patterns
            ORDER BY frequency DESC, effectiveness DESC
        ''')
        
        patterns = cursor.fetchall()
        conn.close()
        
        # Organiser par type
        organized_patterns = {}
        for pattern_type, pattern_text, frequency, effectiveness in patterns:
            if pattern_type not in organized_patterns:
                organized_patterns[pattern_type] = []
            
            organized_patterns[pattern_type].append({
                'text': pattern_text,
                'frequency': frequency,
                'effectiveness': effectiveness
            })
        
        # Sauvegarder
        with open(self.patterns_file, 'w', encoding='utf-8') as f:
            json.dump(organized_patterns, f, indent=2, ensure_ascii=False)
        
        self.patterns = organized_patterns
    
    def _load_patterns(self):
        """Charge les patterns appris"""
        if os.path.exists(self.patterns_file):
            with open(self.patterns_file, 'r', encoding='utf-8') as f:
                self.patterns = json.load(f)
        else:
            self.patterns = {}
    
    def generate_with_learned_patterns(self, context: str, tone: str = "professionnel") -> Dict:
        """Génère un email basé sur les patterns appris de VOS emails"""
        try:
            # Analyser le contexte
            analysis = self._analyze_context_for_generation(context)
            category = analysis['category']
            
            # Récupérer les meilleurs patterns pour cette catégorie
            subject_template = self._get_best_pattern('subject_template', category)
            opening_template = self._get_best_pattern('opening_template', tone)
            closing_template = self._get_best_pattern('closing_template', tone)
            
            # Récupérer des exemples similaires de votre historique
            similar_emails = self._find_similar_emails(context, category, tone)
            
            # Générer le contenu
            subject = self._generate_subject_from_patterns(context, subject_template)
            opening = self._generate_opening_from_patterns(context, opening_template)
            body_content = self._generate_body_from_similar(context, similar_emails)
            closing = closing_template if closing_template else "Cordialement"
            
            full_body = f"{opening}\n\n{body_content}\n\n{closing}"
            
            return {
                'success': True,
                'subject': subject,
                'body': full_body,
                'source': 'your_email_history',
                'similar_emails_used': len(similar_emails),
                'privacy': 'Basé uniquement sur VOS emails précédents'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _analyze_context_for_generation(self, context: str) -> Dict:
        """Analyse le contexte pour la génération"""
        context_lower = context.lower()
        
        # Utiliser les patterns appris pour la catégorisation
        category_scores = {}
        
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        # Récupérer les catégories les plus fréquentes dans votre historique
        cursor.execute('''
            SELECT category, COUNT(*) as count
            FROM sent_emails_training
            GROUP BY category
            ORDER BY count DESC
        ''')
        
        categories = cursor.fetchall()
        conn.close()
        
        # Analyser le contexte par rapport à vos catégories
        for category, count in categories:
            # Récupérer des mots-clés de cette catégorie depuis vos emails
            keywords = self._get_category_keywords(category)
            score = sum(1 for keyword in keywords if keyword in context_lower)
            if score > 0:
                category_scores[category] = score * count  # Pondérer par fréquence
        
        best_category = max(category_scores, key=category_scores.get) if category_scores else 'general'
        
        return {'category': best_category}
    
    def _get_category_keywords(self, category: str) -> List[str]:
        """Récupère les mots-clés d'une catégorie depuis vos emails"""
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT subject, body FROM sent_emails_training 
            WHERE category = ? LIMIT 10
        ''', (category,))
        
        emails = cursor.fetchall()
        conn.close()
        
        # Extraire les mots-clés les plus fréquents
        all_text = ' '.join([subject + ' ' + body for subject, body in emails]).lower()
        words = re.findall(r'\b\w+\b', all_text)
        
        # Filtrer les mots courants
        stop_words = {'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 'je', 'vous', 'nous'}
        filtered_words = [word for word in words if len(word) > 3 and word not in stop_words]
        
        # Retourner les plus fréquents
        word_counts = Counter(filtered_words)
        return [word for word, count in word_counts.most_common(10)]
    
    def _get_best_pattern(self, pattern_type: str, context: str) -> str:
        """Récupère le meilleur pattern pour un type donné"""
        if pattern_type in self.patterns and self.patterns[pattern_type]:
            # Retourner le pattern le plus efficace
            best_pattern = max(self.patterns[pattern_type], 
                             key=lambda x: x['effectiveness'] * x['frequency'])
            return best_pattern['text']
        return ""
    
    def _find_similar_emails(self, context: str, category: str, tone: str) -> List[Dict]:
        """Trouve des emails similaires dans votre historique"""
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT subject, body, success_rate
            FROM sent_emails_training
            WHERE category = ? AND tone = ?
            ORDER BY success_rate DESC
            LIMIT 3
        ''', (category, tone))
        
        emails = cursor.fetchall()
        conn.close()
        
        return [{'subject': s, 'body': b, 'success_rate': sr} for s, b, sr in emails]
    
    def _generate_subject_from_patterns(self, context: str, template: str) -> str:
        """Génère un sujet basé sur les patterns"""
        if template:
            # Remplacer les variables dans le template
            return template.replace('(.*)', context[:50])
        else:
            return f"Demande concernant {context[:50]}"
    
    def _generate_opening_from_patterns(self, context: str, template: str) -> str:
        """Génère une ouverture basée sur les patterns"""
        if template:
            return template
        else:
            return "Madame, Monsieur,\n\nJ'espère que vous allez bien."
    
    def _generate_body_from_similar(self, context: str, similar_emails: List[Dict]) -> str:
        """Génère le corps basé sur des emails similaires"""
        if similar_emails:
            # Utiliser l'email avec le meilleur taux de succès comme base
            best_email = similar_emails[0]
            body = best_email['body']
            
            # Adapter le contenu au nouveau contexte
            # Remplacer les parties spécifiques par le nouveau contexte
            adapted_body = self._adapt_body_content(body, context)
            return adapted_body
        else:
            return f"Je me permets de vous contacter concernant {context}.\n\nJe vous serais reconnaissant de bien vouloir m'apporter votre aide sur cette question."
    
    def _adapt_body_content(self, original_body: str, new_context: str) -> str:
        """Adapte le contenu d'un email existant au nouveau contexte"""
        # Logique simple d'adaptation
        # Remplacer les références spécifiques par le nouveau contexte
        adapted = original_body
        
        # Remplacer les phrases trop spécifiques par des génériques
        generic_replacements = {
            r'concernant.*?\.': f'concernant {new_context}.',
            r'au sujet de.*?\.': f'au sujet de {new_context}.',
            r'relative à.*?\.': f'relative à {new_context}.'
        }
        
        for pattern, replacement in generic_replacements.items():
            adapted = re.sub(pattern, replacement, adapted, flags=re.IGNORECASE)
        
        return adapted
    
    def get_training_statistics(self) -> Dict:
        """Statistiques de l'entraînement IA"""
        try:
            conn = sqlite3.connect(self.training_db)
            cursor = conn.cursor()
            
            # Nombre d'emails analysés
            cursor.execute('SELECT COUNT(*) FROM sent_emails_training')
            total_emails = cursor.fetchone()[0]
            
            # Répartition par catégorie
            cursor.execute('''
                SELECT category, COUNT(*) 
                FROM sent_emails_training 
                GROUP BY category
            ''')
            categories = dict(cursor.fetchall())
            
            # Nombre de patterns appris
            cursor.execute('SELECT COUNT(*) FROM learned_patterns')
            total_patterns = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'success': True,
                'total_emails_analyzed': total_emails,
                'categories_learned': categories,
                'patterns_extracted': total_patterns,
                'ai_quality': 'Basée sur VOS emails uniquement',
                'privacy': 'Données 100% locales'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}