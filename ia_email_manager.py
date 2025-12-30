#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SYSTÈME IA EMAIL INTELLIGENT
Connexion boîte mail + Tri automatique + Règles métier personnalisées
"""

import imaplib
import email
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class PrioriteEmail(Enum):
    CRITIQUE = "critique"      # < 24h
    URGENT = "urgent"          # < 3 jours  
    IMPORTANT = "important"    # < 7 jours
    NORMAL = "normal"          # > 7 jours

class TypeProcedure(Enum):
    OQTF = "oqtf"
    CARTE_SEJOUR = "carte_sejour"
    NATURALISATION = "naturalisation"
    REGROUPEMENT_FAMILIAL = "regroupement_familial"
    AUTRE = "autre"

@dataclass
class RegleMetier:
    nom: str
    conditions: Dict  # Conditions à vérifier
    actions: Dict     # Actions à effectuer
    priorite: PrioriteEmail
    active: bool = True

@dataclass
class ProfilClient:
    nom: str
    email: str
    procedure_en_cours: Optional[str]
    situation_particuliere: Dict
    regles_personnalisees: List[RegleMetier]
    historique_urgences: List[str]

@dataclass
class EmailAnalyse:
    id: str
    expediteur: str
    sujet: str
    contenu: str
    date_reception: str
    priorite: PrioriteEmail
    type_procedure: TypeProcedure
    urgence_detectee: bool
    mots_cles_detectes: List[str]
    actions_suggerees: List[str]
    client_profil: Optional[ProfilClient]

class IAEmailManager:
    def __init__(self):
        self.regles_globales = self.charger_regles_globales()
        self.profils_clients: Dict[str, ProfilClient] = {}
        self.mots_cles_urgence = [
            "oqtf", "expulsion", "urgent", "délai", "échéance",
            "préfecture", "tribunal", "recours", "expire", "refus"
        ]
        self.mots_cles_procedures = {
            TypeProcedure.OQTF: ["oqtf", "expulsion", "recours", "tribunal administratif"],
            TypeProcedure.CARTE_SEJOUR: ["carte séjour", "titre séjour", "renouvellement", "préfecture"],
            TypeProcedure.NATURALISATION: ["naturalisation", "français", "citoyenneté", "cérémonie"],
            TypeProcedure.REGROUPEMENT_FAMILIAL: ["regroupement familial", "famille", "conjoint", "enfant"]
        }

    def connecter_boite_mail(self, serveur: str, email_addr: str, password: str):
        """Connexion à la boîte mail IMAP"""
        try:
            self.mail = imaplib.IMAP4_SSL(serveur)
            self.mail.login(email_addr, password)
            self.mail.select('inbox')
            return True
        except Exception as e:
            print(f"Erreur connexion email: {e}")
            return False

    def recuperer_emails_non_lus(self) -> List[Dict]:
        """Récupérer emails non lus"""
        try:
            status, messages = self.mail.search(None, 'UNSEEN')
            email_ids = messages[0].split()
            
            emails = []
            for email_id in email_ids[-10:]:  # 10 derniers emails
                status, msg_data = self.mail.fetch(email_id, '(RFC822)')
                msg = email.message_from_bytes(msg_data[0][1])
                
                # Extraire informations
                sujet = self.decoder_header(msg['Subject'])
                expediteur = self.decoder_header(msg['From'])
                date_str = msg['Date']
                
                # Contenu email
                contenu = self.extraire_contenu(msg)
                
                emails.append({
                    'id': email_id.decode(),
                    'expediteur': expediteur,
                    'sujet': sujet,
                    'contenu': contenu,
                    'date': date_str
                })
            
            return emails
        except Exception as e:
            print(f"Erreur récupération emails: {e}")
            return []

    def analyser_email_avec_ia(self, email_data: Dict) -> EmailAnalyse:
        """Analyse IA complète de l'email"""
        
        # 1. Détection type procédure
        type_procedure = self.detecter_type_procedure(email_data['contenu'], email_data['sujet'])
        
        # 2. Détection urgence
        urgence_detectee, mots_cles = self.detecter_urgence(email_data['contenu'], email_data['sujet'])
        
        # 3. Calcul priorité
        priorite = self.calculer_priorite(urgence_detectee, type_procedure, email_data['expediteur'])
        
        # 4. Recherche profil client
        profil_client = self.rechercher_profil_client(email_data['expediteur'])
        
        # 5. Application règles métier
        actions_suggerees = self.appliquer_regles_metier(email_data, profil_client, type_procedure)
        
        return EmailAnalyse(
            id=email_data['id'],
            expediteur=email_data['expediteur'],
            sujet=email_data['sujet'],
            contenu=email_data['contenu'],
            date_reception=email_data['date'],
            priorite=priorite,
            type_procedure=type_procedure,
            urgence_detectee=urgence_detectee,
            mots_cles_detectes=mots_cles,
            actions_suggerees=actions_suggerees,
            client_profil=profil_client
        )

    def detecter_type_procedure(self, contenu: str, sujet: str) -> TypeProcedure:
        """Détecter le type de procédure"""
        texte_complet = (contenu + " " + sujet).lower()
        
        scores = {}
        for type_proc, mots_cles in self.mots_cles_procedures.items():
            score = sum(1 for mot in mots_cles if mot in texte_complet)
            if score > 0:
                scores[type_proc] = score
        
        if scores:
            return max(scores, key=scores.get)
        return TypeProcedure.AUTRE

    def detecter_urgence(self, contenu: str, sujet: str) -> tuple:
        """Détecter urgence et extraire mots-clés"""
        texte_complet = (contenu + " " + sujet).lower()
        
        mots_detectes = []
        for mot in self.mots_cles_urgence:
            if mot in texte_complet:
                mots_detectes.append(mot)
        
        # Détection délais
        delais_pattern = r'(\d+)\s*(jour|semaine|mois)'
        delais = re.findall(delais_pattern, texte_complet)
        
        urgence = len(mots_detectes) > 0 or any(int(d[0]) <= 7 for d in delais if d[1] == 'jour')
        
        return urgence, mots_detectes

    def calculer_priorite(self, urgence: bool, type_procedure: TypeProcedure, expediteur: str) -> PrioriteEmail:
        """Calculer priorité selon règles"""
        
        # Règles de priorité
        if urgence and type_procedure == TypeProcedure.OQTF:
            return PrioriteEmail.CRITIQUE
        
        if urgence:
            return PrioriteEmail.URGENT
        
        if type_procedure in [TypeProcedure.OQTF, TypeProcedure.CARTE_SEJOUR]:
            return PrioriteEmail.IMPORTANT
        
        return PrioriteEmail.NORMAL

    def creer_profil_client(self, nom: str, email: str, situation: Dict) -> ProfilClient:
        """Créer profil client personnalisé"""
        
        # Règles par défaut selon situation
        regles = []
        
        if situation.get('procedure') == 'OQTF':
            regles.append(RegleMetier(
                nom="OQTF_Urgence",
                conditions={"mots_cles": ["oqtf", "recours", "délai"]},
                actions={"priorite": "critique", "notification": "immediate", "avocat": "alerte"},
                priorite=PrioriteEmail.CRITIQUE
            ))
        
        if situation.get('famille_france'):
            regles.append(RegleMetier(
                nom="Situation_Familiale",
                conditions={"mots_cles": ["enfant", "école", "famille"]},
                actions={"priorite": "urgent", "documents": "regroupement_familial"},
                priorite=PrioriteEmail.URGENT
            ))
        
        profil = ProfilClient(
            nom=nom,
            email=email,
            procedure_en_cours=situation.get('procedure'),
            situation_particuliere=situation,
            regles_personnalisees=regles,
            historique_urgences=[]
        )
        
        self.profils_clients[email] = profil
        return profil

    def appliquer_regles_metier(self, email_data: Dict, profil: Optional[ProfilClient], 
                               type_procedure: TypeProcedure) -> List[str]:
        """Appliquer règles métier personnalisées"""
        actions = []
        
        # Règles globales
        if type_procedure == TypeProcedure.OQTF:
            actions.extend([
                "Créer dossier urgent",
                "Planifier RDV dans 24h",
                "Préparer documents recours",
                "Alerter avocat senior"
            ])
        
        # Règles client spécifiques
        if profil:
            for regle in profil.regles_personnalisees:
                if regle.active and self.verifier_conditions(email_data, regle.conditions):
                    actions.extend(regle.actions.get('actions', []))
        
        return actions

    def verifier_conditions(self, email_data: Dict, conditions: Dict) -> bool:
        """Vérifier si conditions règle sont remplies"""
        texte = (email_data['contenu'] + " " + email_data['sujet']).lower()
        
        if 'mots_cles' in conditions:
            return any(mot in texte for mot in conditions['mots_cles'])
        
        return True

    def organiser_emails_par_priorite(self, emails_analyses: List[EmailAnalyse]) -> Dict:
        """Organiser emails par priorité"""
        organisation = {
            PrioriteEmail.CRITIQUE: [],
            PrioriteEmail.URGENT: [],
            PrioriteEmail.IMPORTANT: [],
            PrioriteEmail.NORMAL: []
        }
        
        for email in emails_analyses:
            organisation[email.priorite].append(email)
        
        # Trier par date dans chaque priorité
        for priorite in organisation:
            organisation[priorite].sort(key=lambda x: x.date_reception, reverse=True)
        
        return organisation

    def generer_rapport_quotidien(self, emails_analyses: List[EmailAnalyse]) -> str:
        """Générer rapport quotidien pour avocat"""
        organisation = self.organiser_emails_par_priorite(emails_analyses)
        
        rapport = f"📧 RAPPORT EMAIL IA - {datetime.now().strftime('%d/%m/%Y')}\n"
        rapport += "=" * 50 + "\n\n"
        
        for priorite, emails in organisation.items():
            if emails:
                rapport += f"🚨 {priorite.value.upper()} ({len(emails)} emails)\n"
                for email in emails:
                    rapport += f"  • {email.expediteur}: {email.sujet[:50]}...\n"
                    rapport += f"    Actions: {', '.join(email.actions_suggerees[:2])}\n"
                rapport += "\n"
        
        return rapport

    def charger_regles_globales(self) -> List[RegleMetier]:
        """Charger règles métier globales"""
        return [
            RegleMetier(
                nom="OQTF_Detection",
                conditions={"mots_cles": ["oqtf", "expulsion"]},
                actions={"priorite": "critique", "delai": "24h"},
                priorite=PrioriteEmail.CRITIQUE
            ),
            RegleMetier(
                nom="Delai_Court",
                conditions={"delai_jours": 7},
                actions={"priorite": "urgent", "notification": "avocat"},
                priorite=PrioriteEmail.URGENT
            )
        ]

    def decoder_header(self, header):
        """Décoder header email"""
        if header:
            decoded = email.header.decode_header(header)[0]
            if decoded[1]:
                return decoded[0].decode(decoded[1])
            return str(decoded[0])
        return ""

    def extraire_contenu(self, msg):
        """Extraire contenu email"""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        return ""

    def rechercher_profil_client(self, email_addr: str) -> Optional[ProfilClient]:
        """Rechercher profil client existant"""
        return self.profils_clients.get(email_addr)

# Démonstration
def demo_ia_email():
    """Démonstration du système"""
    ia_email = IAEmailManager()
    
    # Créer profils clients
    ia_email.creer_profil_client(
        "Ahmed HASSAN",
        "ahmed.hassan@email.com",
        {"procedure": "OQTF", "famille_france": True, "delai_critique": True}
    )
    
    # Simuler emails
    emails_test = [
        {
            'id': '001',
            'expediteur': 'ahmed.hassan@email.com',
            'sujet': 'URGENT - OQTF reçue hier',
            'contenu': 'Bonjour Maître, j\'ai reçu une OQTF hier. Délai 30 jours. Que faire?',
            'date': datetime.now().isoformat()
        },
        {
            'id': '002',
            'expediteur': 'fatima.benali@email.com',
            'sujet': 'Renouvellement carte séjour',
            'contenu': 'Ma carte expire dans 2 mois. RDV préfecture prévu.',
            'date': datetime.now().isoformat()
        }
    ]
    
    # Analyser emails
    analyses = []
    for email_data in emails_test:
        analyse = ia_email.analyser_email_avec_ia(email_data)
        analyses.append(analyse)
    
    # Générer rapport
    rapport = ia_email.generer_rapport_quotidien(analyses)
    print(rapport)
    
    return ia_email, analyses

if __name__ == "__main__":
    demo_ia_email()