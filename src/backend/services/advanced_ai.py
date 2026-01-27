import openai
import os
from datetime import datetime
import json
import requests

class AdvancedLegalAI:
    def __init__(self):
        # Configuration OpenAI publique (fallback)
        self.openai_key = os.getenv('OPENAI_API_KEY')
        if self.openai_key:
            openai.api_key = self.openai_key

        # Configuration Azure OpenAI (prioritaire si complète)
        self.azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        self.azure_api_key = os.getenv('AZURE_OPENAI_API_KEY')
        self.azure_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT')
        self.azure_api_version = os.getenv('AZURE_OPENAI_API_VERSION', '2025-01-01-preview')

    def advanced_case_analysis(self, case_description, procedure_type):
        """Advanced AI analysis using Azure OpenAI (GPT-5.1) or fallback OpenAI"""
        # Vérifier si Azure OpenAI est configuré
        use_azure = self.azure_endpoint and self.azure_api_key and self.azure_deployment

        if not use_azure and not self.openai_key:
            return self.fallback_analysis(case_description, procedure_type)
        
        prompt = f"""
        En tant qu'avocat expert en droit des étrangers, analysez ce dossier CESEDA:
        
        Type de procédure: {procedure_type}
        Description: {case_description}
        
        Fournissez une analyse structurée avec:
        1. Points juridiques clés
        2. Stratégie recommandée
        3. Jurisprudence applicable
        4. Probabilité de succès (%)
        5. Actions prioritaires
        
        Réponse en format JSON.
        """
        
        try:
            if use_azure:
                # Appel Azure OpenAI
                url = f"{self.azure_endpoint.rstrip('/')}/openai/deployments/{self.azure_deployment}/chat/completions?api-version={self.azure_api_version}"
                headers = {
                    'Content-Type': 'application/json',
                    'api-key': self.azure_api_key
                }
                payload = {
                    'messages': [{'role': 'user', 'content': prompt}],
                    'temperature': 0.3,
                    'max_tokens': 1500
                }
                response = requests.post(url, headers=headers, json=payload, timeout=30)
                response.raise_for_status()
                result = response.json()
                return json.loads(result['choices'][0]['message']['content'])
            else:
                # Fallback OpenAI public
                response = openai.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3
                )
                return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Erreur AI: {e}")

    def fallback_analysis(self, case_description, procedure_type):
        """Fallback analysis without OpenAI"""
        urgency_keywords = ["expulsion", "oqtf", "detention", "dublin", "urgence"]
        is_urgent = any(kw in case_description.lower() for kw in urgency_keywords)

        return {
            "points_juridiques": [
                "Analyse du droit au séjour",
                "Vérification des conditions légales",
                "Examen de la situation familiale"
            ],
            "strategie": "Constituer un dossier complet avec justificatifs",
            "jurisprudence": "CE, 10 avril 2019, n° 421394",
            "probabilite_succes": 75 if not is_urgent else 45,
            "actions_prioritaires": [
                "Urgence: déposer recours sous 48h" if is_urgent else "Préparer dossier complet",
                "Rassembler justificatifs",
                "Consulter avocat spécialisé"
            ]
        }

    def generate_advanced_document(self, doc_type, client_info, case_analysis):
        """Generate sophisticated legal documents"""
        templates = {
            "recours_oqtf_avance": f"""
RECOURS EN ANNULATION - OBLIGATION DE QUITTER LE TERRITOIRE FRANÇAIS

Tribunal Administratif de {client_info.get('tribunal', 'Paris')}

REQUÉRANT:
{client_info.get('nom', '[NOM]')}, de nationalité {client_info.get('nationalite', '[NATIONALITÉ]')}

OBJET: Recours en annulation contre l'OQTF du {client_info.get('date_oqtf', '[DATE]')}

MOYENS JURIDIQUES:

1. VIOLATION DE L'ARTICLE 8 CEDH
La décision méconnaît le droit au respect de la vie privée et familiale.
Jurisprudence: {case_analysis.get('jurisprudence', 'CE, 10 avril 2019')}

2. ERREUR MANIFESTE D'APPRÉCIATION
L'administration a mal apprécié la situation personnelle du requérant.

3. DÉFAUT DE MOTIVATION
La décision ne comporte pas de motivation suffisante.

SITUATION PERSONNELLE:
{client_info.get('situation_detaillee', '[SITUATION DÉTAILLÉE]')}

CONCLUSION:
Il y a lieu d'annuler la décision attaquée.

Fait à {client_info.get('ville', 'Paris')}, le {datetime.now().strftime('%d/%m/%Y')}

Maître [NOM AVOCAT]
Avocat au Barreau de Paris
            """,

            "memoire_complementaire": f"""
MÉMOIRE COMPLÉMENTAIRE

Affaire: {client_info.get('nom', '[NOM]')} c/ Préfet

DÉVELOPPEMENTS COMPLÉMENTAIRES:

I. SUR LA VIOLATION DU DROIT À LA VIE FAMILIALE

La jurisprudence constante de la Cour EDH impose un examen concret de la situation.
Arrêt Boultif c/ Suisse, 2 août 2001.

II. SUR L'INTÉGRATION DU REQUÉRANT

Éléments d'intégration:
- Présence en France: {client_info.get('duree_presence', '[DURÉE]')}
- Situation professionnelle: {client_info.get('profession', '[PROFESSION]')}
- Liens familiaux: {client_info.get('famille', '[FAMILLE]')}

III. SUR LA PROPORTIONNALITÉ

L'éloignement serait disproportionné au regard des circonstances.

CONCLUSION:
Confirme les conclusions initiales.

{datetime.now().strftime('%d/%m/%Y')}
            """
        }

        return templates.get(doc_type, "Template non disponible")

# Global instance
advanced_ai = AdvancedLegalAI()
