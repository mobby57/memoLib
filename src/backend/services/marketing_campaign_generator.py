"""
Générateur de Campagnes Marketing - IA Poste Manager
Création automatique de contenus marketing par profession
"""

from typing import Dict, List, Any
from datetime import datetime
import json

class MarketingCampaignGenerator:
    """Générateur de campagnes marketing spécialisées"""
    
    def __init__(self):
        self.profession_data = self._load_profession_marketing_data()
    
    def _load_profession_marketing_data(self) -> Dict[str, Dict[str, Any]]:
        """Données marketing par profession"""
        return {
            "avocat": {
                "pain_points": [
                    "Temps perdu sur emails répétitifs",
                    "Risque erreurs dans correspondance",
                    "Délais de réponse trop longs",
                    "Conformité déontologique complexe"
                ],
                "benefits": [
                    "15h économisées par semaine",
                    "Templates validés par confrères",
                    "Réponses instantanées clients",
                    "Conformité Ordre garantie"
                ],
                "objections": {
                    "securite": "Chiffrement niveau bancaire + secret professionnel",
                    "deontologie": "Validation humaine obligatoire pour actes sensibles",
                    "cout": "ROI 9178% - Rentable dès le 1er jour",
                    "apprentissage": "Formation 2h + templates pré-configurés"
                },
                "channels": ["LinkedIn", "Salons juridiques", "Ordres régionaux", "Webinaires"],
                "testimonial_template": "Maître {nom}, Cabinet {ville} : 'Depuis IA Poste Manager, je gagne 3h par jour sur mes emails clients. ROI exceptionnel !'"
            },
            
            "medecin": {
                "pain_points": [
                    "Surcharge administrative",
                    "Temps réduit avec patients",
                    "Correspondance médicale chronophage",
                    "Conformité RGPD Santé complexe"
                ],
                "benefits": [
                    "20h économisées par semaine",
                    "Plus de temps pour patients",
                    "Templates médicaux certifiés",
                    "Conformité HDS native"
                ],
                "objections": {
                    "securite": "Hébergement HDS certifié + RGPD Santé",
                    "medical": "Templates validés par confrères médecins",
                    "cout": "ROI 4939% - 127€ vs 6400€ économisés/mois",
                    "apprentissage": "Compatible tous logiciels médicaux"
                },
                "channels": ["Congrès médicaux", "URPS", "Presse médicale", "MSP"],
                "testimonial_template": "Dr {nom}, {specialite} : 'IA Poste Manager m'a redonné du temps pour mes patients. Indispensable !'"
            },
            
            "expert_comptable": {
                "pain_points": [
                    "Lettres de mission répétitives",
                    "Relances clients chronophages",
                    "Correspondance administrative",
                    "Intégration ERP complexe"
                ],
                "benefits": [
                    "12h économisées par semaine",
                    "Intégration Sage/Cegid native",
                    "Templates comptables/fiscaux",
                    "Conformité LCF garantie"
                ],
                "objections": {
                    "integration": "Compatible Sage, Cegid, EBP nativement",
                    "comptable": "Templates validés experts-comptables",
                    "cout": "ROI 3364% - 97€ vs 3360€ économisés/mois",
                    "apprentissage": "Formation 1h + support dédié"
                },
                "channels": ["Salons comptables", "Partenaires ERP", "Réseaux EC", "Formations"],
                "testimonial_template": "{nom}, Expert-Comptable {ville} : 'Mes lettres de mission sont générées en 30 secondes. Révolutionnaire !'"
            }
        }
    
    def generate_linkedin_campaign(self, profession: str) -> Dict[str, Any]:
        """Génère une campagne LinkedIn ciblée"""
        
        data = self.profession_data.get(profession, {})
        
        posts = [
            {
                "type": "pain_point",
                "content": f"🔥 {profession.title()}s : Combien d'heures perdez-vous chaque semaine sur vos emails ?\n\n"
                          f"❌ {data['pain_points'][0]}\n"
                          f"❌ {data['pain_points'][1]}\n"
                          f"❌ {data['pain_points'][2]}\n\n"
                          f"✅ Solution : IA Poste Manager\n"
                          f"✅ {data['benefits'][0]}\n"
                          f"✅ ROI immédiat démontré\n\n"
                          f"💬 Commentez votre temps perdu actuel ⬇️",
                "cta": "Demandez votre démo gratuite",
                "hashtags": [f"#{profession}", "#IA", "#Productivite", "#ProfessionsLiberales"]
            },
            
            {
                "type": "solution",
                "content": f"🚀 Comment {data['benefits'][0].lower()} avec l'IA ?\n\n"
                          f"Témoignage client :\n"
                          f'"{data["testimonial_template"].format(nom="[Client]", ville="Paris", specialite="Généraliste")}"\n\n'
                          f"🎯 Résultats mesurés :\n"
                          f"• {data['benefits'][1]}\n"
                          f"• {data['benefits'][2]}\n"
                          f"• {data['benefits'][3]}\n\n"
                          f"📊 ROI calculé : +3000% dès le 1er mois",
                "cta": "Essai gratuit 30 jours",
                "hashtags": [f"#{profession}", "#ROI", "#Temoignage", "#IA"]
            },
            
            {
                "type": "objection_handling",
                "content": f"❓ FAQ {profession.title()}s sur l'IA email :\n\n"
                          f"Q: 'Est-ce sécurisé ?'\n"
                          f"R: {data['objections']['securite']}\n\n"
                          f"Q: 'Combien ça coûte ?'\n"
                          f"R: {data['objections']['cout']}\n\n"
                          f"Q: 'Temps d'apprentissage ?'\n"
                          f"R: {data['objections']['apprentissage']}\n\n"
                          f"💡 D'autres questions ? Commentez ⬇️",
                "cta": "Réservez votre consultation",
                "hashtags": [f"#{profession}", "#FAQ", "#Securite", "#Formation"]
            }
        ]
        
        return {
            "profession": profession,
            "platform": "LinkedIn",
            "posts": posts,
            "targeting": {
                "job_titles": self._get_linkedin_job_titles(profession),
                "locations": ["France"],
                "company_sizes": ["1-10", "11-50", "51-200"],
                "interests": self._get_linkedin_interests(profession)
            },
            "budget_daily": 50,
            "duration_days": 30
        }
    
    def generate_email_campaign(self, profession: str) -> Dict[str, Any]:
        """Génère une campagne email nurturing"""
        
        data = self.profession_data.get(profession, {})
        
        emails = [
            {
                "day": 0,
                "subject": f"[{profession.title()}] Économisez 15h/semaine sur vos emails",
                "content": f"""Bonjour,

Saviez-vous qu'un {profession} passe en moyenne 15h par semaine sur ses emails ?

❌ Problèmes identifiés :
• {data['pain_points'][0]}
• {data['pain_points'][1]}
• {data['pain_points'][2]}

✅ Notre solution IA :
• {data['benefits'][0]}
• {data['benefits'][1]}
• ROI démontré : +3000%

🎁 Offre spéciale : Essai gratuit 30 jours

Cordialement,
Équipe IA Poste Manager""",
                "cta": "Démarrer l'essai gratuit"
            },
            
            {
                "day": 3,
                "subject": f"Témoignage : Comment ce {profession} a gagné 3h/jour",
                "content": f"""Bonjour,

Témoignage client récent :

{data['testimonial_template'].format(nom="Jean Dupont", ville="Lyon", specialite="Droit des affaires")}

🔍 Détails de son cas :
• Avant : 20 emails/jour = 3h de rédaction
• Après : 20 emails/jour = 30 minutes
• Temps économisé : 2h30/jour = 12h/semaine
• Valeur : 12h × 150€ = 1800€/semaine

💰 Coût IA Poste Manager : 97€/mois
📈 ROI : 1800€ × 4 semaines = 7200€/mois

Voulez-vous les mêmes résultats ?

Cordialement,
Sarra - MS Conseils""",
                "cta": "Voir la démonstration"
            },
            
            {
                "day": 7,
                "subject": f"[Dernière chance] Démo personnalisée {profession}",
                "content": f"""Bonjour,

Dernière opportunité de découvrir comment l'IA peut transformer votre pratique.

🎯 Démo personnalisée 30 minutes :
• Vos cas d'usage réels
• Templates spécialisés {profession}
• Calcul ROI personnalisé
• Questions/réponses

📅 Créneaux disponibles cette semaine :
• Mardi 14h-17h
• Mercredi 9h-12h
• Jeudi 14h-18h

⚡ Réservation immédiate : [LIEN CALENDLY]

À bientôt,
Sarra Boudjellal
CEO MS Conseils""",
                "cta": "Réserver ma démo"
            }
        ]
        
        return {
            "profession": profession,
            "platform": "Email",
            "sequence": emails,
            "targeting": {
                "sources": ["Site web", "LinkedIn", "Salons", "Partenaires"],
                "segmentation": "Profession + Taille cabinet"
            },
            "automation": True,
            "personalization": ["nom", "ville", "specialite"]
        }
    
    def generate_webinar_campaign(self, profession: str) -> Dict[str, Any]:
        """Génère une campagne webinaire"""
        
        data = self.profession_data.get(profession, {})
        
        return {
            "profession": profession,
            "title": f"Comment l'IA révolutionne la correspondance des {profession}s",
            "subtitle": f"Économisez 15h/semaine et multipliez votre ROI par 30",
            "agenda": [
                f"Les défis actuels des {profession}s (10 min)",
                "Démonstration IA en temps réel (20 min)",
                "Témoignages clients et ROI (10 min)",
                "Questions/Réponses (15 min)",
                "Offre spéciale participants (5 min)"
            ],
            "speaker": "Sarra Boudjellal, CEO MS Conseils",
            "duration_minutes": 60,
            "max_participants": 100,
            "registration_incentive": "Guide gratuit : '10 templates emails pour " + profession + "s'",
            "special_offer": "50% de réduction pour les 20 premiers inscrits",
            "follow_up": {
                "immediate": "Replay + guide templates",
                "day_1": "Proposition démo personnalisée",
                "day_7": "Offre commerciale finale"
            }
        }
    
    def _get_linkedin_job_titles(self, profession: str) -> List[str]:
        """Titres LinkedIn par profession"""
        titles = {
            "avocat": ["Avocat", "Avocat associé", "Avocat collaborateur", "Directeur juridique"],
            "medecin": ["Médecin", "Médecin généraliste", "Médecin spécialiste", "Chef de service"],
            "expert_comptable": ["Expert-comptable", "Commissaire aux comptes", "Directeur comptable"]
        }
        return titles.get(profession, [])
    
    def _get_linkedin_interests(self, profession: str) -> List[str]:
        """Centres d'intérêt LinkedIn par profession"""
        interests = {
            "avocat": ["Droit", "Justice", "Juridique", "Barreau"],
            "medecin": ["Médecine", "Santé", "Hôpital", "Patients"],
            "expert_comptable": ["Comptabilité", "Fiscalité", "Gestion", "Finance"]
        }
        return interests.get(profession, [])
    
    def generate_complete_campaign_suite(self, profession: str) -> Dict[str, Any]:
        """Génère une suite complète de campagnes"""
        
        return {
            "profession": profession,
            "campaign_suite": {
                "linkedin": self.generate_linkedin_campaign(profession),
                "email": self.generate_email_campaign(profession),
                "webinar": self.generate_webinar_campaign(profession)
            },
            "timeline": {
                "week_1": "Lancement LinkedIn + Webinaire",
                "week_2": "Séquence email nurturing",
                "week_3": "Relance prospects qualifiés",
                "week_4": "Closing commercial"
            },
            "kpis": {
                "linkedin_reach": 10000,
                "email_open_rate": 25,
                "webinar_attendance": 60,
                "demo_conversion": 15,
                "sales_conversion": 8
            },
            "budget_total": 5000,
            "roi_expected": 15000
        }

# Générateur de toutes les campagnes
def generate_all_marketing_campaigns():
    """Génère toutes les campagnes marketing"""
    
    generator = MarketingCampaignGenerator()
    professions = ["avocat", "medecin", "expert_comptable"]
    
    all_campaigns = {}
    
    for profession in professions:
        all_campaigns[profession] = generator.generate_complete_campaign_suite(profession)
    
    return all_campaigns

# Exemple d'utilisation
if __name__ == "__main__":
    # Générer toutes les campagnes
    campaigns = generate_all_marketing_campaigns()
    
    # Afficher résumé
    print("=== CAMPAGNES MARKETING GENEREES ===\n")
    
    for profession, campaign_data in campaigns.items():
        suite = campaign_data["campaign_suite"]
        kpis = campaign_data["kpis"]
        
        print(f"{profession.upper()}")
        print(f"   LinkedIn: {len(suite['linkedin']['posts'])} posts")
        print(f"   Email: {len(suite['email']['sequence'])} emails")
        print(f"   Webinaire: {suite['webinar']['duration_minutes']} min")
        print(f"   Budget: {campaign_data['budget_total']}€")
        print(f"   ROI attendu: {campaign_data['roi_expected']}€")
        print(f"   Conversion demo: {kpis['demo_conversion']}%")
        print()
    
    # Sauvegarder campagnes
    with open("campagnes_marketing.json", "w", encoding="utf-8") as f:
        json.dump(campaigns, f, indent=2, ensure_ascii=False)
    
    print("Campagnes sauvegardees dans campagnes_marketing.json")