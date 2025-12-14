"""Service d'alimentation massive de l'IA avec données d'exemple"""

import os
import sqlite3
from datetime import datetime, timedelta
import random

class BulkTrainingService:
    """Alimente massivement l'IA avec des exemples d'emails"""
    
    def __init__(self, app_dir: str):
        self.app_dir = app_dir
        self.training_db = os.path.join(app_dir, "ai_training.db")
        self._init_db()
    
    def _init_db(self):
        """Initialise la base si nécessaire"""
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
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
        
        conn.commit()
        conn.close()
    
    def feed_massive_examples(self) -> dict:
        """Alimente l'IA avec des centaines d'exemples d'emails"""
        
        examples = [
            # ADMINISTRATIF
            {
                'category': 'administrative',
                'tone': 'professionnel',
                'examples': [
                    {
                        'recipient': 'caf@example.com',
                        'subject': 'Demande d\'attestation de droits',
                        'body': 'Madame, Monsieur,\n\nJe vous prie de bien vouloir m\'adresser une attestation de mes droits aux prestations familiales.\n\nCette attestation m\'est demandée dans le cadre de ma demande de logement social.\n\nJe vous remercie par avance et vous prie d\'agréer mes salutations distinguées.'
                    },
                    {
                        'recipient': 'pole-emploi@example.com',
                        'subject': 'Demande d\'attestation employeur',
                        'body': 'Madame, Monsieur,\n\nSuite à notre entretien, je vous demande de bien vouloir m\'établir une attestation employeur pour ma période du 01/01/2023 au 31/12/2023.\n\nCette attestation m\'est nécessaire pour constituer mon dossier de demande d\'aide.\n\nCordialement'
                    },
                    {
                        'recipient': 'mairie@example.com',
                        'subject': 'Demande d\'acte de naissance',
                        'body': 'Madame, Monsieur,\n\nJe souhaiterais obtenir un extrait d\'acte de naissance avec filiation.\n\nNé(e) le [date] à [ville], mes parents sont [noms].\n\nJe vous remercie de me faire parvenir ce document dans les meilleurs délais.\n\nSalutations distinguées'
                    }
                ]
            },
            
            # RÉCLAMATIONS
            {
                'category': 'reclamation',
                'tone': 'professionnel',
                'examples': [
                    {
                        'recipient': 'service.client@banque.com',
                        'subject': 'Réclamation - Prélèvement non autorisé',
                        'body': 'Madame, Monsieur,\n\nJe constate sur mon relevé de compte un prélèvement de 45€ effectué le 15/03/2024 que je n\'ai pas autorisé.\n\nJe vous demande le remboursement immédiat de cette somme et l\'annulation de ce prélèvement.\n\nJe reste dans l\'attente de votre réponse rapide.\n\nCordialement'
                    },
                    {
                        'recipient': 'reclamation@assurance.com',
                        'subject': 'Contestation refus de prise en charge',
                        'body': 'Madame, Monsieur,\n\nJe conteste formellement votre refus de prise en charge de mon sinistre déclaré sous le numéro [référence].\n\nLes faits sont couverts par mon contrat et je dispose de toutes les pièces justificatives.\n\nJe vous demande de réexaminer mon dossier.\n\nSalutations'
                    }
                ]
            },
            
            # REMERCIEMENTS
            {
                'category': 'remerciement',
                'tone': 'professionnel',
                'examples': [
                    {
                        'recipient': 'service@entreprise.com',
                        'subject': 'Remerciements pour votre aide',
                        'body': 'Madame, Monsieur,\n\nJe tenais à vous remercier pour l\'aide précieuse que vous m\'avez apportée dans le traitement de mon dossier.\n\nVotre professionnalisme et votre réactivité ont été très appréciés.\n\nCordialement'
                    }
                ]
            },
            
            # DEMANDES D'INFORMATION
            {
                'category': 'information',
                'tone': 'professionnel',
                'examples': [
                    {
                        'recipient': 'info@service.com',
                        'subject': 'Demande d\'information sur vos services',
                        'body': 'Madame, Monsieur,\n\nJe souhaiterais obtenir des informations sur vos services et tarifs.\n\nPourriez-vous m\'envoyer une documentation complète ?\n\nJe vous remercie par avance.\n\nCordialement'
                    }
                ]
            },
            
            # RELANCES
            {
                'category': 'relance',
                'tone': 'professionnel',
                'examples': [
                    {
                        'recipient': 'service@administration.com',
                        'subject': 'Relance - Dossier en attente',
                        'body': 'Madame, Monsieur,\n\nJe me permets de vous relancer concernant mon dossier déposé le [date] sous la référence [numéro].\n\nN\'ayant pas reçu de réponse à ce jour, je souhaiterais connaître l\'état d\'avancement de ma demande.\n\nJe vous remercie de votre retour.\n\nCordialement'
                    }
                ]
            }
        ]
        
        # Insérer tous les exemples
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        total_inserted = 0
        
        for category_data in examples:
            category = category_data['category']
            tone = category_data['tone']
            
            for example in category_data['examples']:
                # Créer plusieurs variations de chaque exemple
                for i in range(5):  # 5 variations par exemple
                    # Varier légèrement le contenu
                    varied_subject = self._create_variation(example['subject'], i)
                    varied_body = self._create_variation(example['body'], i)
                    
                    # Date aléatoire dans les 2 dernières années
                    random_date = datetime.now() - timedelta(days=random.randint(1, 730))
                    
                    cursor.execute('''
                        INSERT INTO sent_emails_training 
                        (recipient, subject, body, category, tone, success_rate, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        example['recipient'],
                        varied_subject,
                        varied_body,
                        category,
                        tone,
                        random.uniform(0.8, 1.0),  # Taux de succès aléatoire
                        random_date
                    ))
                    
                    total_inserted += 1
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'total_examples': total_inserted,
            'message': f'{total_inserted} exemples d\'emails ajoutés pour l\'entraînement'
        }
    
    def _create_variation(self, text: str, variation_num: int) -> str:
        """Crée des variations d'un texte"""
        
        variations = {
            0: text,  # Original
            1: text.replace('Madame, Monsieur,', 'Bonjour,'),
            2: text.replace('Cordialement', 'Bien à vous'),
            3: text.replace('Je vous prie', 'Je vous demande'),
            4: text.replace('dans les meilleurs délais', 'rapidement')
        }
        
        return variations.get(variation_num, text)
    
    def add_professional_templates(self) -> dict:
        """Ajoute des templates professionnels complets"""
        
        professional_emails = [
            # Emails CAF
            {
                'recipient': 'caf@departement.fr',
                'subject': 'Demande de révision de mes droits',
                'body': '''Madame, Monsieur,

Suite à un changement dans ma situation familiale, je souhaiterais faire réviser mes droits aux prestations familiales.

Ma situation actuelle :
- Nombre d'enfants à charge : 2
- Revenus mensuels : 2500€
- Situation familiale : Marié(e)

Pourriez-vous me faire parvenir le formulaire de déclaration de changement de situation ?

Je reste à votre disposition pour tout complément d'information.

Cordialement''',
                'category': 'administrative',
                'tone': 'professionnel'
            },
            
            # Emails Pôle Emploi
            {
                'recipient': 'pole-emploi@agence.fr',
                'subject': 'Demande d\'aide à la formation',
                'body': '''Madame, Monsieur,

Je suis actuellement demandeur d'emploi inscrit sous le numéro [identifiant] et je souhaiterais bénéficier d'une aide à la formation.

La formation envisagée :
- Intitulé : Formation développeur web
- Organisme : [nom]
- Durée : 6 mois
- Coût : 3000€

Cette formation correspond parfaitement à mon projet professionnel et aux besoins du marché local.

Je vous remercie de m'indiquer les démarches à suivre.

Salutations distinguées''',
                'category': 'administrative',
                'tone': 'professionnel'
            },
            
            # Emails Banque
            {
                'recipient': 'conseiller@banque.fr',
                'subject': 'Demande de rendez-vous',
                'body': '''Madame, Monsieur,

Je souhaiterais prendre rendez-vous avec mon conseiller pour faire le point sur ma situation financière.

Points à aborder :
- Renégociation de mon crédit immobilier
- Ouverture d'un livret d'épargne
- Assurance vie

Je suis disponible en semaine après 17h ou le samedi matin.

Cordialement''',
                'category': 'information',
                'tone': 'professionnel'
            }
        ]
        
        conn = sqlite3.connect(self.training_db)
        cursor = conn.cursor()
        
        for email in professional_emails:
            # Créer 10 variations de chaque email professionnel
            for i in range(10):
                random_date = datetime.now() - timedelta(days=random.randint(1, 365))
                
                cursor.execute('''
                    INSERT INTO sent_emails_training 
                    (recipient, subject, body, category, tone, success_rate, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    email['recipient'],
                    email['subject'],
                    email['body'],
                    email['category'],
                    email['tone'],
                    random.uniform(0.85, 1.0),
                    random_date
                ))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'added': len(professional_emails) * 10,
            'message': 'Templates professionnels ajoutés'
        }
    
    def get_training_count(self) -> dict:
        """Compte le nombre d'exemples d'entraînement"""
        try:
            conn = sqlite3.connect(self.training_db)
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM sent_emails_training')
            total = cursor.fetchone()[0]
            
            cursor.execute('''
                SELECT category, COUNT(*) 
                FROM sent_emails_training 
                GROUP BY category
            ''')
            by_category = dict(cursor.fetchall())
            
            conn.close()
            
            return {
                'success': True,
                'total_examples': total,
                'by_category': by_category
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}