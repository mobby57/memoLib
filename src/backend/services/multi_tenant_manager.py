"""
Module Multi-Tenant - IA Poste Manager
Gestion des différentes professions libérales
"""

from enum import Enum
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

class ProfessionType(str, Enum):
    """Types de professions supportées"""
    AVOCAT = "avocat"
    MEDECIN = "medecin"
    EXPERT_COMPTABLE = "expert_comptable"
    NOTAIRE = "notaire"
    ARCHITECTE = "architecte"

class MultiTenantManager:
    """Gestionnaire multi-tenant pour professions libérales"""
    
    def __init__(self):
        self.profession_configs = self._load_profession_configs()
    
    def _load_profession_configs(self) -> Dict[str, Dict[str, Any]]:
        """Charge les configurations par profession"""
        return {
            ProfessionType.AVOCAT: {
                "templates": [
                    "accuse_reception", "demande_pieces", "convocation_rdv",
                    "mise_en_demeure", "reponse_tribunal", "courrier_confrere"
                ],
                "ton_defaut": "formel",
                "validation_obligatoire": ["mise_en_demeure", "reponse_tribunal"],
                "securite_niveau": "secret_professionnel",
                "tarif_mensuel": 97,
                "conformite": ["RGPD", "Ordre_Avocats", "Secret_Professionnel"]
            },
            
            ProfessionType.MEDECIN: {
                "templates": [
                    "compte_rendu_consultation", "courrier_liaison", "certificat_medical",
                    "arret_travail", "correspondance_confrere", "reponse_cpam"
                ],
                "ton_defaut": "medical_professionnel",
                "validation_obligatoire": ["certificat_medical", "arret_travail"],
                "securite_niveau": "secret_medical",
                "tarif_mensuel": 127,
                "conformite": ["RGPD_Sante", "HDS", "Secret_Medical", "Ordre_Medecins"],
                "hebergement_requis": "HDS"
            },
            
            ProfessionType.EXPERT_COMPTABLE: {
                "templates": [
                    "lettre_mission", "demande_pieces_comptables", "relance_client",
                    "courrier_fisc", "rapport_gestion", "correspondance_banque"
                ],
                "ton_defaut": "comptable_professionnel",
                "validation_obligatoire": ["lettre_mission", "rapport_gestion"],
                "securite_niveau": "secret_professionnel_comptable",
                "tarif_mensuel": 97,
                "conformite": ["RGPD", "Ordre_Experts_Comptables", "LCF"],
                "integrations": ["sage", "cegid", "ebp", "edi_tva"]
            },
            
            ProfessionType.NOTAIRE: {
                "templates": [
                    "acte_authentique_brouillon", "correspondance_client", "courrier_banque",
                    "administration_fiscale", "conservation_hypotheques", "syndic"
                ],
                "ton_defaut": "notarial_solennel",
                "validation_obligatoire": ["acte_authentique_brouillon"],
                "securite_niveau": "authentification_notariale",
                "tarif_mensuel": 147,
                "conformite": ["RGPD", "Chambre_Notaires", "eIDAS"],
                "signature_electronique": True,
                "horodatage_qualifie": True
            },
            
            ProfessionType.ARCHITECTE: {
                "templates": [
                    "devis_proposition", "maitrise_ouvrage", "courrier_entreprise",
                    "administration_permis", "assurance_decennale", "expertise_technique"
                ],
                "ton_defaut": "technique_professionnel",
                "validation_obligatoire": ["devis_proposition"],
                "securite_niveau": "professionnel_standard",
                "tarif_mensuel": 87,
                "conformite": ["RGPD", "Ordre_Architectes"],
                "cao_integration": True
            }
        }
    
    def get_profession_config(self, profession: ProfessionType) -> Dict[str, Any]:
        """Retourne la configuration d'une profession"""
        return self.profession_configs.get(profession, {})
    
    def get_templates_by_profession(self, profession: ProfessionType) -> List[str]:
        """Retourne les templates d'une profession"""
        config = self.get_profession_config(profession)
        return config.get("templates", [])
    
    def get_pricing_by_profession(self, profession: ProfessionType) -> int:
        """Retourne le tarif mensuel d'une profession"""
        config = self.get_profession_config(profession)
        return config.get("tarif_mensuel", 97)
    
    def get_compliance_requirements(self, profession: ProfessionType) -> List[str]:
        """Retourne les exigences de conformité"""
        config = self.get_profession_config(profession)
        return config.get("conformite", ["RGPD"])
    
    def requires_special_hosting(self, profession: ProfessionType) -> bool:
        """Vérifie si hébergement spécial requis"""
        config = self.get_profession_config(profession)
        return "hebergement_requis" in config
    
    def generate_profession_package(self, profession: ProfessionType) -> Dict[str, Any]:
        """Génère un package complet pour une profession"""
        config = self.get_profession_config(profession)
        
        return {
            "profession": profession.value,
            "package_name": f"IA Poste Manager - Édition {profession.value.title()}",
            "templates_count": len(config.get("templates", [])),
            "monthly_price": config.get("tarif_mensuel", 97),
            "features": {
                "templates_specialises": config.get("templates", []),
                "ton_adapte": config.get("ton_defaut"),
                "validation_humaine": config.get("validation_obligatoire", []),
                "niveau_securite": config.get("securite_niveau"),
                "conformite": config.get("conformite", [])
            },
            "technical_requirements": {
                "hosting_special": self.requires_special_hosting(profession),
                "integrations": config.get("integrations", []),
                "signature_electronique": config.get("signature_electronique", False),
                "horodatage": config.get("horodatage_qualifie", False)
            },
            "roi_estimation": self._calculate_roi(profession),
            "deployment_time": "24h",
            "support_level": "professionnel"
        }
    
    def _calculate_roi(self, profession: ProfessionType) -> Dict[str, Any]:
        """Calcule le ROI par profession"""
        
        roi_data = {
            ProfessionType.AVOCAT: {
                "temps_economise_h_semaine": 15,
                "taux_horaire": 150,
                "cout_mensuel": 97
            },
            ProfessionType.MEDECIN: {
                "temps_economise_h_semaine": 20,
                "taux_horaire": 80,
                "cout_mensuel": 127
            },
            ProfessionType.EXPERT_COMPTABLE: {
                "temps_economise_h_semaine": 12,
                "taux_horaire": 70,
                "cout_mensuel": 97
            },
            ProfessionType.NOTAIRE: {
                "temps_economise_h_semaine": 10,
                "taux_horaire": 120,
                "cout_mensuel": 147
            },
            ProfessionType.ARCHITECTE: {
                "temps_economise_h_semaine": 8,
                "taux_horaire": 65,
                "cout_mensuel": 87
            }
        }
        
        data = roi_data.get(profession, roi_data[ProfessionType.AVOCAT])
        
        temps_economise = data["temps_economise_h_semaine"]
        taux_horaire = data["taux_horaire"]
        cout_mensuel = data["cout_mensuel"]
        
        valeur_mensuelle = temps_economise * 4 * taux_horaire  # 4 semaines
        roi_pourcentage = ((valeur_mensuelle - cout_mensuel) / cout_mensuel) * 100
        
        return {
            "temps_economise_h_semaine": temps_economise,
            "valeur_temps_mensuelle": valeur_mensuelle,
            "cout_solution_mensuelle": cout_mensuel,
            "roi_pourcentage": round(roi_pourcentage, 0),
            "retour_investissement_jours": max(1, round((cout_mensuel / (valeur_mensuelle / 30)), 0))
        }

# Générateur de packages commerciaux
def generate_all_profession_packages():
    """Génère tous les packages commerciaux"""
    
    manager = MultiTenantManager()
    packages = {}
    
    for profession in ProfessionType:
        packages[profession.value] = manager.generate_profession_package(profession)
    
    return packages

# Exemple d'utilisation
if __name__ == "__main__":
    # Générer tous les packages
    all_packages = generate_all_profession_packages()
    
    # Afficher résumé
    print("=== PACKAGES PROFESSIONS LIBÉRALES ===\n")
    
    for profession, package in all_packages.items():
        roi = package["roi_estimation"]
        print(f"{package['package_name']}")
        print(f"   Prix: {package['monthly_price']}€/mois")
        print(f"   ROI: {roi['roi_pourcentage']}%")
        print(f"   Temps economise: {roi['temps_economise_h_semaine']}h/semaine")
        print(f"   Templates: {package['templates_count']}")
        print(f"   Conformite: {', '.join(package['features']['conformite'])}")
        print()
    
    # Sauvegarder packages
    with open("packages_professions.json", "w", encoding="utf-8") as f:
        json.dump(all_packages, f, indent=2, ensure_ascii=False)
    
    print("Packages sauvegardes dans packages_professions.json")