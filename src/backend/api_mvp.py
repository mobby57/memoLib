"""
API REST pour le MVP IA Poste Manager
======================================

Endpoints principaux :
- POST /api/v1/messages - Traiter un message entrant
- POST /api/v1/forms/{form_id} - Soumettre un formulaire
- GET /api/v1/workspaces/{workspace_id} - Récupérer un workspace
- GET /api/v1/health - Health check
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS
from security.middleware import get_security
from security.secrets_manager import get_secrets_manager

from src.backend.mvp_orchestrator import Channel, get_orchestrator

# Configuration
app = Flask(__name__)

# CORS sécurisé : restreint en production, permissif en dev
if os.environ.get("FLASK_ENV") == "production":
    allowed_origins = os.environ.get(
        "ALLOWED_ORIGINS", "https://memoLib.vercel.app"
    ).split(",")
    CORS(app, origins=allowed_origins, supports_credentials=True)
else:
    CORS(app)  # Permissif en développement

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Services
orchestrator = get_orchestrator()
security = get_security()
secrets_manager = get_secrets_manager()

# Initialisation au démarrage (Flask 3.0+)
_initialized = False


def ensure_initialized():
    """Initialise l'orchestrateur si nécessaire"""
    global _initialized
    if not _initialized:
        logger.info("🚀 Démarrage de l'API MVP...")
        # Note: On ne peut pas utiliser await ici, l'init sera fait de manière synchrone
        _initialized = True
        logger.info("✅ API prête")


@app.route("/api/v1/health", methods=["GET"])
def health_check():
    """Health check pour monitoring"""
    ensure_initialized()
    return (
        jsonify(
            {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0-mvp",
                "services": {
                    "orchestrator": orchestrator.is_initialized,
                    "security": True,
                },
            }
        ),
        200,
    )


@app.route("/api/v1/messages", methods=["POST"])
def process_message():
    """
    Traite un message entrant

    Body:
        {
            "content": "...",
            "subject": "...",
            "sender": "...",
            "channel": "email",
            "metadata": {...}
        }

    Returns:
        {
            "success": true,
            "workspace_id": "...",
            "result": {...}
        }
    """

    try:
        ensure_initialized()

        data = request.get_json()

        # Validation
        if not data or "content" not in data:
            return jsonify({"success": False, "error": "Content is required"}), 400

        # Sanitize inputs
        content = security.sanitize_input(data.get("content", ""))
        subject = security.sanitize_input(data.get("subject", ""))
        sender = security.sanitize_input(data.get("sender", ""))

        # Channel
        try:
            channel = Channel(data.get("channel", "email"))
        except ValueError:
            channel = Channel.EMAIL

        # Process (synchrone pour éviter les problèmes async dans Flask)
        import asyncio

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            orchestrator.process_incoming_message(
                content=content,
                subject=subject,
                sender=sender,
                channel=channel,
                attachments=data.get("attachments"),
                user_id=data.get("user_id"),
                metadata=data.get("metadata"),
            )
        )
        loop.close()

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/v1/forms/<form_id>", methods=["POST"])
def submit_form(form_id: str):
    """
    Soumet un formulaire

    Body:
        {
            "workspace_id": "...",
            "responses": {...}
        }
    """

    try:
        ensure_initialized()

        data = request.get_json()

        if not data or "workspace_id" not in data or "responses" not in data:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "workspace_id and responses are required",
                    }
                ),
                400,
            )

        workspace_id = data["workspace_id"]
        responses = data["responses"]
        user_id = data.get("user_id")

        # Submit (synchrone)
        import asyncio

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            orchestrator.submit_form_response(
                workspace_id=workspace_id,
                form_id=form_id,
                responses=responses,
                user_id=user_id,
            )
        )
        loop.close()

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logger.error(f"Error submitting form: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/v1/workspaces/<workspace_id>", methods=["GET"])
def get_workspace(workspace_id: str):
    """Récupère le statut d'un workspace"""

    try:
        ensure_initialized()
        result = orchestrator.get_workspace_status(workspace_id)
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error getting workspace: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/v1/channels", methods=["GET"])
def list_channels():
    """Liste les canaux supportés"""
    return jsonify({"channels": [channel.value for channel in Channel]}), 200


@app.errorhandler(404)
def not_found(error):
    """Handler 404"""
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handler 500"""
    logger.error(f"Internal error: {error}")
    return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    # Dev mode
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"

    logger.info(f"🚀 Démarrage sur port {port} (debug={debug})")

    app.run(host="0.0.0.0", port=port, debug=debug)
