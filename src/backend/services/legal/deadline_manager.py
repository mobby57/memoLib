"""
DeadlineManager - Gestion des délais juridiques
Calcul automatique des délais avec jours ouvrables, alertes d'urgence
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dateutil import relativedelta

class DeadlineManager:
    """Gestionnaire de délais juridiques avec calcul de jours ouvrables"""
    
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.deadlines_file = os.path.join(data_dir, 'deadlines.json')
        self.holidays_file = os.path.join(data_dir, 'holidays.json')
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Créer le répertoire data s'il n'existe pas"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        if not os.path.exists(self.deadlines_file):
            with open(self.deadlines_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
        
        if not os.path.exists(self.holidays_file):
            # Jours fériés français 2024-2025
            holidays = [
                "2024-01-01", "2024-04-01", "2024-05-01", "2024-05-08",
                "2024-05-09", "2024-05-20", "2024-07-14", "2024-08-15",
                "2024-11-01", "2024-11-11", "2024-12-25",
                "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-08",
                "2025-05-29", "2025-06-09", "2025-07-14", "2025-08-15",
                "2025-11-01", "2025-11-11", "2025-12-25"
            ]
            with open(self.holidays_file, 'w', encoding='utf-8') as f:
                json.dump(holidays, f)
    
    def _load_deadlines(self) -> List[Dict]:
        """Charger les délais depuis le fichier JSON"""
        try:
            with open(self.deadlines_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_deadlines(self, deadlines: List[Dict]):
        """Sauvegarder les délais dans le fichier JSON"""
        with open(self.deadlines_file, 'w', encoding='utf-8') as f:
            json.dump(deadlines, f, indent=2, ensure_ascii=False)
    
    def _load_holidays(self) -> List[str]:
        """Charger les jours fériés"""
        try:
            with open(self.holidays_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _is_weekend(self, date: datetime) -> bool:
        """Vérifier si une date est un weekend"""
        return date.weekday() >= 5  # 5=samedi, 6=dimanche
    
    def _is_holiday(self, date: datetime) -> bool:
        """Vérifier si une date est un jour férié"""
        holidays = self._load_holidays()
        date_str = date.strftime('%Y-%m-%d')
        return date_str in holidays
    
    def _is_business_day(self, date: datetime) -> bool:
        """Vérifier si une date est un jour ouvrable"""
        return not (self._is_weekend(date) or self._is_holiday(date))
    
    def calculer_delai(self, start_date: str, days: int, business_days: bool = True) -> Dict:
        """
        Calculer un délai
        
        Args:
            start_date: Date de début (format YYYY-MM-DD)
            days: Nombre de jours
            business_days: True pour jours ouvrables, False pour jours calendaires
        
        Returns:
            Dict avec date_echeance et jours_restants
        """
        start = datetime.strptime(start_date, '%Y-%m-%d')
        
        if not business_days:
            end = start + timedelta(days=days)
        else:
            # Calcul avec jours ouvrables
            current = start
            days_added = 0
            
            while days_added < days:
                current += timedelta(days=1)
                if self._is_business_day(current):
                    days_added += 1
            
            end = current
        
        # Calculer jours restants
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        days_remaining = (end - today).days
        
        return {
            'date_echeance': end.strftime('%Y-%m-%d'),
            'jours_restants': days_remaining,
            'urgence': self._get_urgence(days_remaining)
        }
    
    def _get_urgence(self, days_remaining: int) -> str:
        """Déterminer le niveau d'urgence"""
        if days_remaining < 0:
            return 'expiré'
        elif days_remaining <= 2:
            return 'critique'
        elif days_remaining <= 7:
            return 'urgent'
        elif days_remaining <= 15:
            return 'attention'
        else:
            return 'normal'
    
    def creer_delai(self, data: Dict) -> Dict:
        """
        Créer un nouveau délai
        
        Args:
            data: Dict contenant case_id, case_name, description, type_procedure,
                  date_debut, nb_jours, jours_ouvrables
        
        Returns:
            Le délai créé avec ID
        """
        deadlines = self._load_deadlines()
        
        # Calculer la date d'échéance
        deadline_info = self.calculer_delai(
            data['date_debut'],
            data['nb_jours'],
            data.get('jours_ouvrables', True)
        )
        
        # Créer le délai
        deadline = {
            'id': len(deadlines) + 1,
            'case_id': data['case_id'],
            'case_name': data['case_name'],
            'description': data.get('description', ''),
            'type_procedure': data.get('type_procedure', 'Civil'),
            'date_debut': data['date_debut'],
            'date_echeance': deadline_info['date_echeance'],
            'nb_jours': data['nb_jours'],
            'jours_ouvrables': data.get('jours_ouvrables', True),
            'statut': 'actif',
            'urgence': deadline_info['urgence'],
            'jours_restants': deadline_info['jours_restants'],
            'created_at': datetime.now().isoformat()
        }
        
        deadlines.append(deadline)
        self._save_deadlines(deadlines)
        
        return deadline
    
    def lister_delais(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Lister les délais avec filtres optionnels
        
        Args:
            filters: Dict avec case_id, statut, urgence
        
        Returns:
            Liste des délais filtrés
        """
        deadlines = self._load_deadlines()
        
        if not filters:
            return deadlines
        
        # Appliquer les filtres
        result = deadlines
        
        if 'case_id' in filters:
            result = [d for d in result if d['case_id'] == filters['case_id']]
        
        if 'statut' in filters:
            result = [d for d in result if d['statut'] == filters['statut']]
        
        if 'urgence' in filters:
            result = [d for d in result if d['urgence'] == filters['urgence']]
        
        return result
    
    def get_delai(self, deadline_id: int) -> Optional[Dict]:
        """Récupérer un délai par son ID"""
        deadlines = self._load_deadlines()
        for deadline in deadlines:
            if deadline['id'] == deadline_id:
                return deadline
        return None
    
    def modifier_delai(self, deadline_id: int, data: Dict) -> Optional[Dict]:
        """Modifier un délai existant"""
        deadlines = self._load_deadlines()
        
        for i, deadline in enumerate(deadlines):
            if deadline['id'] == deadline_id:
                # Mettre à jour les champs
                deadline.update(data)
                
                # Recalculer si nécessaire
                if 'date_debut' in data or 'nb_jours' in data:
                    deadline_info = self.calculer_delai(
                        deadline['date_debut'],
                        deadline['nb_jours'],
                        deadline.get('jours_ouvrables', True)
                    )
                    deadline['date_echeance'] = deadline_info['date_echeance']
                    deadline['jours_restants'] = deadline_info['jours_restants']
                    deadline['urgence'] = deadline_info['urgence']
                
                deadline['updated_at'] = datetime.now().isoformat()
                deadlines[i] = deadline
                self._save_deadlines(deadlines)
                
                return deadline
        
        return None
    
    def supprimer_delai(self, deadline_id: int) -> bool:
        """Supprimer un délai"""
        deadlines = self._load_deadlines()
        initial_len = len(deadlines)
        deadlines = [d for d in deadlines if d['id'] != deadline_id]
        
        if len(deadlines) < initial_len:
            self._save_deadlines(deadlines)
            return True
        
        return False
    
    def get_delais_urgents(self, days_threshold: int = 7) -> List[Dict]:
        """Récupérer les délais urgents (< X jours)"""
        deadlines = self._load_deadlines()
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        urgent = []
        for deadline in deadlines:
            if deadline['statut'] != 'actif':
                continue
            
            date_echeance = datetime.strptime(deadline['date_echeance'], '%Y-%m-%d')
            days_remaining = (date_echeance - today).days
            
            if days_remaining <= days_threshold:
                deadline['jours_restants'] = days_remaining
                deadline['urgence'] = self._get_urgence(days_remaining)
                urgent.append(deadline)
        
        # Trier par nombre de jours restants (ascendant)
        urgent.sort(key=lambda x: x['jours_restants'])
        
        return urgent
    
    def get_statistiques(self) -> Dict:
        """Obtenir des statistiques sur les délais"""
        deadlines = self._load_deadlines()
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        stats = {
            'total': len(deadlines),
            'actifs': 0,
            'expires': 0,
            'termines': 0,
            'par_urgence': {
                'critique': 0,
                'urgent': 0,
                'attention': 0,
                'normal': 0,
                'expiré': 0
            },
            'par_type': {}
        }
        
        for deadline in deadlines:
            if deadline['statut'] == 'actif':
                stats['actifs'] += 1
                
                date_echeance = datetime.strptime(deadline['date_echeance'], '%Y-%m-%d')
                days_remaining = (date_echeance - today).days
                urgence = self._get_urgence(days_remaining)
                
                stats['par_urgence'][urgence] += 1
            elif deadline['statut'] == 'expiré':
                stats['expires'] += 1
            elif deadline['statut'] == 'terminé':
                stats['termines'] += 1
            
            # Stats par type
            type_proc = deadline.get('type_procedure', 'Autre')
            stats['par_type'][type_proc] = stats['par_type'].get(type_proc, 0) + 1
        
        return stats
