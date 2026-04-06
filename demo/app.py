"""
MemoLib AI - Application de démonstration Streamlit

Interface interactive pour analyser des documents juridiques :
- Upload de document (PDF ou texte)
- Choix du type d'analyse (analyse complète, extraction de clauses, prédiction)
- Affichage des résultats dans une interface conviviale

Usage:
    streamlit run app.py
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import streamlit as st

# Ajouter le dossier racine au chemin Python pour importer les exemples
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from examples.contract_analysis import ContractAnalyzer  # noqa: E402
from examples.case_prediction import CasePredictor  # noqa: E402

# ---------------------------------------------------------------------------
# Configuration de la page
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="MemoLib AI - Assistant Juridique",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Style CSS personnalisé
# ---------------------------------------------------------------------------

st.markdown(
    """
    <style>
    .main-title { font-size: 2.2rem; font-weight: 700; color: #1a3a5c; }
    .subtitle   { font-size: 1.1rem; color: #5a6a7a; margin-bottom: 1rem; }
    .result-box {
        background: #f0f4f8;
        border-left: 4px solid #1a3a5c;
        padding: 1rem;
        border-radius: 4px;
        margin: 0.5rem 0;
    }
    .clause-card {
        background: #ffffff;
        border: 1px solid #d0dce8;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        margin: 0.4rem 0;
    }
    .risk-low    { color: #1e7e34; font-weight: 600; }
    .risk-medium { color: #e67e22; font-weight: 600; }
    .risk-high   { color: #c0392b; font-weight: 600; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# En-tête
# ---------------------------------------------------------------------------

st.markdown(
    '<div class="main-title">⚖️ MemoLib AI — Assistant Juridique Intelligent</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="subtitle">Analysez vos documents juridiques, extrayez les clauses clés '
    "et prédisez l'issue de vos affaires grâce à l'IA.</div>",
    unsafe_allow_html=True,
)
st.divider()

# ---------------------------------------------------------------------------
# Barre latérale
# ---------------------------------------------------------------------------

with st.sidebar:
    st.image(
        "https://img.shields.io/badge/MemoLib-AI%20Juridique-1a3a5c?style=for-the-badge&logo=scales&logoColor=white",
        use_container_width=True,
    )
    st.markdown("### ⚙️ Options d'analyse")

    analysis_mode = st.radio(
        "Type d'analyse :",
        options=[
            "📄 Analyse complète",
            "🔍 Extraction de clauses",
            "🔮 Prédiction d'issue",
        ],
        index=0,
    )

    st.markdown("---")
    st.markdown("### 📂 Document")
    input_mode = st.radio(
        "Source du document :",
        options=["⬆️ Uploader un fichier", "📝 Saisir du texte", "🎯 Démo intégrée"],
        index=0,
    )

    st.markdown("---")
    st.markdown(
        "**MemoLib AI** v1.0.0  \n"
        "🔒 Traitement 100% local  \n"
        "[GitHub](https://github.com/mobby57/memoLib)"
    )

# ---------------------------------------------------------------------------
# Zone principale : saisie du document
# ---------------------------------------------------------------------------

document_text: str = ""
document_name: str = "document.txt"

if input_mode == "⬆️ Uploader un fichier":
    uploaded_file = st.file_uploader(
        "Déposez votre document juridique",
        type=["pdf", "txt", "md"],
        help="Formats acceptés : PDF, TXT, Markdown",
    )
    if uploaded_file is not None:
        document_name = uploaded_file.name
        raw_bytes = uploaded_file.read()
        if uploaded_file.name.lower().endswith(".pdf"):
            try:
                import pypdf

                reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
                document_text = "\n".join(page.extract_text() or "" for page in reader.pages)
                st.success(f"✅ PDF chargé : {uploaded_file.name} ({len(reader.pages)} page(s))")
            except ImportError:
                st.error("pypdf non installé. Installez-le avec : pip install pypdf")
            except Exception as exc:
                st.error(f"Erreur lors de la lecture du PDF : {exc}")
        else:
            for enc in ("utf-8", "latin-1", "cp1252"):
                try:
                    document_text = raw_bytes.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
            st.success(f"✅ Fichier chargé : {uploaded_file.name}")

elif input_mode == "📝 Saisir du texte":
    document_text = st.text_area(
        "Collez votre texte juridique ici :",
        height=280,
        placeholder="Ex : Article 1 — Le présent contrat est conclu entre...",
    )
    document_name = "texte_saisi.txt"

else:  # Démo intégrée
    demo_choice = st.selectbox(
        "Choisissez un document de démonstration :",
        ["Contrat de prestation de services", "Dossier prud'homal"],
    )
    if demo_choice == "Contrat de prestation de services":
        from examples.contract_analysis import DEMO_CONTRACT

        document_text = DEMO_CONTRACT
        document_name = "demo_contrat.txt"
    else:
        from examples.case_prediction import DEMO_CASE

        document_text = DEMO_CASE
        document_name = "demo_dossier.txt"
    st.info(f"📄 Document de démonstration chargé : **{demo_choice}**")

# Affichage de l'aperçu du texte
if document_text.strip():
    with st.expander("👁️ Aperçu du document", expanded=False):
        st.text(document_text[:1500] + ("..." if len(document_text) > 1500 else ""))

# ---------------------------------------------------------------------------
# Bouton d'analyse
# ---------------------------------------------------------------------------

st.markdown("---")
col_btn, col_info = st.columns([1, 3])
with col_btn:
    analyze_btn = st.button(
        "🚀 Lancer l'analyse",
        type="primary",
        use_container_width=True,
        disabled=not document_text.strip(),
    )

if not document_text.strip() and not analyze_btn:
    st.info("👆 Chargez ou saisissez un document pour démarrer l'analyse.")

# ---------------------------------------------------------------------------
# Traitement et affichage des résultats
# ---------------------------------------------------------------------------

if analyze_btn and document_text.strip():

    # ---- Analyse complète ----
    if analysis_mode == "📄 Analyse complète":
        with st.spinner("Analyse du document en cours…"):
            analyzer = ContractAnalyzer()
            result = analyzer.analyze(document_text, filename=document_name)

        st.success("✅ Analyse terminée !")

        col1, col2, col3 = st.columns(3)
        col1.metric("Type de document", result.document_type)
        col2.metric("Clauses détectées", len(result.clauses))
        col3.metric("Mots analysés", len(document_text.split()))

        st.markdown("### 📝 Résumé")
        st.markdown(f'<div class="result-box">{result.summary}</div>', unsafe_allow_html=True)

        if result.parties:
            st.markdown("### 👥 Parties identifiées")
            for party in result.parties:
                st.markdown(f"- {party}")

        if result.key_dates:
            st.markdown("### 📅 Dates clés")
            st.markdown(", ".join(result.key_dates[:8]))

        if result.clauses:
            st.markdown(f"### 🔍 Clauses extraites ({len(result.clauses)})")
            clause_types = list({c.type for c in result.clauses})
            selected_types = st.multiselect(
                "Filtrer par type :",
                options=clause_types,
                default=clause_types,
            )
            for clause in result.clauses:
                if clause.type in selected_types:
                    with st.container():
                        st.markdown(
                            f'<div class="clause-card">'
                            f"<strong>[{clause.type.upper()}]</strong> "
                            f"— Confiance : {clause.confidence:.0%}<br>"
                            f"<em>{clause.text[:300]}</em>"
                            f"</div>",
                            unsafe_allow_html=True,
                        )

        if result.risks:
            st.markdown("### 🚨 Points de vigilance")
            for risk in result.risks:
                st.warning(risk)

    # ---- Extraction de clauses ----
    elif analysis_mode == "🔍 Extraction de clauses":
        with st.spinner("Extraction des clauses en cours…"):
            analyzer = ContractAnalyzer()
            result = analyzer.analyze(document_text, filename=document_name)

        st.success(f"✅ {len(result.clauses)} clause(s) extraite(s) !")

        if result.clauses:
            clause_types = list({c.type for c in result.clauses})
            tabs = st.tabs([t.capitalize() for t in clause_types]) if len(clause_types) > 1 else [st.container()]

            if len(clause_types) > 1:
                for tab, ctype in zip(tabs, clause_types):
                    with tab:
                        for clause in result.clauses:
                            if clause.type == ctype:
                                st.markdown(
                                    f'<div class="clause-card">'
                                    f"Confiance : **{clause.confidence:.0%}**<br>"
                                    f"{clause.text}"
                                    f"</div>",
                                    unsafe_allow_html=True,
                                )
            else:
                for clause in result.clauses:
                    st.markdown(
                        f'<div class="clause-card">'
                        f"**[{clause.type.upper()}]** — Confiance : {clause.confidence:.0%}<br>"
                        f"{clause.text}"
                        f"</div>",
                        unsafe_allow_html=True,
                    )
        else:
            st.info("Aucune clause spécifique détectée dans ce document.")

    # ---- Prédiction d'issue ----
    else:
        with st.spinner("Analyse du dossier et prédiction en cours…"):
            predictor = CasePredictor()
            pred = predictor.predict(document_text)

        st.success("✅ Prédiction générée !")

        col1, col2, col3 = st.columns(3)
        col1.metric("Type d'affaire", pred.case_type)
        col2.metric("Probabilité de succès", f"{pred.success_probability:.0%}")
        col3.metric("Niveau de risque", pred.risk_level)

        st.markdown(f"### 🔮 Issue prédite : **{pred.predicted_outcome}**")

        # Barre de progression
        st.progress(pred.success_probability, text=f"Probabilité de succès : {pred.success_probability:.0%}")

        risk_colors = {"Faible": "risk-low", "Modéré": "risk-medium",
                       "Élevé": "risk-high", "Très élevé": "risk-high"}
        risk_class = risk_colors.get(pred.risk_level, "risk-medium")
        st.markdown(
            f'Confiance dans la prédiction : <strong>{pred.confidence:.0%}</strong> — '
            f'Risque : <span class="{risk_class}">{pred.risk_level}</span>',
            unsafe_allow_html=True,
        )

        if pred.key_factors:
            st.markdown("### 🔑 Facteurs déterminants")
            for factor in pred.key_factors:
                st.markdown(f"- {factor}")

        if pred.similar_precedents:
            st.markdown("### 📚 Précédents similaires")
            for prec in pred.similar_precedents:
                st.markdown(
                    f'<div class="clause-card">'
                    f"**{prec.get('citation', prec['id'])}** — {prec['subtype']}<br>"
                    f"Taux de succès historique : **{prec['success_rate']:.0%}**"
                    f"</div>",
                    unsafe_allow_html=True,
                )

        if pred.recommendations:
            st.markdown("### 💡 Recommandations")
            for rec in pred.recommendations:
                st.info(rec)

        st.warning(
            "⚠️ Ces prédictions sont indicatives et ne remplacent pas "
            "l'analyse d'un professionnel du droit qualifié."
        )
