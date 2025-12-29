"""
Module Templates Juridiques - IA Poste Manager Édition Avocat
Spécialisé pour cabinets d'avocats avec templates pré-configurés
"""

from enum import Enum
from typing import Dict, List, Any
from datetime import datetime, timedelta

class TypeDossier(str, Enum):
    """Types de dossiers juridiques"""
    CIVIL = "civil"
    PENAL = "penal" 
    COMMERCIAL = "commercial"
    FAMILLE = "famille"
    IMMOBILIER = "immobilier"
    TRAVAIL = "travail"
    ADMINISTRATIF = "administratif"

class TypeCorrespondance(str, Enum):
    """Types de correspondance juridique"""
    ACCUSE_RECEPTION = "accuse_reception"
    DEMANDE_PIECES = "demande_pieces"
    CONVOCATION_RDV = "convocation_rdv"
    MISE_EN_DEMEURE = "mise_en_demeure"
    REPONSE_TRIBUNAL = "reponse_tribunal"
    COURRIER_CONFRERE = "courrier_confrere"
    SUIVI_DOSSIER = "suivi_dossier"
    HONORAIRES = "honoraires"

class TemplatesJuridiques:
    """Gestionnaire de templates spécialisés avocat"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Dict[str, Any]]:
        """Charge les templates juridiques pré-configurés"""
        return {
            # ACCUSÉ DE RÉCEPTION CLIENT
            "accuse_reception_nouveau_client": {
                "sujet": "Accusé de réception - Votre demande de consultation",
                "corps": """Madame, Monsieur,

J'accuse réception de votre demande de consultation juridique en date du {date_demande}.

Votre dossier a été enregistré sous la référence : {reference_dossier}

Afin de pouvoir vous conseiller au mieux, je vous prie de bien vouloir me transmettre les pièces suivantes :
{liste_pieces_requises}

Je vous propose un rendez-vous dans les créneaux suivants :
{creneaux_disponibles}

Les conditions d'honoraires seront précisées lors de notre entretien, conformément à l'article 10 du RIN.

Je reste à votre disposition pour tout complément d'information.

Cordialement,""",
                "variables": ["date_demande", "reference_dossier", "liste_pieces_requises", "creneaux_disponibles"],
                "ton": "formel",
                "type_dossier": None
            },
            
            # DEMANDE PIÈCES COMPLÉMENTAIRES
            "demande_pieces_civile": {
                "sujet": "Dossier {reference} - Pièces complémentaires requises",
                "corps": """Madame, Monsieur,

Suite à l'examen de votre dossier {reference_dossier}, il m'apparaît nécessaire d'obtenir les pièces complémentaires suivantes pour poursuivre efficacement la défense de vos intérêts :

{pieces_manquantes}

Ces documents sont indispensables pour :
{justification_pieces}

Je vous serais reconnaissant de me les transmettre dans les meilleurs délais, et au plus tard le {date_limite}, afin de respecter les échéances procédurales.

Vous pouvez me les adresser par courrier sécurisé ou les déposer directement au cabinet.

Je vous remercie de votre diligence.

Cordialement,""",
                "variables": ["reference_dossier", "pieces_manquantes", "justification_pieces", "date_limite"],
                "ton": "professionnel",
                "type_dossier": TypeDossier.CIVIL
            },
            
            # CONVOCATION RENDEZ-VOUS
            "convocation_rdv_urgent": {
                "sujet": "URGENT - Convocation rendez-vous - Dossier {reference}",
                "corps": """Madame, Monsieur,

Dans le cadre du suivi de votre dossier {reference_dossier}, il est impératif que nous nous rencontrions rapidement.

Motif de l'urgence : {motif_urgence}

Je vous propose les créneaux suivants :
{creneaux_urgents}

Merci de confirmer votre présence par retour de mail ou par téléphone au {telephone_cabinet}.

Pièces à apporter : {pieces_a_apporter}

Cette rencontre est essentielle pour la suite de votre dossier.

Cordialement,""",
                "variables": ["reference_dossier", "motif_urgence", "creneaux_urgents", "telephone_cabinet", "pieces_a_apporter"],
                "ton": "urgent",
                "type_dossier": None
            },
            
            # MISE EN DEMEURE
            "mise_en_demeure_standard": {
                "sujet": "Mise en demeure - Dossier {reference}",
                "corps": """Madame, Monsieur,

Par la présente, je vous mets en demeure, au nom et pour le compte de {nom_client}, de bien vouloir :

{objet_mise_en_demeure}

Fondement juridique : {base_legale}

Vous disposez d'un délai de {delai_execution} à compter de la réception de la présente pour vous exécuter.

À défaut d'exécution dans ce délai, {consequences_defaut}

Cette mise en demeure vaut dernier avertissement avant engagement de poursuites judiciaires.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.""",
                "variables": ["nom_client", "objet_mise_en_demeure", "base_legale", "delai_execution", "consequences_defaut"],
                "ton": "ferme",
                "type_dossier": None
            },
            
            # RÉPONSE TRIBUNAL
            "reponse_tribunal_delai": {
                "sujet": "Demande de délai - Affaire {numero_rg}",
                "corps": """Monsieur le Greffier en Chef,

J'ai l'honneur de solliciter un délai supplémentaire pour le dépôt de mes conclusions dans l'affaire {numero_rg} opposant {parties}.

Motif de la demande : {motif_delai}

Je sollicite un délai jusqu'au {nouvelle_date_limite}.

Cet accord de délai permettra une instruction plus approfondie du dossier dans l'intérêt d'une bonne justice.

Je vous prie d'agréer, Monsieur le Greffier en Chef, l'expression de ma haute considération.""",
                "variables": ["numero_rg", "parties", "motif_delai", "nouvelle_date_limite"],
                "ton": "tres_formel",
                "type_dossier": None
            },
            
            # SUIVI DOSSIER
            "suivi_dossier_standard": {
                "sujet": "Point d'étape - Dossier {reference}",
                "corps": """Madame, Monsieur,

Je vous adresse le point d'étape de votre dossier {reference_dossier} :

ÉTAPES ACCOMPLIES :
{etapes_realisees}

ÉTAPES EN COURS :
{etapes_en_cours}

PROCHAINES ÉCHÉANCES :
{prochaines_echeances}

ACTIONS REQUISES DE VOTRE PART :
{actions_client}

Le dossier progresse conformément au planning établi. Je reste à votre disposition pour tout complément d'information.

Cordialement,""",
                "variables": ["reference_dossier", "etapes_realisees", "etapes_en_cours", "prochaines_echeances", "actions_client"],
                "ton": "professionnel",
                "type_dossier": None
            }
        }
    
    def generer_email_juridique(
        self,
        type_correspondance: TypeCorrespondance,
        type_dossier: TypeDossier = None,
        variables: Dict[str, str] = None,
        client_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Génère un email juridique personnalisé"""
        
        # Sélectionner le template approprié
        template_key = self._select_template(type_correspondance, type_dossier)
        template = self.templates.get(template_key)
        
        if not template:
            return self._template_generique(type_correspondance)
        
        # Personnaliser avec les variables
        variables = variables or {}
        if client_info:
            variables.update(self._extract_client_variables(client_info))
        
        # Générer le contenu
        sujet = template["sujet"].format(**variables) if variables else template["sujet"]
        corps = template["corps"].format(**variables) if variables else template["corps"]
        
        # Ajouter signature avocat
        corps_complet = f"{corps}\n\n{self._get_signature_avocat()}"
        
        return {
            "sujet": sujet,
            "corps": corps_complet,
            "ton": template["ton"],
            "type_dossier": template.get("type_dossier"),
            "variables_requises": template.get("variables", []),
            "conformite_deontologie": True,
            "validation_humaine_requise": self._requires_validation(type_correspondance)
        }
    
    def _select_template(self, type_correspondance: TypeCorrespondance, type_dossier: TypeDossier = None) -> str:
        """Sélectionne le template approprié selon le contexte"""
        
        mapping = {
            TypeCorrespondance.ACCUSE_RECEPTION: "accuse_reception_nouveau_client",
            TypeCorrespondance.DEMANDE_PIECES: "demande_pieces_civile",
            TypeCorrespondance.CONVOCATION_RDV: "convocation_rdv_urgent",
            TypeCorrespondance.MISE_EN_DEMEURE: "mise_en_demeure_standard",
            TypeCorrespondance.REPONSE_TRIBUNAL: "reponse_tribunal_delai",
            TypeCorrespondance.SUIVI_DOSSIER: "suivi_dossier_standard"
        }
        
        return mapping.get(type_correspondance, "accuse_reception_nouveau_client")
    
    def _extract_client_variables(self, client_info: Dict[str, Any]) -> Dict[str, str]:
        """Extrait les variables depuis les infos client"""
        return {
            "nom_client": client_info.get("nom", ""),
            "reference_dossier": client_info.get("reference", f"DOS-{datetime.now().strftime('%Y%m%d')}"),
            "telephone_cabinet": client_info.get("telephone_cabinet", "01 XX XX XX XX"),
            "date_demande": client_info.get("date_demande", datetime.now().strftime("%d/%m/%Y"))
        }
    
    def _get_signature_avocat(self) -> str:
        """Signature standard avocat"""
        return """Maître [NOM AVOCAT]
Avocat au Barreau de [VILLE]
[ADRESSE CABINET]
Tél : [TELEPHONE]
Email : [EMAIL]

Cabinet [NOM CABINET]
www.[SITE-WEB].fr

Ce message est confidentiel et protégé par le secret professionnel de l'avocat."""
    
    def _requires_validation(self, type_correspondance: TypeCorrespondance) -> bool:
        """Détermine si validation humaine obligatoire"""
        
        # Types nécessitant validation obligatoire
        validation_obligatoire = [
            TypeCorrespondance.MISE_EN_DEMEURE,
            TypeCorrespondance.REPONSE_TRIBUNAL,
            TypeCorrespondance.COURRIER_CONFRERE
        ]
        
        return type_correspondance in validation_obligatoire
    
    def _template_generique(self, type_correspondance: TypeCorrespondance) -> Dict[str, Any]:
        """Template générique de secours"""
        return {
            "sujet": f"Votre dossier - {type_correspondance.value}",
            "corps": """Madame, Monsieur,

Suite à votre demande, je reviens vers vous concernant votre dossier.

Je reste à votre disposition pour tout complément d'information.

Cordialement,

[SIGNATURE AVOCAT]""",
            "ton": "professionnel",
            "validation_humaine_requise": True
        }

# Exemple d'utilisation
def demo_templates_avocat():
    """Démonstration des templates juridiques"""
    
    templates = TemplatesJuridiques()
    
    # Cas 1: Accusé réception nouveau client
    email1 = templates.generer_email_juridique(
        type_correspondance=TypeCorrespondance.ACCUSE_RECEPTION,
        variables={
            "date_demande": "15/01/2025",
            "reference_dossier": "DOS-2025-001",
            "liste_pieces_requises": "• Contrat de travail\n• Bulletins de salaire\n• Courrier de licenciement",
            "creneaux_disponibles": "• Lundi 20/01 à 14h\n• Mercredi 22/01 à 10h"
        }
    )
    
    # Cas 2: Mise en demeure
    email2 = templates.generer_email_juridique(
        type_correspondance=TypeCorrespondance.MISE_EN_DEMEURE,
        variables={
            "nom_client": "Société ABC",
            "objet_mise_en_demeure": "Régler la facture n°2024-156 d'un montant de 5 000€",
            "base_legale": "Articles 1231-1 et suivants du Code civil",
            "delai_execution": "8 jours",
            "consequences_defaut": "nous engagerons une procédure judiciaire aux fins d'obtenir le paiement forcé"
        }
    )
    
    return [email1, email2]

if __name__ == "__main__":
    # Test des templates
    demos = demo_templates_avocat()
    for i, demo in enumerate(demos, 1):
        print(f"\n=== DEMO {i} ===")
        print(f"Sujet: {demo['sujet']}")
        print(f"Corps:\n{demo['corps']}")
        print(f"Validation requise: {demo['validation_humaine_requise']}")