import json
import os
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "https://memolib.fr"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    },
)

# Configuration
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

ROOT_DIR = Path(__file__).resolve().parents[1]
PACKAGE_JSON = ROOT_DIR / "package.json"


def get_app_version():
    try:
        with open(PACKAGE_JSON, "r", encoding="utf-8") as f:
            pkg = json.load(f)
        return pkg.get("version", "unknown")
    except Exception:
        return "unknown"


def get_build_commit():
    return os.getenv("BUILD_COMMIT", "") or os.getenv("VERCEL_GIT_COMMIT_SHA", "")


@app.after_request
def add_version_headers(response):
    response.headers["X-App-Version"] = get_app_version()
    commit = get_build_commit()
    if commit:
        response.headers["X-Build-Commit"] = commit
    return response


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================


@app.route("/", methods=["GET"])
def index():
    """Root health check endpoint"""
    return jsonify(
        {
            "status": "OK",
            "service": "MemoLib Backend",
            "version": get_app_version(),
            "commit": get_build_commit() or None,
            "timestamp": datetime.now().isoformat(),
            "features": [
                "CESEDA AI predictions",
                "Legal deadline management",
                "Billing & invoicing",
                "Document generation",
                "Email & SMS integration",
            ],
        }
    )


@app.route("/api/health", methods=["GET"])
def health_check():
    """API health check endpoint"""
    return jsonify(
        {
            "healthy": True,
            "service": "memolib-api",
            "timestamp": datetime.now().isoformat(),
        }
    )


# ============================================================================


def load_data(filename):
    try:
        with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


def save_data(filename, data):
    with open(DATA_DIR / filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# Authentication API
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    # Simple auth for demo
    if username == "admin" and password == "admin123":
        return jsonify(
            {"success": True, "user": {"username": username, "role": "admin"}}
        )

    return jsonify({"success": False}), 401


# CESEDA AI Prediction API
@app.route("/api/ceseda/predict", methods=["POST"])
def predict_ceseda():
    data = request.get_json()

    # Simulate AI prediction
    factors = ["famille", "emploi", "intégration", "français"]
    positive_count = sum(1 for factor in factors if factor in str(data).lower())

    success_rate = min(95, 60 + (positive_count * 8))

    return jsonify(
        {
            "success_rate": success_rate,
            "confidence": 87,
            "factors": factors[:positive_count],
            "recommendations": [
                "Constituer un dossier complet",
                "Mettre en avant l'intégration",
                "Consulter un avocat spécialisé",
            ],
        }
    )


@app.route("/api/ceseda/analyze", methods=["POST"])
def analyze_ceseda():
    data = request.get_json()
    text = data.get("text", "")

    # Analyze text for legal factors
    urgent_keywords = ["oqtf", "expulsion", "urgence"]
    positive_keywords = [
        "famille",
        "enfant",
        "français",
        "emploi",
        "mariage",
        "intégration",
    ]

    is_urgent = any(keyword in text.lower() for keyword in urgent_keywords)
    positive_factors = sum(
        1 for keyword in positive_keywords if keyword in text.lower()
    )

    success_rate = (
        35 + (positive_factors * 5) if is_urgent else 75 + (positive_factors * 3)
    )
    success_rate = min(95, max(10, success_rate))

    return jsonify(
        {
            "success_rate": success_rate,
            "urgency": "ÉLEVÉE" if is_urgent else "NORMALE",
            "positive_factors": positive_factors,
            "recommendations": [
                "Constituer un dossier complet avec justificatifs",
                "Mettre en avant les éléments d'intégration",
                "Consulter un avocat spécialisé CESEDA",
            ],
            "analysis": f"Analyse basée sur {positive_factors} facteurs positifs détectés",
        }
    )


# Deadlines Management API
@app.route("/api/legal/delais/calculer", methods=["POST"])
def calculate_deadline():
    data = request.get_json()
    start_date = datetime.fromisoformat(
        data.get("start_date", datetime.now().isoformat())
    )
    deadline_type = data.get("type", "recours")

    # Calculate deadline based on type
    days_map = {"recours": 30, "appel": 15, "cassation": 60, "référé": 7}

    days = days_map.get(deadline_type, 30)
    deadline = start_date + timedelta(days=days)

    return jsonify(
        {
            "deadline": deadline.isoformat(),
            "days": days,
            "type": deadline_type,
            "urgency": "critique" if days <= 7 else "normal",
        }
    )


@app.route("/api/legal/delais/a-venir", methods=["GET"])
def upcoming_deadlines():
    # Mock upcoming deadlines
    deadlines = [
        {
            "id": 1,
            "description": "Recours OQTF - Client Dupont",
            "date": (datetime.now() + timedelta(days=5)).isoformat(),
            "urgency": "critique",
        },
        {
            "id": 2,
            "description": "Appel TA - Dossier Martin",
            "date": (datetime.now() + timedelta(days=12)).isoformat(),
            "urgency": "important",
        },
    ]

    return jsonify({"deadlines": deadlines})


@app.route("/api/legal/delais/urgents", methods=["GET"])
def urgent_deadlines():
    # Mock urgent deadlines
    urgent = [
        {
            "description": "URGENT: Recours OQTF expire dans 3 jours",
            "date": (datetime.now() + timedelta(days=3)).strftime("%d/%m/%Y"),
            "client": "M. Dupont",
        }
    ]

    return jsonify({"urgent_deadlines": urgent})


# Billing Management API
@app.route("/api/legal/facturation/facture", methods=["POST"])
def generate_invoice():
    data = request.get_json()

    invoice = {
        "numero": f"FAC-{datetime.now().year}-{len(load_data('invoices.json')) + 1:03d}",
        "client": data.get("client", "Client"),
        "montant_ht": data.get("amount", 1500),
        "tva": data.get("amount", 1500) * 0.2,
        "montant_ttc": data.get("amount", 1500) * 1.2,
        "date": datetime.now().isoformat(),
        "statut": "générée",
    }

    # Save invoice
    invoices = load_data("invoices.json")
    invoices.append(invoice)
    save_data("invoices.json", invoices)

    return jsonify(invoice)


@app.route("/api/legal/facturation/stats", methods=["GET"])
def billing_stats():
    invoices = load_data("invoices.json")

    total_ht = sum(inv.get("montant_ht", 0) for inv in invoices)
    monthly_ht = sum(
        inv.get("montant_ht", 0)
        for inv in invoices
        if datetime.fromisoformat(inv["date"]).month == datetime.now().month
    )

    return jsonify(
        {
            "total_ca": total_ht,
            "ca_mensuel": monthly_ht,
            "factures_total": len(invoices),
            "factures_en_cours": len(
                [inv for inv in invoices if inv.get("statut") == "générée"]
            ),
        }
    )


# Compliance Management API
@app.route("/api/legal/conformite/dossier", methods=["POST"])
def create_dossier():
    data = request.get_json()

    dossier = {
        "numero": f"{datetime.now().year}-{len(load_data('dossiers.json')) + 1:03d}",
        "client": data.get("client", "Client"),
        "type": data.get("type", "ceseda"),
        "date_creation": datetime.now().isoformat(),
        "statut": "actif",
        "rgpd_compliant": True,
    }

    # Save dossier
    dossiers = load_data("dossiers.json")
    dossiers.append(dossier)
    save_data("dossiers.json", dossiers)

    return jsonify(dossier)


@app.route("/api/legal/conformite/registre", methods=["GET"])
def get_registre():
    dossiers = load_data("dossiers.json")

    return jsonify(
        {
            "dossiers": dossiers,
            "total": len(dossiers),
            "conformes": len([d for d in dossiers if d.get("rgpd_compliant")]),
        }
    )


# Document Generation API
@app.route("/api/legal/templates/generate", methods=["POST"])
def generate_document():
    data = request.get_json()
    template = data.get("template", "assignation")

    document = {
        "id": f"DOC-{datetime.now().strftime('%Y%m%d')}-{len(load_data('documents.json')) + 1:03d}",
        "template": template,
        "client": data.get("client_data", "Client"),
        "date_generation": datetime.now().isoformat(),
        "statut": "généré",
        "url": f"/documents/{template}_{datetime.now().strftime('%Y%m%d')}.pdf",
    }

    # Save document record
    documents = load_data("documents.json")
    documents.append(document)
    save_data("documents.json", documents)

    return jsonify(document)


@app.route("/api/legal/templates/list", methods=["GET"])
def list_templates():
    templates = [
        {"id": "assignation", "name": "Assignation en référé", "category": "procédure"},
        {"id": "requete", "name": "Requête", "category": "procédure"},
        {"id": "med", "name": "Mise en demeure", "category": "recouvrement"},
        {"id": "conclusions", "name": "Conclusions", "category": "procédure"},
    ]

    return jsonify({"templates": templates})


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    print("🐍 Python Backend API running on port 5000")
    print("🔗 Endpoints available:")
    print("  - POST /api/auth/login")
    print("  - POST /api/ceseda/predict")
    print("  - POST /api/ceseda/analyze")
    print("  - GET  /api/legal/delais/a-venir")
    print("  - POST /api/legal/facturation/facture")
    print("  - GET  /api/legal/facturation/stats")
    print("  - POST /api/legal/conformite/dossier")
    print("  - POST /api/legal/templates/generate")

    app.run(host="0.0.0.0", port=5000, debug=False)
