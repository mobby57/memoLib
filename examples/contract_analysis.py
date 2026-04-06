"""
MemoLib AI - Exemple : Analyse de contrats et extraction de clauses

Démontre comment utiliser MemoLib pour analyser un contrat juridique,
identifier les clauses importantes et produire un rapport structuré.

Usage:
    python contract_analysis.py [chemin_du_fichier]
    python contract_analysis.py  # utilise le contrat de démonstration intégré
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


# ---------------------------------------------------------------------------
# Modèles de données
# ---------------------------------------------------------------------------


@dataclass
class Clause:
    type: str
    text: str
    confidence: float
    start_position: int = 0


@dataclass
class ContractAnalysisResult:
    filename: str
    document_type: str
    parties: list[str]
    clauses: list[Clause]
    key_dates: list[str]
    obligations: list[str]
    risks: list[str]
    summary: str
    analyzed_at: str = field(default_factory=lambda: datetime.now().isoformat())


# ---------------------------------------------------------------------------
# Analyseur de contrats
# ---------------------------------------------------------------------------


class ContractAnalyzer:
    """Analyseur de contrats juridiques basé sur des heuristiques NLP légères."""

    CLAUSE_PATTERNS: dict[str, list[str]] = {
        "obligation": [
            r"(?i)(doit|devra|est tenu[e]? de|s'engage à|obligation de)[^.]{5,200}",
            r"(?i)(les parties (s'engagent|doivent|acceptent))[^.]{5,200}",
        ],
        "pénalité": [
            r"(?i)(pénalité[s]?|amende[s]?|sanction[s]?|dommages[- ]intérêts)[^.]{5,200}",
            r"(?i)(en cas de (manquement|défaut|retard))[^.]{5,200}",
        ],
        "délai": [
            r"(?i)(dans un délai de|au plus tard le|avant le \d)[^.]{5,150}",
            r"(?i)(\d+ (jours? (ouvrés?|calendaires?)?|mois|semaines?|ans?))[^.]{5,100}",
        ],
        "résiliation": [
            r"(?i)(résili(ation|er|é)|rupture|fin du contrat|résolution|dénonciation)[^.]{5,200}",
        ],
        "confidentialité": [
            r"(?i)(confidentialité|confidentiel|secret|ne pas divulguer|non-divulgation)[^.]{5,200}",
        ],
        "propriété intellectuelle": [
            r"(?i)(droits? d'auteur|propriété intellectuelle|brevet|marque|licence)[^.]{5,200}",
        ],
        "paiement": [
            r"(?i)(paiement|rémunération|prix|montant|honoraires?|facture)[^.]{5,200}",
        ],
        "garantie": [
            r"(?i)(garantie[s]?|garantit|assure|certifie)[^.]{5,200}",
        ],
        "juridiction": [
            r"(?i)(tribunal compétent|juridiction|loi applicable|droit (français|belge|suisse))[^.]{5,150}",
        ],
    }

    PARTY_PATTERNS = [
        r"(?i)entre\s+:?\s*(.{10,80}?)\s+(?:et|,)\s+(.{10,80}?)(?:\s*,|\s*\(|\.)",
        r"(?i)((?:la société|m\.|mme\.?|maître|me\.?)\s+\w[\w\s]{2,40})[\s,]+((?:ci-après|dénommé))",
    ]

    DATE_PATTERN = re.compile(
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})\b",
        re.IGNORECASE,
    )

    def analyze(self, text: str, filename: str = "contrat.txt") -> ContractAnalysisResult:
        """Analyse complète d'un contrat et retourne les résultats structurés."""
        doc_type = self._detect_type(text)
        parties = self._extract_parties(text)
        clauses = self._extract_clauses(text)
        key_dates = self._extract_dates(text)
        obligations = [c.text for c in clauses if c.type == "obligation"]
        risks = self._assess_risks(clauses)
        summary = self._build_summary(doc_type, parties, clauses, key_dates)

        return ContractAnalysisResult(
            filename=filename,
            document_type=doc_type,
            parties=parties,
            clauses=clauses,
            key_dates=key_dates,
            obligations=obligations,
            risks=risks,
            summary=summary,
        )

    def analyze_file(self, path: str | Path) -> ContractAnalysisResult:
        """Lit un fichier et l'analyse."""
        file_path = Path(path)
        if not file_path.exists():
            raise FileNotFoundError(f"Fichier introuvable : {path}")

        if file_path.suffix.lower() == ".pdf":
            text = self._read_pdf(file_path)
        else:
            text = file_path.read_text(encoding="utf-8", errors="replace")

        return self.analyze(text, filename=file_path.name)

    # ------------------------------------------------------------------
    # Méthodes privées
    # ------------------------------------------------------------------

    def _detect_type(self, text: str) -> str:
        text_lower = text.lower()
        type_keywords = {
            "Contrat de travail": ["contrat de travail", "salarié", "employeur", "cdi", "cdd"],
            "Contrat commercial": ["contrat commercial", "prestation de services", "fournisseur"],
            "Contrat de bail": ["bail", "loyer", "locataire", "bailleur", "logement"],
            "Contrat de vente": ["contrat de vente", "acheteur", "vendeur", "prix de vente"],
            "Convention de confidentialité": ["nda", "confidentialité", "non-divulgation"],
            "Contrat de partenariat": ["partenariat", "partenaire", "collaboration"],
        }
        for doc_type, keywords in type_keywords.items():
            if sum(1 for kw in keywords if kw in text_lower) >= 2:
                return doc_type
        return "Contrat juridique"

    def _extract_parties(self, text: str) -> list[str]:
        parties: list[str] = []
        for pattern in self.PARTY_PATTERNS:
            for match in re.finditer(pattern, text[:2000]):
                for group in match.groups():
                    if group and len(group) > 4:
                        parties.append(group.strip())
        return list(dict.fromkeys(parties))[:6]

    def _extract_clauses(self, text: str) -> list[Clause]:
        clauses: list[Clause] = []
        for clause_type, patterns in self.CLAUSE_PATTERNS.items():
            for pattern in patterns:
                for match in re.finditer(pattern, text):
                    snippet = match.group(0).strip()[:250]
                    confidence = min(0.95, 0.65 + 0.05 * len(snippet) / 50)
                    clauses.append(
                        Clause(
                            type=clause_type,
                            text=snippet,
                            confidence=round(confidence, 2),
                            start_position=match.start(),
                        )
                    )
        # Déduplique
        seen: set[str] = set()
        unique: list[Clause] = []
        for clause in sorted(clauses, key=lambda c: c.start_position):
            key = clause.type + clause.text[:40]
            if key not in seen:
                seen.add(key)
                unique.append(clause)
        return unique[:25]

    def _extract_dates(self, text: str) -> list[str]:
        matches = self.DATE_PATTERN.findall(text)
        return list(dict.fromkeys(matches))[:10]

    def _assess_risks(self, clauses: list[Clause]) -> list[str]:
        risks: list[str] = []
        types_found = {c.type for c in clauses}
        if "confidentialité" not in types_found:
            risks.append("⚠️  Absence de clause de confidentialité")
        if "pénalité" not in types_found:
            risks.append("⚠️  Absence de clause de pénalités")
        if "juridiction" not in types_found:
            risks.append("⚠️  Absence de clause de juridiction compétente")
        if "résiliation" not in types_found:
            risks.append("⚠️  Absence de clause de résiliation")
        return risks

    def _build_summary(
        self,
        doc_type: str,
        parties: list[str],
        clauses: list[Clause],
        dates: list[str],
    ) -> str:
        clause_types = list({c.type for c in clauses})
        parts = [f"Type de document : {doc_type}."]
        if parties:
            parts.append(f"Parties impliquées : {', '.join(parties[:3])}.")
        parts.append(f"Clauses détectées ({len(clauses)}) : {', '.join(clause_types)}.")
        if dates:
            parts.append(f"Dates clés : {', '.join(dates[:3])}.")
        return " ".join(parts)

    @staticmethod
    def _read_pdf(path: Path) -> str:
        try:
            import pypdf

            reader = pypdf.PdfReader(str(path))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except ImportError:
            raise ImportError("Installez pypdf pour lire les PDF : pip install pypdf")


# ---------------------------------------------------------------------------
# Rapport
# ---------------------------------------------------------------------------


def print_report(result: ContractAnalysisResult) -> None:
    print("\n" + "=" * 70)
    print("  RAPPORT D'ANALYSE DE CONTRAT - MemoLib AI")
    print("=" * 70)
    print(f"  Fichier      : {result.filename}")
    print(f"  Type         : {result.document_type}")
    print(f"  Analysé le   : {result.analyzed_at[:19].replace('T', ' à ')}")
    print("=" * 70)

    if result.parties:
        print("\n📋 PARTIES IDENTIFIÉES")
        for party in result.parties:
            print(f"   • {party}")

    print(f"\n🔍 CLAUSES EXTRAITES ({len(result.clauses)})")
    for clause in result.clauses:
        print(f"\n  [{clause.type.upper()}] (confiance : {clause.confidence:.0%})")
        print(f"  {clause.text[:180]}{'...' if len(clause.text) > 180 else ''}")

    if result.key_dates:
        print("\n📅 DATES CLÉS")
        for date in result.key_dates[:5]:
            print(f"   • {date}")

    if result.risks:
        print("\n🚨 POINTS DE VIGILANCE")
        for risk in result.risks:
            print(f"   {risk}")

    print("\n📝 RÉSUMÉ")
    print(f"   {result.summary}")
    print("\n" + "=" * 70 + "\n")


# ---------------------------------------------------------------------------
# Données de démonstration
# ---------------------------------------------------------------------------

DEMO_CONTRACT = """
CONTRAT DE PRESTATION DE SERVICES

Entre : La société ABC Consulting SAS, dont le siège social est situé 12 rue de la Paix,
75001 Paris, représentée par son directeur général M. Jean Dupont,
ci-après dénommée "le Prestataire",

Et : La société XYZ Industries SARL, dont le siège social est situé 45 avenue des Champs,
69001 Lyon, représentée par sa gérante Mme Marie Martin,
ci-après dénommée "le Client",

Il a été convenu ce qui suit :

Article 1 - Objet
Le Prestataire s'engage à fournir des services de conseil juridique au Client conformément
au cahier des charges annexé au présent contrat.

Article 2 - Durée
Le présent contrat est conclu pour une durée de 12 mois à compter du 01/01/2026.
Il devra être renouvelé avant le 31/12/2026 pour la période suivante.

Article 3 - Paiement
La rémunération du Prestataire est fixée à 5 000 € HT par mois, payable dans un délai
de 30 jours à compter de la réception de la facture. En cas de retard de paiement,
des pénalités de 10% par mois seront appliquées.

Article 4 - Confidentialité
Le Client et le Prestataire s'engagent à ne pas divulguer les informations confidentielles
échangées dans le cadre de ce contrat. Cette obligation de confidentialité s'applique
pendant la durée du contrat et 3 ans après sa résiliation.

Article 5 - Résiliation
Chacune des parties peut résilier le présent contrat avec un préavis de 3 mois.
En cas de manquement grave aux obligations contractuelles, la résiliation peut
intervenir sans préavis.

Article 6 - Juridiction compétente
Tout litige relatif au présent contrat sera soumis au Tribunal de Commerce de Paris.
La loi française est applicable.

Fait à Paris, le 15 janvier 2026.
"""


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------


def main() -> None:
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(f"📂 Analyse du fichier : {file_path}")
        analyzer = ContractAnalyzer()
        try:
            result = analyzer.analyze_file(file_path)
        except FileNotFoundError as exc:
            print(f"❌ Erreur : {exc}")
            sys.exit(1)
    else:
        print("📄 Utilisation du contrat de démonstration intégré...")
        analyzer = ContractAnalyzer()
        result = analyzer.analyze(DEMO_CONTRACT, filename="demo_contrat.txt")

    print_report(result)


if __name__ == "__main__":
    main()
