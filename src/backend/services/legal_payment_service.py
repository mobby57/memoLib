import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
from ..services.ai_service import AIService
from ..services.email_service import EmailService

class LegalPaymentService:
    def __init__(self):
        self.ai_service = AIService()
        self.email_service = EmailService()
        
    def import_excel_payments(self, file_path: str) -> List[Dict]:
        """Import des données de paiement depuis Excel"""
        try:
            df = pd.read_excel(file_path)
            
            # Colonnes attendues
            required_columns = ['nom_client', 'email', 'montant', 'date_facture', 'delai_jours', 'type_affaire', 'statut']
            
            # Validation des colonnes
            missing_cols = [col for col in required_columns if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Colonnes manquantes: {missing_cols}")
            
            # Traitement des données
            clients_data = []
            for _, row in df.iterrows():
                client_data = {
                    'nom_client': row['nom_client'],
                    'email': row['email'],
                    'montant': float(row['montant']),
                    'date_facture': pd.to_datetime(row['date_facture']),
                    'delai_jours': int(row['delai_jours']),
                    'type_affaire': row['type_affaire'],
                    'statut': row['statut'],  # 'debiteur' ou 'crediteur'
                    'jours_retard': self._calculate_delay_days(row['date_facture'], row['delai_jours']),
                    'urgence': self._determine_urgency(row['date_facture'], row['delai_jours'])
                }
                clients_data.append(client_data)
            
            return clients_data
            
        except Exception as e:
            raise Exception(f"Erreur import Excel: {str(e)}")
    
    def _calculate_delay_days(self, date_facture, delai_jours: int) -> int:
        """Calcule le nombre de jours de retard"""
        date_facture = pd.to_datetime(date_facture)
        date_echeance = date_facture + timedelta(days=delai_jours)
        today = datetime.now()
        
        if today > date_echeance:
            return (today - date_echeance).days
        return 0
    
    def _determine_urgency(self, date_facture, delai_jours: int) -> str:
        """Détermine le niveau d'urgence"""
        jours_retard = self._calculate_delay_days(date_facture, delai_jours)
        
        if jours_retard == 0:
            return "normal"
        elif jours_retard <= 15:
            return "rappel"
        elif jours_retard <= 30:
            return "urgent"
        else:
            return "mise_en_demeure"
    
    def generate_legal_email(self, client_data: Dict) -> Dict:
        """Génère un email adapté selon le profil client et délai"""
        
        # Template selon l'urgence et le statut
        templates = {
            'debiteur': {
                'normal': "Rappel aimable de paiement pour {type_affaire}",
                'rappel': "Relance de paiement - Échéance dépassée",
                'urgent': "Mise en demeure de paiement - Urgent",
                'mise_en_demeure': "MISE EN DEMEURE FORMELLE - Dernière relance"
            },
            'crediteur': {
                'normal': "Remboursement prévu pour {type_affaire}",
                'rappel': "Retard de remboursement - Information",
                'urgent': "Demande de remboursement urgent",
                'mise_en_demeure': "Exigence de remboursement immédiat"
            }
        }
        
        # Prompt IA adapté
        prompt = f"""
        Génère un email professionnel d'avocat pour:
        - Client: {client_data['nom_client']}
        - Statut: {client_data['statut']} 
        - Montant: {client_data['montant']}€
        - Type d'affaire: {client_data['type_affaire']}
        - Jours de retard: {client_data['jours_retard']}
        - Urgence: {client_data['urgence']}
        
        Ton: {"ferme et légal" if client_data['urgence'] in ['urgent', 'mise_en_demeure'] else "professionnel et courtois"}
        
        Inclure:
        - Références légales appropriées
        - Délais de réponse
        - Conséquences en cas de non-paiement
        - Coordonnées du cabinet
        """
        
        # Génération IA
        ai_content = self.ai_service.generate_content(prompt)
        
        subject = templates[client_data['statut']][client_data['urgence']].format(
            type_affaire=client_data['type_affaire']
        )
        
        return {
            'to': client_data['email'],
            'subject': subject,
            'body': ai_content,
            'client_name': client_data['nom_client'],
            'urgency': client_data['urgence'],
            'amount': client_data['montant']
        }
    
    def process_batch_emails(self, excel_file: str) -> Dict:
        """Traite un lot d'emails depuis Excel"""
        try:
            # Import des données
            clients_data = self.import_excel_payments(excel_file)
            
            results = {
                'total': len(clients_data),
                'generated': 0,
                'sent': 0,
                'errors': [],
                'emails': []
            }
            
            for client in clients_data:
                try:
                    # Génération email
                    email_data = self.generate_legal_email(client)
                    results['emails'].append(email_data)
                    results['generated'] += 1
                    
                    # Envoi optionnel
                    # self.email_service.send_email(email_data)
                    # results['sent'] += 1
                    
                except Exception as e:
                    results['errors'].append({
                        'client': client['nom_client'],
                        'error': str(e)
                    })
            
            return results
            
        except Exception as e:
            raise Exception(f"Erreur traitement batch: {str(e)}")
    
    def create_excel_template(self, output_path: str):
        """Crée un template Excel pour l'import"""
        template_data = {
            'nom_client': ['Dupont Jean', 'Martin Sophie', 'Durand Pierre'],
            'email': ['jean.dupont@email.com', 'sophie.martin@email.com', 'pierre.durand@email.com'],
            'montant': [1500.00, -800.00, 2300.00],
            'date_facture': ['2024-01-15', '2024-02-01', '2024-01-30'],
            'delai_jours': [30, 15, 45],
            'type_affaire': ['Divorce contentieux', 'Remboursement honoraires', 'Succession'],
            'statut': ['debiteur', 'crediteur', 'debiteur']
        }
        
        df = pd.DataFrame(template_data)
        df.to_excel(output_path, index=False)
        
        return f"Template créé: {output_path}"