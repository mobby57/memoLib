"""
ComplianceManager - Gestion de la conformité juridique
Numérotation chronologique, registres, conflits d'intérêts
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class ComplianceManager:
    """Gestionnaire de conformité et registres juridiques"""
    
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.chrono_file = os.path.join(data_dir, 'chrono_register.json')
        self.conflicts_file = os.path.join(data_dir, 'conflicts_log.json')
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Créer le répertoire data s'il n'existe pas"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        if not os.path.exists(self.chrono_file):
            with open(self.chrono_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        if not os.path.exists(self.conflicts_file):
            with open(self.conflicts_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
    
    def _load_chrono(self) -> List[Dict]:
        """Charger le registre chronologique"""
        try:
            with open(self.chrono_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_chrono(self, entries: List[Dict]):
        """Sauvegarder le registre chronologique"""
        with open(self.chrono_file, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
    
    def _load_conflicts(self) -> List[Dict]:
        """Charger le journal des conflits"""
        try:
            with open(self.conflicts_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_conflicts(self, conflicts: List[Dict]):
        """Sauvegarder le journal des conflits"""
        with open(self.conflicts_file, 'w', encoding='utf-8') as f:
            json.dump(conflicts, f, indent=2, ensure_ascii=False)
    
    def generer_numero_chrono(self, year: Optional[str] = None) -> str:
        """
        Générer un numéro chronologique unique
        
        Args:
            year: Année (défaut: année courante)
        
        Returns:
            Numéro chronologique format YYYY-NNNN
        """
        if year is None:
            year = str(datetime.now().year)
        
        entries = self._load_chrono()
        
        # Compter les entrées de cette année
        year_entries = [e for e in entries if e['numero'].startswith(year)]
        next_number = len(year_entries) + 1
        
        return f"{year}-{next_number:04d}"
    
    def enregistrer_chrono(self, data: Dict) -> Dict:
        """
        Enregistrer une entrée au registre chronologique
        
        Args:
            data: Dict contenant type_document, objet, parties, notes
        
        Returns:
            L'entrée enregistrée
        """
        entries = self._load_chrono()
        
        numero = self.generer_numero_chrono()
        
        entry = {
            'id': len(entries) + 1,
            'numero': numero,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'type_document': data.get('type_document', ''),
            'objet': data.get('objet', ''),
            'parties': data.get('parties', ''),
            'expediteur': data.get('expediteur', ''),
            'destinataire': data.get('destinataire', ''),
            'notes': data.get('notes', ''),
            'created_at': datetime.now().isoformat()
        }
        
        entries.append(entry)
        self._save_chrono(entries)
        
        return entry
    
    def lister_chrono(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Lister les entrées du registre chronologique
        
        Args:
            filters: Dict avec type_document, date_debut, date_fin, search
        
        Returns:
            Liste des entrées filtrées
        """
        entries = self._load_chrono()
        
        if not filters:
            return entries
        
        result = entries
        
        if 'type_document' in filters:
            result = [e for e in result if e['type_document'] == filters['type_document']]
        
        if 'date_debut' in filters:
            result = [e for e in result if e['date'][:10] >= filters['date_debut']]
        
        if 'date_fin' in filters:
            result = [e for e in result if e['date'][:10] <= filters['date_fin']]
        
        if 'search' in filters:
            search = filters['search'].lower()
            result = [e for e in result if 
                     search in e['objet'].lower() or 
                     search in e['parties'].lower() or
                     search in e.get('notes', '').lower()]
        
        return result
    
    def verifier_conflit(self, client_name: str, adverse_party: Optional[str] = None) -> Dict:
        """
        Vérifier les conflits d'intérêts potentiels
        
        Args:
            client_name: Nom du client potentiel
            adverse_party: Partie adverse (optionnel)
        
        Returns:
            Dict avec has_conflict, conflicts (liste), message
        """
        chrono_entries = self._load_chrono()
        conflicts_log = self._load_conflicts()
        
        has_conflict = False
        found_conflicts = []
        
        # Rechercher dans le registre chronologique
        for entry in chrono_entries:
            parties = entry.get('parties', '').lower()
            expediteur = entry.get('expediteur', '').lower()
            destinataire = entry.get('destinataire', '').lower()
            
            client_lower = client_name.lower()
            
            # Vérifier si le client est mentionné
            if client_lower in parties or client_lower in expediteur or client_lower in destinataire:
                found_conflicts.append({
                    'type': 'client_existant',
                    'numero': entry['numero'],
                    'date': entry['date'],
                    'objet': entry['objet'],
                    'parties': entry['parties']
                })
                has_conflict = True
            
            # Vérifier la partie adverse si fournie
            if adverse_party:
                adverse_lower = adverse_party.lower()
                if adverse_lower in parties or adverse_lower in expediteur or adverse_lower in destinataire:
                    found_conflicts.append({
                        'type': 'partie_adverse_connue',
                        'numero': entry['numero'],
                        'date': entry['date'],
                        'objet': entry['objet'],
                        'parties': entry['parties']
                    })
                    has_conflict = True
        
        # Enregistrer la vérification
        conflict_check = {
            'id': len(conflicts_log) + 1,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'client_name': client_name,
            'adverse_party': adverse_party or 'N/A',
            'has_conflict': has_conflict,
            'conflicts_found': len(found_conflicts),
            'created_at': datetime.now().isoformat()
        }
        
        conflicts_log.append(conflict_check)
        self._save_conflicts(conflicts_log)
        
        message = "Aucun conflit détecté"
        if has_conflict:
            message = f"{len(found_conflicts)} conflit(s) potentiel(s) détecté(s)"
        
        return {
            'has_conflict': has_conflict,
            'conflicts': found_conflicts,
            'message': message,
            'check_id': conflict_check['id']
        }
    
    def get_statistiques_chrono(self) -> Dict:
        """Obtenir des statistiques sur le registre chronologique"""
        entries = self._load_chrono()
        
        stats = {
            'total_entries': len(entries),
            'current_year': 0,
            'par_type': {},
            'par_mois': {}
        }
        
        current_year = str(datetime.now().year)
        
        for entry in entries:
            # Entrées de l'année courante
            if entry['numero'].startswith(current_year):
                stats['current_year'] += 1
            
            # Par type
            type_doc = entry.get('type_document', 'Autre')
            stats['par_type'][type_doc] = stats['par_type'].get(type_doc, 0) + 1
            
            # Par mois (année courante uniquement)
            date_str = entry['date'][:7]  # YYYY-MM
            if date_str.startswith(current_year):
                stats['par_mois'][date_str] = stats['par_mois'].get(date_str, 0) + 1
        
        return stats
    
    def get_statistiques_conflits(self) -> Dict:
        """Obtenir des statistiques sur les vérifications de conflits"""
        conflicts_log = self._load_conflicts()
        
        total = len(conflicts_log)
        conflicts_detected = sum(1 for c in conflicts_log if c['has_conflict'])
        
        stats = {
            'total_checks': total,
            'conflicts_detected': conflicts_detected,
            'no_conflicts': total - conflicts_detected,
            'conflict_rate': round(conflicts_detected / total * 100, 1) if total > 0 else 0
        }
        
        return stats
    
    def exporter_registre(self, format: str = 'json', filters: Optional[Dict] = None) -> str:
        """
        Exporter le registre chronologique
        
        Args:
            format: Format d'export (json, csv)
            filters: Filtres à appliquer
        
        Returns:
            Chemin du fichier exporté
        """
        entries = self.lister_chrono(filters)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        export_file = os.path.join(self.data_dir, f'export_chrono_{timestamp}.{format}')
        
        if format == 'json':
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(entries, f, indent=2, ensure_ascii=False)
        
        elif format == 'csv':
            import csv
            with open(export_file, 'w', encoding='utf-8', newline='') as f:
                if entries:
                    fieldnames = entries[0].keys()
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(entries)
        
        return export_file
