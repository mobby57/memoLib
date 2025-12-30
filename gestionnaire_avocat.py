#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SYSTÈME COMPLET GESTION AVOCAT
Configuration documents, suivi dossiers, gestion paiements
"""

import json
import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class StatusDossier(Enum):
    NOUVEAU = "nouveau"
    EN_COURS = "en_cours"
    ATTENTE_DOCUMENTS = "attente_documents"
    ATTENTE_RDV = "attente_rdv"
    TERMINE = "termine"
    URGENT = "urgent"

class StatusPaiement(Enum):
    ATTENTE = "attente"
    PAYE = "paye"
    RETARD = "retard"
    ANNULE = "annule"

@dataclass
class Document:
    nom: str
    obligatoire: bool
    recu: bool = False
    date_reception: Optional[str] = None
    commentaire: str = ""

@dataclass
class Paiement:
    montant: float
    echeance: str
    status: StatusPaiement
    date_paiement: Optional[str] = None
    type_paiement: str = "acompte"  # acompte, solde, total

@dataclass
class ConfigProcedure:
    nom: str
    documents_requis: List[str]
    delai_standard: int  # jours
    tarif_base: float
    pourcentage_acompte: int = 30

@dataclass
class Dossier:
    id: str
    client_nom: str
    procedure: str
    status: StatusDossier
    date_creation: str
    delai_limite: str
    documents: List[Document]
    paiements: List[Paiement]
    avancement: int = 0  # pourcentage
    notes: str = ""

class GestionnaireAvocat:
    def __init__(self):
        self.dossiers: Dict[str, Dossier] = {}
        self.configurations: Dict[str, ConfigProcedure] = {}
        self.charger_configurations_defaut()
        
    def charger_configurations_defaut(self):
        """Configurations par défaut des procédures"""
        configs = {
            "OQTF": ConfigProcedure(
                nom="Recours OQTF",
                documents_requis=[
                    "Copie OQTF",
                    "Justificatifs présence France (5 ans)",
                    "Attestations hébergement",
                    "Bulletins salaire (6 mois)",
                    "Certificat médical si applicable",
                    "Attestations intégration"
                ],
                delai_standard=30,
                tarif_base=1500.0
            ),
            "CARTE_SEJOUR": ConfigProcedure(
                nom="Renouvellement carte séjour",
                documents_requis=[
                    "Carte actuelle + photocopie",
                    "Justificatifs ressources (3 mois)",
                    "Justificatif domicile",
                    "Photos d'identité récentes",
                    "Attestation assurance maladie"
                ],
                delai_standard=60,
                tarif_base=800.0
            ),
            "NATURALISATION": ConfigProcedure(
                nom="Naturalisation française",
                documents_requis=[
                    "Justificatifs résidence (5 ans)",
                    "Diplôme français B1 minimum",
                    "Bulletins salaire (2 ans)",
                    "Casier judiciaire",
                    "Acte naissance traduit",
                    "Justificatifs intégration républicaine"
                ],
                delai_standard=365,
                tarif_base=2500.0
            )
        }
        self.configurations = configs

    def creer_dossier(self, client_nom: str, procedure: str) -> str:
        """Créer un nouveau dossier"""
        # Générer ID unique
        date_str = datetime.datetime.now().strftime("%Y%m%d")
        numero = len([d for d in self.dossiers.values() if d.date_creation.startswith(date_str)]) + 1
        dossier_id = f"CESEDA-2025-{numero:03d}"
        
        # Configuration procédure
        config = self.configurations.get(procedure)
        if not config:
            raise ValueError(f"Procédure {procedure} non configurée")
        
        # Créer documents requis
        documents = [
            Document(nom=doc, obligatoire=True)
            for doc in config.documents_requis
        ]
        
        # Calculer délai limite
        date_creation = datetime.datetime.now()
        delai_limite = date_creation + datetime.timedelta(days=config.delai_standard)
        
        # Créer paiements
        acompte = config.tarif_base * (config.pourcentage_acompte / 100)
        solde = config.tarif_base - acompte
        
        paiements = [
            Paiement(
                montant=acompte,
                echeance=(date_creation + datetime.timedelta(days=7)).strftime("%Y-%m-%d"),
                status=StatusPaiement.ATTENTE,
                type_paiement="acompte"
            ),
            Paiement(
                montant=solde,
                echeance=delai_limite.strftime("%Y-%m-%d"),
                status=StatusPaiement.ATTENTE,
                type_paiement="solde"
            )
        ]
        
        # Créer dossier
        dossier = Dossier(
            id=dossier_id,
            client_nom=client_nom,
            procedure=procedure,
            status=StatusDossier.NOUVEAU,
            date_creation=date_creation.strftime("%Y-%m-%d"),
            delai_limite=delai_limite.strftime("%Y-%m-%d"),
            documents=documents,
            paiements=paiements
        )
        
        self.dossiers[dossier_id] = dossier
        return dossier_id

    def marquer_document_recu(self, dossier_id: str, nom_document: str):
        """Marquer un document comme reçu"""
        if dossier_id not in self.dossiers:
            raise ValueError(f"Dossier {dossier_id} introuvable")
        
        dossier = self.dossiers[dossier_id]
        for doc in dossier.documents:
            if doc.nom == nom_document:
                doc.recu = True
                doc.date_reception = datetime.datetime.now().strftime("%Y-%m-%d")
                break
        
        # Mettre à jour avancement
        self.calculer_avancement(dossier_id)

    def calculer_avancement(self, dossier_id: str):
        """Calculer pourcentage d'avancement du dossier"""
        dossier = self.dossiers[dossier_id]
        
        # Documents reçus
        docs_recus = sum(1 for doc in dossier.documents if doc.recu)
        total_docs = len(dossier.documents)
        avancement_docs = (docs_recus / total_docs) * 60  # 60% pour documents
        
        # Paiements reçus
        paiements_recus = sum(1 for p in dossier.paiements if p.status == StatusPaiement.PAYE)
        total_paiements = len(dossier.paiements)
        avancement_paiements = (paiements_recus / total_paiements) * 40  # 40% pour paiements
        
        dossier.avancement = int(avancement_docs + avancement_paiements)
        
        # Mettre à jour statut si nécessaire
        if dossier.avancement == 100:
            dossier.status = StatusDossier.TERMINE
        elif docs_recus < total_docs:
            dossier.status = StatusDossier.ATTENTE_DOCUMENTS

    def marquer_paiement_recu(self, dossier_id: str, type_paiement: str):
        """Marquer un paiement comme reçu"""
        if dossier_id not in self.dossiers:
            raise ValueError(f"Dossier {dossier_id} introuvable")
        
        dossier = self.dossiers[dossier_id]
        for paiement in dossier.paiements:
            if paiement.type_paiement == type_paiement:
                paiement.status = StatusPaiement.PAYE
                paiement.date_paiement = datetime.datetime.now().strftime("%Y-%m-%d")
                break
        
        # Mettre à jour avancement
        self.calculer_avancement(dossier_id)

    def obtenir_dossiers_urgents(self) -> List[Dossier]:
        """Obtenir dossiers avec délais critiques"""
        aujourd_hui = datetime.datetime.now()
        dossiers_urgents = []
        
        for dossier in self.dossiers.values():
            delai_limite = datetime.datetime.strptime(dossier.delai_limite, "%Y-%m-%d")
            jours_restants = (delai_limite - aujourd_hui).days
            
            if jours_restants <= 7:  # Urgent si moins de 7 jours
                dossier.status = StatusDossier.URGENT
                dossiers_urgents.append(dossier)
        
        return dossiers_urgents

    def obtenir_paiements_en_retard(self) -> List[Dict]:
        """Obtenir paiements en retard"""
        aujourd_hui = datetime.datetime.now()
        retards = []
        
        for dossier in self.dossiers.values():
            for paiement in dossier.paiements:
                if paiement.status == StatusPaiement.ATTENTE:
                    echeance = datetime.datetime.strptime(paiement.echeance, "%Y-%m-%d")
                    if echeance < aujourd_hui:
                        jours_retard = (aujourd_hui - echeance).days
                        paiement.status = StatusPaiement.RETARD
                        retards.append({
                            "dossier_id": dossier.id,
                            "client": dossier.client_nom,
                            "montant": paiement.montant,
                            "jours_retard": jours_retard,
                            "type": paiement.type_paiement
                        })
        
        return retards

    def configurer_procedure(self, procedure: str, config: ConfigProcedure):
        """Configurer ou modifier une procédure"""
        self.configurations[procedure] = config

    def obtenir_statistiques(self) -> Dict:
        """Obtenir statistiques du cabinet"""
        total_dossiers = len(self.dossiers)
        dossiers_urgents = len(self.obtenir_dossiers_urgents())
        
        # Calcul CA
        ca_total = 0
        ca_attente = 0
        for dossier in self.dossiers.values():
            for paiement in dossier.paiements:
                if paiement.status == StatusPaiement.PAYE:
                    ca_total += paiement.montant
                elif paiement.status == StatusPaiement.ATTENTE:
                    ca_attente += paiement.montant
        
        # Répartition par procédure
        procedures = {}
        for dossier in self.dossiers.values():
            proc = dossier.procedure
            procedures[proc] = procedures.get(proc, 0) + 1
        
        return {
            "total_dossiers": total_dossiers,
            "dossiers_urgents": dossiers_urgents,
            "ca_realise": ca_total,
            "ca_attente": ca_attente,
            "repartition_procedures": procedures,
            "taux_avancement_moyen": sum(d.avancement for d in self.dossiers.values()) / max(total_dossiers, 1)
        }

    def exporter_donnees(self) -> str:
        """Exporter toutes les données en JSON"""
        data = {
            "dossiers": {k: asdict(v) for k, v in self.dossiers.items()},
            "configurations": {k: asdict(v) for k, v in self.configurations.items()},
            "export_date": datetime.datetime.now().isoformat()
        }
        return json.dumps(data, indent=2, ensure_ascii=False)

    def demo_donnees(self):
        """Créer données de démonstration"""
        # Dossier urgent OQTF
        id1 = self.creer_dossier("M. Ahmed HASSAN", "OQTF")
        self.marquer_document_recu(id1, "Copie OQTF")
        self.marquer_document_recu(id1, "Justificatifs présence France (5 ans)")
        
        # Dossier carte séjour
        id2 = self.creer_dossier("Mme Fatima BENALI", "CARTE_SEJOUR")
        self.marquer_paiement_recu(id2, "acompte")
        for doc in self.dossiers[id2].documents[:4]:  # 4 docs sur 5
            self.marquer_document_recu(id2, doc.nom)
        
        # Dossier naturalisation
        id3 = self.creer_dossier("M. Chen WEI", "NATURALISATION")
        self.marquer_paiement_recu(id3, "acompte")

# Démonstration
if __name__ == "__main__":
    gestionnaire = GestionnaireAvocat()
    gestionnaire.demo_donnees()
    
    print("🏛️ SYSTÈME GESTION AVOCAT - DÉMO")
    print("=" * 50)
    
    # Statistiques
    stats = gestionnaire.obtenir_statistiques()
    print(f"📊 Dossiers actifs: {stats['total_dossiers']}")
    print(f"🚨 Urgences: {stats['dossiers_urgents']}")
    print(f"💰 CA réalisé: {stats['ca_realise']:.0f}€")
    print(f"💰 CA en attente: {stats['ca_attente']:.0f}€")
    
    # Dossiers urgents
    urgents = gestionnaire.obtenir_dossiers_urgents()
    if urgents:
        print(f"\n🚨 DOSSIERS URGENTS:")
        for dossier in urgents:
            print(f"   • {dossier.id} - {dossier.client_nom} ({dossier.procedure})")
    
    # Paiements en retard
    retards = gestionnaire.obtenir_paiements_en_retard()
    if retards:
        print(f"\n💰 PAIEMENTS EN RETARD:")
        for retard in retards:
            print(f"   • {retard['client']}: {retard['montant']}€ ({retard['jours_retard']} jours)")
    
    print(f"\n✅ Système opérationnel - {len(gestionnaire.configurations)} procédures configurées")