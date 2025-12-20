#!/usr/bin/env python3
"""Test avec de vrais emails"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from src.backend.app import app, UnifiedAIService

ai_service = UnifiedAIService(os.environ.get('OPENAI_API_KEY'))

# 1. Test emails réels
real_emails = [
    "Bonjour, je souhaite annuler ma commande #12345. Cordialement",
    "URGENT: Problème de livraison, contactez-moi rapidement!",
    "Merci pour votre service, très satisfait de mon achat."
]

print("🧪 TEST EMAILS RÉELS")
for i, email in enumerate(real_emails, 1):
    result = ai_service.generate_email(email, 'professionnel')
    print(f"\n{i}. Email: {email[:50]}...")
    print(f"   Réponse: {result['subject']}")
    print(f"   Corps: {result['body'][:100]}...")