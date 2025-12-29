"""
Configurateur Cabinet Avocat - IA Poste Manager
Configuration spécialisée pour cabinets d'avocats
"""

import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

class ConfigCabinetAvocat:
    """Configuration spécialisée pour cabinets d'avocats"""
    
    def __init__(self, nom_cabinet: str):
        self.nom_cabinet = nom_cabinet
        self.config_file = Path(f"config/cabinet_{nom_cabinet.lower().replace(' ', '_')}.json")
        self.config = self._load_or_create_config()
    
    def _load_or_create_config(self) -> Dict[str, Any]:
        """Charge ou crée la configuration cabinet"""
        
        if self.config_file.exists():
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Configuration par défaut pour cabinet avocat
        default_config = {
            "cabinet_info": {
                "nom": self.nom_cabinet,
                "type": "avocat",
                "barreau": "",
                "adresse": "",
                "telephone": "",
                "email": "",
                "site_web": "",
                "siret": "",
                "tva": ""
            },
            "avocats": [],
            "specialites": [],
            "templates_config": {
                "signature_standard": True,
                "mentions_legales": True,
                "confidentialite_auto": True,
                "validation_obligatoire": ["mise_en_demeure", "reponse_tribunal"]
            },
            "ia_config": {
                "ton_par_defaut": "professionnel",
                "validation_humaine": {
                    "nouveau_client": True,
                    "montant_superieur": 1000,
                    "urgence_tribunal": True,
                    "mise_en_demeure": True
                },
                "references_legales": True,
                "veille_jurisprudence": False
            },
            "securite": {
                "chiffrement_emails": True,
                "audit_trail": True,
                "retention_donnees_mois": 60,
                "acces_restreint_ip": [],
                "double_authentification": False
            },
            "integrations": {
                "logiciel_cabinet": "",
                "calendrier_rdv": "outlook",
                "comptabilite": "",
                "tribunal_electronique": False
            },
            "tarification": {
                "plan": "cabinet_solo",
                "emails_mensuels": 500,
                "utilisateurs_max": 1,
                "support_prioritaire": True
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Créer le dossier config si nécessaire
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Sauvegarder la config par défaut
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2, ensure_ascii=False)
        
        return default_config
    
    def configurer_cabinet_complet(
        self,
        info_cabinet: Dict[str, str],
        avocats: List[Dict[str, str]],
        specialites: List[str],
        preferences: Dict[str, Any] = None
    ) -> bool:
        """Configuration complète du cabinet"""
        
        try:
            # Mise à jour infos cabinet
            self.config["cabinet_info"].update(info_cabinet)
            
            # Ajout des avocats
            self.config["avocats"] = avocats
            
            # Spécialités du cabinet
            self.config["specialites"] = specialites
            
            # Préférences personnalisées
            if preferences:
                self._update_preferences(preferences)
            
            # Génération automatique des templates personnalisés
            self._generer_templates_personnalises()
            
            # Sauvegarde
            return self._save_config()
            
        except Exception as e:
            print(f"Erreur configuration cabinet: {e}")
            return False
    
    def _update_preferences(self, preferences: Dict[str, Any]):
        """Met à jour les préférences spécifiques"""
        
        # Configuration IA
        if "ia_preferences" in preferences:
            self.config["ia_config"].update(preferences["ia_preferences"])
        
        # Sécurité
        if "securite_preferences" in preferences:
            self.config["securite"].update(preferences["securite_preferences"])
        
        # Templates
        if "templates_preferences" in preferences:
            self.config["templates_config"].update(preferences["templates_preferences"])
    
    def _generer_templates_personnalises(self):
        """Génère les templates personnalisés pour le cabinet"""
        
        cabinet_info = self.config["cabinet_info"]
        
        # Signature personnalisée
        signature = f"""Maître {cabinet_info.get('nom', '[NOM AVOCAT]')}
Avocat au Barreau de {cabinet_info.get('barreau', '[VILLE]')}
{cabinet_info.get('adresse', '[ADRESSE CABINET]')}
Tél : {cabinet_info.get('telephone', '[TELEPHONE]')}
Email : {cabinet_info.get('email', '[EMAIL]')}

{self.nom_cabinet}
{cabinet_info.get('site_web', 'www.[SITE-WEB].fr')}

Ce message est confidentiel et protégé par le secret professionnel de l'avocat."""
        
        self.config["templates_config"]["signature_personnalisee"] = signature
        
        # Mentions légales
        mentions = f"""MENTIONS LÉGALES
{self.nom_cabinet} - {cabinet_info.get('siret', 'SIRET: XXX XXX XXX XXXXX')}
TVA: {cabinet_info.get('tva', 'FR XX XXX XXX XXX')}
Avocat inscrit au Barreau de {cabinet_info.get('barreau', '[VILLE]')}
Assurance RCP: [COMPAGNIE ASSURANCE]

CONFIDENTIALITÉ
Ce message et ses pièces jointes sont confidentiels et destinés exclusivement 
à la personne ou l'entité à laquelle ils sont adressés. Ils sont protégés par 
le secret professionnel de l'avocat (art. 66-5 de la loi du 31/12/1971)."""
        
        self.config["templates_config"]["mentions_legales_personnalisees"] = mentions
    
    def get_config_ia(self) -> Dict[str, Any]:
        """Retourne la configuration IA pour le cabinet"""
        
        return {
            "cabinet_name": self.nom_cabinet,
            "specialites": self.config["specialites"],
            "ton_defaut": self.config["ia_config"]["ton_par_defaut"],
            "validation_rules": self.config["ia_config"]["validation_humaine"],
            "signature": self.config["templates_config"].get("signature_personnalisee", ""),
            "mentions_legales": self.config["templates_config"].get("mentions_legales_personnalisees", ""),
            "securite_niveau": "avocat"
        }
    
    def get_templates_specialises(self) -> Dict[str, Any]:
        """Retourne les templates spécialisés selon les domaines du cabinet"""
        
        templates_base = {
            "civil": ["demande_pieces_civile", "assignation_civile", "conclusions_civiles"],
            "penal": ["constitution_partie_civile", "demande_mainlevee", "requete_nullite"],
            "commercial": ["mise_en_demeure_commerciale", "injonction_payer", "sauvegarde"],
            "famille": ["requete_divorce", "pension_alimentaire", "garde_enfants"],
            "immobilier": ["bail_commercial", "expulsion", "copropriete"],
            "travail": ["licenciement", "prudhommes", "harcelement"],
            "administratif": ["recours_gracieux", "tribunal_administratif", "marches_publics"]
        }
        
        # Filtrer selon les spécialités du cabinet
        templates_cabinet = {}
        for specialite in self.config["specialites"]:
            if specialite in templates_base:
                templates_cabinet[specialite] = templates_base[specialite]
        
        return templates_cabinet
    
    def _save_config(self) -> bool:
        """Sauvegarde la configuration"""
        try:
            self.config["updated_at"] = datetime.now().isoformat()
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Erreur sauvegarde config: {e}")
            return False
    
    def export_config_deploiement(self) -> Dict[str, Any]:
        """Exporte la config pour déploiement"""
        
        return {
            "cabinet_info": self.config["cabinet_info"],
            "ia_config": self.get_config_ia(),
            "templates": self.get_templates_specialises(),
            "securite": self.config["securite"],
            "integrations": self.config["integrations"]
        }

# Exemple de configuration rapide
def setup_cabinet_exemple():
    """Exemple de setup rapide pour un cabinet"""
    
    # Création config cabinet
    cabinet = ConfigCabinetAvocat("Cabinet Dupont & Associés")
    
    # Informations cabinet
    info_cabinet = {
        "barreau": "Paris",
        "adresse": "15 rue de la Paix, 75001 Paris",
        "telephone": "01 42 86 XX XX",
        "email": "contact@cabinet-dupont.fr",
        "site_web": "www.cabinet-dupont.fr",
        "siret": "123 456 789 00012",
        "tva": "FR12 123456789"
    }
    
    # Avocats du cabinet
    avocats = [
        {
            "nom": "Maître Jean Dupont",
            "specialite": "Droit civil",
            "barreau": "Paris",
            "email": "j.dupont@cabinet-dupont.fr"
        },
        {
            "nom": "Maître Marie Martin",
            "specialite": "Droit commercial", 
            "barreau": "Paris",
            "email": "m.martin@cabinet-dupont.fr"
        }
    ]
    
    # Spécialités du cabinet
    specialites = ["civil", "commercial", "immobilier"]
    
    # Préférences spécifiques
    preferences = {
        "ia_preferences": {
            "ton_par_defaut": "formel",
            "validation_humaine": {
                "nouveau_client": True,
                "montant_superieur": 2000,
                "urgence_tribunal": True
            }
        },
        "securite_preferences": {
            "double_authentification": True,
            "retention_donnees_mois": 84  # 7 ans
        }
    }
    
    # Configuration complète
    success = cabinet.configurer_cabinet_complet(
        info_cabinet=info_cabinet,
        avocats=avocats,
        specialites=specialites,
        preferences=preferences
    )
    
    if success:
        print("✅ Cabinet configuré avec succès")
        
        # Export pour déploiement
        config_deploy = cabinet.export_config_deploiement()
        
        # Sauvegarde config déploiement
        with open("config/deploy_cabinet_dupont.json", "w", encoding="utf-8") as f:
            json.dump(config_deploy, f, indent=2, ensure_ascii=False)
        
        print("✅ Configuration de déploiement générée")
        return config_deploy
    else:
        print("❌ Erreur lors de la configuration")
        return None

if __name__ == "__main__":
    # Test configuration cabinet
    config = setup_cabinet_exemple()
    if config:
        print("\n=== CONFIGURATION CABINET ===")
        print(f"Cabinet: {config['cabinet_info']['nom']}")
        print(f"Spécialités: {', '.join(config['templates'].keys())}")
        print(f"Sécurité: Niveau avocat activé")
        print(f"IA: Ton {config['ia_config']['ton_defaut']}")