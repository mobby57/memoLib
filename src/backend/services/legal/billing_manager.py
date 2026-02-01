"""
BillingManager - Gestion de la facturation et suivi du temps
Enregistrement temps, génération factures, statistiques
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class BillingManager:
    """Gestionnaire de facturation et suivi du temps"""
    
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.time_entries_file = os.path.join(data_dir, 'time_entries.json')
        self.invoices_file = os.path.join(data_dir, 'invoices.json')
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Créer le répertoire data s'il n'existe pas"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        if not os.path.exists(self.time_entries_file):
            with open(self.time_entries_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        if not os.path.exists(self.invoices_file):
            with open(self.invoices_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
    
    def _load_time_entries(self) -> List[Dict]:
        """Charger les saisies de temps"""
        try:
            with open(self.time_entries_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_time_entries(self, entries: List[Dict]):
        """Sauvegarder les saisies de temps"""
        with open(self.time_entries_file, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
    
    def _load_invoices(self) -> List[Dict]:
        """Charger les factures"""
        try:
            with open(self.invoices_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_invoices(self, invoices: List[Dict]):
        """Sauvegarder les factures"""
        with open(self.invoices_file, 'w', encoding='utf-8') as f:
            json.dump(invoices, f, indent=2, ensure_ascii=False)
    
    def enregistrer_temps(self, case_id: str, description: str, hours: float, 
                          hourly_rate: float, date: Optional[str] = None) -> Dict:
        """
        Enregistrer une saisie de temps
        
        Args:
            case_id: ID du dossier
            description: Description de la prestation
            hours: Nombre d'heures
            hourly_rate: Taux horaire en €
            date: Date (défaut: aujourd'hui)
        
        Returns:
            La saisie créée
        """
        entries = self._load_time_entries()
        
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        entry = {
            'id': len(entries) + 1,
            'case_id': case_id,
            'date': date,
            'description': description,
            'hours': hours,
            'hourly_rate': hourly_rate,
            'amount': round(hours * hourly_rate, 2),
            'billed': False,
            'created_at': datetime.now().isoformat()
        }
        
        entries.append(entry)
        self._save_time_entries(entries)
        
        return entry
    
    def lister_temps(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Lister les saisies de temps
        
        Args:
            filters: Dict avec case_id, billed, date_debut, date_fin
        
        Returns:
            Liste des saisies filtrées
        """
        entries = self._load_time_entries()
        
        if not filters:
            return entries
        
        result = entries
        
        if 'case_id' in filters:
            result = [e for e in result if e['case_id'] == filters['case_id']]
        
        if 'billed' in filters:
            result = [e for e in result if e['billed'] == filters['billed']]
        
        if 'date_debut' in filters:
            result = [e for e in result if e['date'] >= filters['date_debut']]
        
        if 'date_fin' in filters:
            result = [e for e in result if e['date'] <= filters['date_fin']]
        
        return result
    
    def modifier_temps(self, entry_id: int, data: Dict) -> Optional[Dict]:
        """Modifier une saisie de temps"""
        entries = self._load_time_entries()
        
        for i, entry in enumerate(entries):
            if entry['id'] == entry_id:
                entry.update(data)
                
                # Recalculer le montant si heures ou taux modifiés
                if 'hours' in data or 'hourly_rate' in data:
                    entry['amount'] = round(entry['hours'] * entry['hourly_rate'], 2)
                
                entry['updated_at'] = datetime.now().isoformat()
                entries[i] = entry
                self._save_time_entries(entries)
                
                return entry
        
        return None
    
    def supprimer_temps(self, entry_id: int) -> bool:
        """Supprimer une saisie de temps"""
        entries = self._load_time_entries()
        initial_len = len(entries)
        entries = [e for e in entries if e['id'] != entry_id]
        
        if len(entries) < initial_len:
            self._save_time_entries(entries)
            return True
        
        return False
    
    def generer_facture(self, data: Dict) -> Dict:
        """
        Générer une facture à partir de saisies de temps
        
        Args:
            data: Dict contenant case_id, client_name, client_address, 
                  time_entry_ids (liste des IDs de saisies à facturer)
        
        Returns:
            La facture générée
        """
        invoices = self._load_invoices()
        entries = self._load_time_entries()
        
        # Récupérer les saisies à facturer
        time_entry_ids = data.get('time_entry_ids', [])
        selected_entries = [e for e in entries if e['id'] in time_entry_ids]
        
        if not selected_entries:
            raise ValueError("Aucune saisie de temps sélectionnée")
        
        # Calculer le total
        subtotal = sum(e['amount'] for e in selected_entries)
        tva_rate = data.get('tva_rate', 20.0)  # 20% par défaut
        tva_amount = round(subtotal * tva_rate / 100, 2)
        total = round(subtotal + tva_amount, 2)
        
        # Générer numéro de facture
        year = datetime.now().year
        invoice_number = f"FAC-{year}-{len(invoices) + 1:04d}"
        
        # Créer la facture
        invoice = {
            'id': len(invoices) + 1,
            'invoice_number': invoice_number,
            'case_id': data['case_id'],
            'client_name': data['client_name'],
            'client_address': data.get('client_address', ''),
            'date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': data.get('due_date', ''),
            'items': selected_entries,
            'subtotal': subtotal,
            'tva_rate': tva_rate,
            'tva_amount': tva_amount,
            'total': total,
            'status': 'envoyée',
            'paid': False,
            'created_at': datetime.now().isoformat()
        }
        
        invoices.append(invoice)
        self._save_invoices(invoices)
        
        # Marquer les saisies comme facturées
        for entry in entries:
            if entry['id'] in time_entry_ids:
                entry['billed'] = True
                entry['invoice_id'] = invoice['id']
        
        self._save_time_entries(entries)
        
        return invoice
    
    def lister_factures(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Lister les factures
        
        Args:
            filters: Dict avec case_id, status, paid
        
        Returns:
            Liste des factures filtrées
        """
        invoices = self._load_invoices()
        
        if not filters:
            return invoices
        
        result = invoices
        
        if 'case_id' in filters:
            result = [inv for inv in result if inv['case_id'] == filters['case_id']]
        
        if 'status' in filters:
            result = [inv for inv in result if inv['status'] == filters['status']]
        
        if 'paid' in filters:
            result = [inv for inv in result if inv['paid'] == filters['paid']]
        
        return result
    
    def get_facture(self, invoice_id: int) -> Optional[Dict]:
        """Récupérer une facture par son ID"""
        invoices = self._load_invoices()
        for invoice in invoices:
            if invoice['id'] == invoice_id:
                return invoice
        return None
    
    def marquer_payee(self, invoice_id: int, payment_date: Optional[str] = None) -> Optional[Dict]:
        """Marquer une facture comme payée"""
        invoices = self._load_invoices()
        
        for i, invoice in enumerate(invoices):
            if invoice['id'] == invoice_id:
                invoice['paid'] = True
                invoice['payment_date'] = payment_date or datetime.now().strftime('%Y-%m-%d')
                invoice['status'] = 'payée'
                invoice['updated_at'] = datetime.now().isoformat()
                
                invoices[i] = invoice
                self._save_invoices(invoices)
                
                return invoice
        
        return None
    
    def get_statistiques(self, period: Optional[Dict] = None) -> Dict:
        """
        Obtenir des statistiques de facturation
        
        Args:
            period: Dict avec date_debut et date_fin (optionnel)
        
        Returns:
            Dict avec statistiques détaillées
        """
        entries = self._load_time_entries()
        invoices = self._load_invoices()
        
        # Filtrer par période si spécifié
        if period:
            date_debut = period.get('date_debut')
            date_fin = period.get('date_fin')
            
            if date_debut:
                entries = [e for e in entries if e['date'] >= date_debut]
                invoices = [inv for inv in invoices if inv['date'] >= date_debut]
            
            if date_fin:
                entries = [e for e in entries if e['date'] <= date_fin]
                invoices = [inv for inv in invoices if inv['date'] <= date_fin]
        
        # Calculer statistiques
        total_hours = sum(e['hours'] for e in entries)
        total_revenue = sum(e['amount'] for e in entries)
        
        billed_entries = [e for e in entries if e['billed']]
        unbilled_entries = [e for e in entries if not e['billed']]
        
        billed_amount = sum(e['amount'] for e in billed_entries)
        unbilled_amount = sum(e['amount'] for e in unbilled_entries)
        
        paid_invoices = [inv for inv in invoices if inv['paid']]
        unpaid_invoices = [inv for inv in invoices if not inv['paid']]
        
        paid_amount = sum(inv['total'] for inv in paid_invoices)
        unpaid_amount = sum(inv['total'] for inv in unpaid_invoices)
        
        stats = {
            'heures_total': round(total_hours, 2),
            'chiffre_affaires_potentiel': round(total_revenue, 2),
            'facture': round(billed_amount, 2),
            'non_facture': round(unbilled_amount, 2),
            'paye': round(paid_amount, 2),
            'impaye': round(unpaid_amount, 2),
            'nombre_factures': len(invoices),
            'nombre_factures_payees': len(paid_invoices),
            'nombre_factures_impayees': len(unpaid_invoices),
            'taux_paiement': round(len(paid_invoices) / len(invoices) * 100, 1) if invoices else 0
        }
        
        return stats
    
    def get_top_clients(self, limit: int = 10) -> List[Dict]:
        """
        Obtenir les meilleurs clients par chiffre d'affaires
        
        Args:
            limit: Nombre maximum de clients à retourner
        
        Returns:
            Liste des clients triés par CA décroissant
        """
        invoices = self._load_invoices()
        
        # Grouper par client
        clients = {}
        for invoice in invoices:
            client = invoice['client_name']
            if client not in clients:
                clients[client] = {
                    'client_name': client,
                    'total_amount': 0,
                    'total_invoices': 0,
                    'paid_amount': 0,
                    'unpaid_amount': 0
                }
            
            clients[client]['total_amount'] += invoice['total']
            clients[client]['total_invoices'] += 1
            
            if invoice['paid']:
                clients[client]['paid_amount'] += invoice['total']
            else:
                clients[client]['unpaid_amount'] += invoice['total']
        
        # Convertir en liste et trier
        clients_list = list(clients.values())
        clients_list.sort(key=lambda x: x['total_amount'], reverse=True)
        
        return clients_list[:limit]
