"""
MemoLib AI - Exemple : Prédiction de l'issue d'une affaire juridique

Démontre comment MemoLib peut analyser un dossier juridique et estimer
la probabilité d'un résultat favorable basé sur des précédents et
des caractéristiques de l'affaire.

Usage:
    python case_prediction.py [chemin_du_fichier]
    python case_prediction.py  # utilise le dossier de démonstration intégré
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
class CaseFeatures:
    """Caractéristiques extraites d'un dossier juridique."""
    case_type: str
    jurisdiction: str
    key_arguments: list[str]
    cited_articles: list[str]
    cited_precedents: list[str]
    parties: list[str]
    damages_claimed: str | None
    procedural_stage: str


@dataclass
class PredictionResult:
    """Résultat de la prédiction d'issue d'une affaire."""
    case_id: str
    case_type: str
    predicted_outcome: str
    success_probability: float
    confidence: float
    risk_level: str
    key_factors: list[str]
    recommendations: list[str]
    similar_precedents: list[dict]
    analyzed_at: str = field(default_factory=lambda: datetime.now().isoformat())


# ---------------------------------------------------------------------------
# Prédicteur d'issues juridiques
# ---------------------------------------------------------------------------


class CasePredictor:
    """
    Prédicteur d'issues juridiques basé sur des heuristiques et
    une base de précédents simulés.

    Dans un environnement de production, ce module se connecterait à une
    base de jurisprudence (ex. Légifrance, EUR-Lex) et utiliserait un
    modèle de langage fine-tuné sur des décisions de justice.
    """

    # Base de précédents simulés (en production : base de données jurisprudentielle)
    PRECEDENTS_DB: list[dict] = [
        {
            "id": "CA-Paris-2023-1234",
            "type": "Droit du travail",
            "subtype": "Licenciement abusif",
            "outcome": "favorable_employe",
            "success_rate": 0.68,
            "keywords": ["licenciement", "abusif", "motif réel", "cause réelle"],
            "citation": "CA Paris, 12 mars 2023, n°22/01234",
        },
        {
            "id": "Cass-Soc-2022-567",
            "type": "Droit du travail",
            "subtype": "Harcèlement moral",
            "outcome": "favorable_employe",
            "success_rate": 0.72,
            "keywords": ["harcèlement", "moral", "dégradation", "conditions de travail"],
            "citation": "Cass. soc., 8 juin 2022, n°20-23.456",
        },
        {
            "id": "TJ-Lyon-2023-789",
            "type": "Droit commercial",
            "subtype": "Rupture brutale",
            "outcome": "favorable_victime",
            "success_rate": 0.61,
            "keywords": ["rupture brutale", "relation commerciale", "préavis"],
            "citation": "TJ Lyon, 15 sept. 2023, n°2023/00789",
        },
        {
            "id": "CA-Versailles-2022-321",
            "type": "Droit immobilier",
            "subtype": "Expulsion locative",
            "outcome": "favorable_bailleur",
            "success_rate": 0.79,
            "keywords": ["loyers impayés", "expulsion", "commandement de payer"],
            "citation": "CA Versailles, 3 fév. 2022, n°21/04321",
        },
        {
            "id": "Cass-Crim-2023-111",
            "type": "Droit pénal",
            "subtype": "Escroquerie",
            "outcome": "condamnation",
            "success_rate": 0.55,
            "keywords": ["escroquerie", "manœuvres frauduleuses", "préjudice"],
            "citation": "Cass. crim., 21 nov. 2023, n°23-80.111",
        },
        {
            "id": "CE-2023-456",
            "type": "Droit administratif",
            "subtype": "Recours pour excès de pouvoir",
            "outcome": "annulation_acte",
            "success_rate": 0.45,
            "keywords": ["excès de pouvoir", "illégalité", "recours", "annulation"],
            "citation": "CE, 7 juil. 2023, n°460789",
        },
    ]

    CASE_TYPE_PATTERNS: dict[str, list[str]] = {
        "Droit du travail": [
            "licenciement", "salarié", "employeur", "rupture conventionnelle",
            "harcèlement", "discrimination", "heures supplémentaires",
            "cdi", "cdd",
        ],
        "Droit commercial": [
            "société", "commerce", "fournisseur", "client", "contrat commercial",
            "rupture brutale", "concurrence déloyale",
        ],
        "Droit immobilier": [
            "bail", "loyer", "locataire", "bailleur", "expulsion", "dépôt de garantie",
        ],
        "Droit pénal": [
            "infraction", "délit", "crime", "victime", "escroquerie", "vol", "agression",
        ],
        "Droit de la famille": [
            "divorce", "garde", "pension alimentaire", "filiation", "adoption",
        ],
        "Droit administratif": [
            "administration", "préfecture", "recours", "autorisation", "refus",
        ],
    }

    ARTICLE_PATTERN = re.compile(
        r"(?:article|art\.?)\s+(?:L\.?\s*)?\d+(?:[.-]\d+)*\s*(?:du\s+code\s+\w+)?",
        re.IGNORECASE,
    )

    def predict(self, text: str, case_id: str | None = None) -> PredictionResult:
        """Analyse un dossier et prédit l'issue probable."""
        if case_id is None:
            case_id = f"CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        features = self._extract_features(text)
        similar_precedents = self._find_similar_precedents(features)
        success_prob = self._compute_success_probability(features, similar_precedents)
        outcome, confidence = self._predict_outcome(success_prob, features)
        risk_level = self._assess_risk_level(success_prob, confidence)
        key_factors = self._identify_key_factors(features, similar_precedents)
        recommendations = self._generate_recommendations(features, success_prob, risk_level)

        return PredictionResult(
            case_id=case_id,
            case_type=features.case_type,
            predicted_outcome=outcome,
            success_probability=round(success_prob, 3),
            confidence=round(confidence, 3),
            risk_level=risk_level,
            key_factors=key_factors,
            recommendations=recommendations,
            similar_precedents=similar_precedents[:3],
        )

    def predict_file(self, path: str | Path) -> PredictionResult:
        """Lit un fichier et prédit l'issue."""
        file_path = Path(path)
        if not file_path.exists():
            raise FileNotFoundError(f"Fichier introuvable : {path}")
        text = file_path.read_text(encoding="utf-8", errors="replace")
        return self.predict(text, case_id=file_path.stem.upper())

    # ------------------------------------------------------------------
    # Méthodes privées
    # ------------------------------------------------------------------

    def _extract_features(self, text: str) -> CaseFeatures:
        text_lower = text.lower()

        # Type de dossier
        case_type = "Non déterminé"
        max_score = 0
        for ct, keywords in self.CASE_TYPE_PATTERNS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > max_score:
                max_score = score
                case_type = ct

        # Juridiction
        jurisdiction = "Tribunal non précisé"
        for court in ["Cour de cassation", "Conseil d'État", "Cour d'appel",
                       "Tribunal judiciaire", "Tribunal de commerce",
                       "Conseil de prud'hommes"]:
            if court.lower() in text_lower:
                jurisdiction = court
                break

        # Articles de loi cités
        cited_articles = list(dict.fromkeys(
            m.group(0) for m in self.ARTICLE_PATTERN.finditer(text)
        ))[:10]

        # Arguments clés
        key_args = self._extract_key_arguments(text)

        # Parties
        parties = self._extract_parties(text)

        # Dommages réclamés
        damages = self._extract_damages(text)

        # Stade procédural
        stage = self._detect_stage(text_lower)

        return CaseFeatures(
            case_type=case_type,
            jurisdiction=jurisdiction,
            key_arguments=key_args,
            cited_articles=cited_articles,
            cited_precedents=[],
            parties=parties,
            damages_claimed=damages,
            procedural_stage=stage,
        )

    def _extract_key_arguments(self, text: str) -> list[str]:
        argument_patterns = [
            r"(?i)(en vertu de[^.]{5,100})",
            r"(?i)(il est établi que[^.]{5,100})",
            r"(?i)(la preuve est apportée[^.]{5,100})",
            r"(?i)(le demandeur soutient[^.]{5,100})",
            r"(?i)(attendu que[^.]{5,100})",
        ]
        arguments: list[str] = []
        for pattern in argument_patterns:
            for match in re.finditer(pattern, text):
                arguments.append(match.group(0).strip()[:150])
        return list(dict.fromkeys(arguments))[:5]

    def _extract_parties(self, text: str) -> list[str]:
        parties: list[str] = []
        patterns = [
            r"(?i)((?:m\.|mme\.?|maître|me\.?|la société)\s+[A-Z][a-zA-Z\s]{2,30})",
            r"(?i)((?:demandeur|défendeur|requérant|intimé)\s*:\s*[A-Z][a-zA-Z\s]{2,30})",
        ]
        for pattern in patterns:
            for match in re.finditer(pattern, text[:3000]):
                parties.append(match.group(0).strip())
        return list(dict.fromkeys(parties))[:4]

    def _extract_damages(self, text: str) -> str | None:
        pattern = re.compile(
            r"(\d[\d\s]*(?:€|euros?|EUR)(?:\s+(?:HT|TTC))?)",
            re.IGNORECASE,
        )
        matches = pattern.findall(text)
        return matches[0] if matches else None

    def _detect_stage(self, text_lower: str) -> str:
        stages = {
            "Première instance": ["première instance", "tribunal de grande instance", "tgi"],
            "Appel": ["cour d'appel", "en appel", "appel interjeté"],
            "Cassation": ["pourvoi en cassation", "cour de cassation"],
            "Référé": ["référé", "en urgence", "mesure provisoire"],
        }
        for stage, keywords in stages.items():
            if any(kw in text_lower for kw in keywords):
                return stage
        return "Non précisé"

    def _find_similar_precedents(self, features: CaseFeatures) -> list[dict]:
        similar: list[dict] = []
        text_lower = features.case_type.lower()
        for precedent in self.PRECEDENTS_DB:
            score = 0
            if precedent["type"].lower() == text_lower:
                score += 3
            keyword_matches = sum(
                1 for kw in precedent["keywords"]
                if kw in " ".join(features.key_arguments).lower()
            )
            score += keyword_matches
            if score > 0:
                similar.append({**precedent, "_relevance_score": score})
        similar.sort(key=lambda x: x["_relevance_score"], reverse=True)
        return similar[:5]

    def _compute_success_probability(
        self,
        features: CaseFeatures,
        precedents: list[dict],
    ) -> float:
        if not precedents:
            return 0.50

        weighted_sum = sum(
            p["success_rate"] * (1 + p["_relevance_score"] * 0.1)
            for p in precedents
        )
        total_weight = sum(1 + p["_relevance_score"] * 0.1 for p in precedents)
        base_prob = weighted_sum / total_weight

        # Bonus pour arguments solides et articles cités
        if len(features.key_arguments) >= 2:
            base_prob = min(0.95, base_prob + 0.03)
        if len(features.cited_articles) >= 3:
            base_prob = min(0.95, base_prob + 0.02)

        return base_prob

    def _predict_outcome(self, success_prob: float, features: CaseFeatures) -> tuple[str, float]:
        if success_prob >= 0.70:
            outcome = "Issue favorable (forte probabilité)"
            confidence = 0.80
        elif success_prob >= 0.55:
            outcome = "Issue favorable (probabilité modérée)"
            confidence = 0.65
        elif success_prob >= 0.40:
            outcome = "Issue incertaine"
            confidence = 0.55
        else:
            outcome = "Issue défavorable (risque élevé)"
            confidence = 0.70

        if len(features.cited_articles) > 5:
            confidence = min(0.95, confidence + 0.05)

        return outcome, confidence

    def _assess_risk_level(self, success_prob: float, confidence: float) -> str:
        if success_prob >= 0.65 and confidence >= 0.70:
            return "Faible"
        elif success_prob >= 0.50:
            return "Modéré"
        elif success_prob >= 0.35:
            return "Élevé"
        else:
            return "Très élevé"

    def _identify_key_factors(self, features: CaseFeatures, precedents: list[dict]) -> list[str]:
        factors: list[str] = []
        if features.cited_articles:
            factors.append(f"✅ {len(features.cited_articles)} article(s) de loi cité(s)")
        if features.key_arguments:
            factors.append(f"✅ {len(features.key_arguments)} argument(s) juridique(s) identifié(s)")
        if features.damages_claimed:
            factors.append(f"💰 Montant réclamé : {features.damages_claimed}")
        if features.procedural_stage != "Non précisé":
            factors.append(f"📋 Stade procédural : {features.procedural_stage}")
        if precedents:
            top = precedents[0]
            factors.append(
                f"📚 Précédent le plus proche : {top.get('citation', 'N/A')} "
                f"(taux de succès : {top['success_rate']:.0%})"
            )
        return factors

    def _generate_recommendations(
        self,
        features: CaseFeatures,
        success_prob: float,
        risk_level: str,
    ) -> list[str]:
        recs: list[str] = []
        if success_prob < 0.55:
            recs.append("🔎 Rechercher des précédents jurisprudentiels supplémentaires")
            recs.append("📝 Renforcer le dossier avec des preuves complémentaires")
        if not features.cited_articles:
            recs.append("⚖️  Identifier et citer les articles de loi applicables")
        if risk_level in ("Élevé", "Très élevé"):
            recs.append("🤝 Envisager une médiation ou un règlement amiable")
        if features.procedural_stage == "Non précisé":
            recs.append("📋 Préciser le stade procédural dans le dossier")
        if success_prob >= 0.65:
            recs.append("✅ Dossier solide — préparer les conclusions au fond")
        return recs


# ---------------------------------------------------------------------------
# Rapport
# ---------------------------------------------------------------------------


def print_prediction_report(result: PredictionResult) -> None:
    bar_filled = int(result.success_probability * 30)
    bar = "█" * bar_filled + "░" * (30 - bar_filled)

    print("\n" + "=" * 70)
    print("  RAPPORT DE PRÉDICTION D'ISSUE - MemoLib AI")
    print("=" * 70)
    print(f"  Dossier      : {result.case_id}")
    print(f"  Type d'affaire: {result.case_type}")
    print(f"  Analysé le   : {result.analyzed_at[:19].replace('T', ' à ')}")
    print("=" * 70)

    print(f"\n🔮 RÉSULTAT PRÉDIT : {result.predicted_outcome}")
    print(f"\n📊 PROBABILITÉ DE SUCCÈS")
    print(f"   [{bar}] {result.success_probability:.0%}")
    print(f"   Confiance dans la prédiction : {result.confidence:.0%}")
    print(f"   Niveau de risque : {result.risk_level}")

    if result.key_factors:
        print("\n🔑 FACTEURS DÉTERMINANTS")
        for factor in result.key_factors:
            print(f"   {factor}")

    if result.similar_precedents:
        print("\n📚 PRÉCÉDENTS SIMILAIRES")
        for p in result.similar_precedents:
            print(f"   • {p.get('citation', p['id'])} — {p['subtype']}")
            print(f"     Taux de succès historique : {p['success_rate']:.0%}")

    if result.recommendations:
        print("\n💡 RECOMMANDATIONS")
        for rec in result.recommendations:
            print(f"   {rec}")

    print("\n" + "=" * 70)
    print("⚠️  AVERTISSEMENT : Ces prédictions sont indicatives et ne remplacent")
    print("   pas l'analyse d'un professionnel du droit qualifié.")
    print("=" * 70 + "\n")


# ---------------------------------------------------------------------------
# Données de démonstration
# ---------------------------------------------------------------------------

DEMO_CASE = """
DOSSIER DE PROCÉDURE - AFFAIRE M. Dupont c/ Société ABC

Stade procédural : Première instance
Juridiction : Conseil de prud'hommes de Paris

EXPOSÉ DES FAITS :
M. Jean Dupont, salarié au sein de la société ABC depuis 2019, a été licencié
le 15 octobre 2025. Son employeur invoque une faute grave sans avoir fourni
de motif réel et sérieux au sens de l'article L.1235-1 du Code du travail.

Le demandeur soutient que la procédure de licenciement n'a pas été respectée,
notamment l'entretien préalable prévu à l'article L.1232-2 du Code du travail.

Il est établi que M. Dupont n'a reçu aucun avertissement préalable, ni aucune
mise en demeure avant la notification de son licenciement.

En vertu de l'article L.1234-9 du Code du travail, le salarié réclame
une indemnité légale de licenciement, ainsi que des dommages et intérêts
d'un montant de 25 000 euros pour licenciement abusif.

La défense conteste ces allégations et affirme que le motif est réel et sérieux.

PRÉCÉDENTS INVOQUÉS :
- Cass. soc., 8 juin 2022 : licenciement sans cause réelle et sérieuse
- CA Paris, 2023 : défaut de convocation à l'entretien préalable
"""


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------


def main() -> None:
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(f"📂 Analyse du dossier : {file_path}")
        predictor = CasePredictor()
        try:
            result = predictor.predict_file(file_path)
        except FileNotFoundError as exc:
            print(f"❌ Erreur : {exc}")
            sys.exit(1)
    else:
        print("📄 Utilisation du dossier de démonstration intégré...")
        predictor = CasePredictor()
        result = predictor.predict(DEMO_CASE, case_id="DEMO-DUPONT-2026")

    print_prediction_report(result)


if __name__ == "__main__":
    main()
