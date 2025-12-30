"""
Tests unitaires pour le module DeadlineManager
Calcul des délais procéduraux en jours ouvrables
"""
import pytest
from datetime import datetime, date
from src.backend.services.legal.deadline_manager import DeadlineManager


@pytest.fixture
def deadline_manager():
    """Fixture pour créer une instance de DeadlineManager"""
    return DeadlineManager()


class TestCalculDelais:
    """Tests de calcul des délais"""
    
    def test_calcul_delai_simple_jours_ouvres(self, deadline_manager):
        """Test calcul simple en jours ouvrés (pas de week-end)"""
        # Lundi 1er janvier 2024 + 5 jours ouvrés = Lundi 8 janvier
        date_debut = date(2024, 1, 1)  # Lundi
        resultat = deadline_manager.calculer_delai(date_debut, 5, unite='jours_ouvres')
        
        assert resultat['date_echeance'] == date(2024, 1, 8)
        assert resultat['jours_calcules'] == 5
    
    def test_calcul_delai_avec_weekend(self, deadline_manager):
        """Test calcul avec week-end à ignorer"""
        # Vendredi + 3 jours ouvrés = Mercredi (saute le week-end)
        date_debut = date(2024, 1, 5)  # Vendredi
        resultat = deadline_manager.calculer_delai(date_debut, 3, unite='jours_ouvres')
        
        assert resultat['date_echeance'] == date(2024, 1, 10)  # Mercredi
    
    def test_calcul_delai_avec_jour_ferie(self, deadline_manager):
        """Test calcul avec jour férié (1er mai)"""
        # 30 avril + 2 jours ouvrés = 3 mai (saute le 1er mai)
        date_debut = date(2024, 4, 30)
        resultat = deadline_manager.calculer_delai(date_debut, 2, unite='jours_ouvres')
        
        assert resultat['date_echeance'] == date(2024, 5, 3)
    
    def test_calcul_delai_jours_calendaires(self, deadline_manager):
        """Test calcul en jours calendaires (compte week-ends)"""
        date_debut = date(2024, 1, 1)
        resultat = deadline_manager.calculer_delai(date_debut, 10, unite='jours_calendaires')
        
        assert resultat['date_echeance'] == date(2024, 1, 11)
        assert resultat['jours_calcules'] == 10
    
    def test_calcul_delai_mois(self, deadline_manager):
        """Test calcul en mois"""
        date_debut = date(2024, 1, 15)
        resultat = deadline_manager.calculer_delai(date_debut, 2, unite='mois')
        
        assert resultat['date_echeance'] == date(2024, 3, 15)


class TestUrgenceClassification:
    """Tests de classification d'urgence"""
    
    def test_delai_critique(self, deadline_manager):
        """Test délai < 3 jours = CRITIQUE"""
        delai = {
            'type': 'référé',
            'date_echeance': (datetime.now().date() + timedelta(days=2)).isoformat(),
            'date_creation': datetime.now().isoformat()
        }
        
        urgence = deadline_manager.classifier_urgence(delai)
        assert urgence == 'critique'
    
    def test_delai_important(self, deadline_manager):
        """Test 3 <= délai < 7 jours = IMPORTANT"""
        delai = {
            'type': 'conclusions',
            'date_echeance': (datetime.now().date() + timedelta(days=5)).isoformat(),
            'date_creation': datetime.now().isoformat()
        }
        
        urgence = deadline_manager.classifier_urgence(delai)
        assert urgence == 'important'
    
    def test_delai_normal(self, deadline_manager):
        """Test délai >= 7 jours = NORMAL"""
        delai = {
            'type': 'assignation',
            'date_echeance': (datetime.now().date() + timedelta(days=30)).isoformat(),
            'date_creation': datetime.now().isoformat()
        }
        
        urgence = deadline_manager.classifier_urgence(delai)
        assert urgence == 'normal'


class TestJoursFeries:
    """Tests des jours fériés français"""
    
    def test_jour_ferie_fixe(self, deadline_manager):
        """Test jour férié fixe (1er mai)"""
        assert deadline_manager.est_jour_ferie(date(2024, 5, 1)) is True
        assert deadline_manager.est_jour_ferie(date(2024, 7, 14)) is True  # 14 juillet
    
    def test_jour_ferie_paques(self, deadline_manager):
        """Test Lundi de Pâques (variable)"""
        # En 2024: Pâques = 31 mars, Lundi de Pâques = 1er avril
        assert deadline_manager.est_jour_ferie(date(2024, 4, 1)) is True
    
    def test_jour_normal(self, deadline_manager):
        """Test jour normal (pas férié)"""
        assert deadline_manager.est_jour_ferie(date(2024, 1, 15)) is False


class TestListeDelais:
    """Tests de gestion de la liste des délais"""
    
    def test_ajouter_delai(self, deadline_manager):
        """Test ajout d'un délai"""
        delai = deadline_manager.ajouter_delai(
            type_delai='conclusions',
            dossier='2024-0001',
            description='Conclusions en réponse',
            date_echeance='2024-03-15'
        )
        
        assert delai['id'] is not None
        assert delai['type'] == 'conclusions'
        assert delai['dossier'] == '2024-0001'
    
    def test_liste_delais_critiques(self, deadline_manager):
        """Test récupération des délais critiques uniquement"""
        # Ajouter un délai critique
        deadline_manager.ajouter_delai(
            type_delai='référé',
            dossier='2024-0002',
            description='Audience référé',
            date_echeance=(datetime.now().date() + timedelta(days=1)).isoformat()
        )
        
        critiques = deadline_manager.lister_delais_critiques()
        assert len(critiques) > 0
        assert all(d['urgence'] == 'critique' for d in critiques)


from datetime import timedelta  # Ajout de l'import manquant


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
