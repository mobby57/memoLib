"""Intégration Stripe pour paiements réels"""
import stripe
import json
import os
from datetime import datetime
from crypto_utils import _valider_chemin_securise

class StripePayment:
    def __init__(self, app_dir, api_key=None):
        self.app_dir = app_dir
        if api_key:
            stripe.api_key = api_key
        self.transactions_file = _valider_chemin_securise(app_dir, "stripe_transactions.json")
    
    def creer_session_paiement(self, email, montant=2900, devise='eur'):
        """Crée une session de paiement Stripe (29€)"""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': devise,
                        'product_data': {
                            'name': 'SecureVault - Accès Premium',
                        },
                        'unit_amount': montant,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                customer_email=email,
                success_url='http://localhost:5000/success',
                cancel_url='http://localhost:5000/cancel',
            )
            
            self._enregistrer_transaction(email, session.id, montant, 'pending')
            return session.id, session.url
        except Exception as e:
            return None, str(e)
    
    def verifier_paiement(self, session_id):
        """Vérifie le statut d'un paiement"""
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            status = 'paid' if session.payment_status == 'paid' else 'pending'
            self._mettre_a_jour_transaction(session_id, status)
            return status == 'paid', session.customer_email
        except Exception as e:
            return False, None
    
    def _enregistrer_transaction(self, email, session_id, montant, status):
        """Enregistre une transaction"""
        transactions = self._load_transactions()
        transactions.append({
            'email': email,
            'session_id': session_id,
            'montant': montant,
            'status': status,
            'created_at': datetime.now().isoformat()
        })
        self._save_transactions(transactions)
    
    def _mettre_a_jour_transaction(self, session_id, status):
        """Met à jour le statut d'une transaction"""
        transactions = self._load_transactions()
        for t in transactions:
            if t['session_id'] == session_id:
                t['status'] = status
                t['updated_at'] = datetime.now().isoformat()
        self._save_transactions(transactions)
    
    def _load_transactions(self):
        if not os.path.exists(self.transactions_file):
            return []
        with open(self.transactions_file, 'r') as f:
            return json.load(f)
    
    def _save_transactions(self, transactions):
        with open(self.transactions_file, 'w') as f:
            json.dump(transactions, f, indent=2)
