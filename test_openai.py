#!/usr/bin/env python3
"""Test rapide de la clé OpenAI"""

import os
from dotenv import load_dotenv

load_dotenv()

openai_key = os.getenv('OPENAI_API_KEY')

print(f"🔑 Clé OpenAI: {openai_key[:20]}..." if openai_key else "❌ Pas de clé")
print(f"✅ Format valide: {'Oui' if openai_key and openai_key.startswith('sk-') else 'Non'}")

if openai_key and openai_key.startswith('sk-'):
    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        
        print("\n🧪 Test de génération...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Dis simplement 'Connexion réussie'"}],
            max_tokens=10
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCÈS: {result}")
        print(f"\n💰 Tokens utilisés: {response.usage.total_tokens}")
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
else:
    print("\n⚠️ Configurez votre clé OpenAI dans .env")
    print("Format: OPENAI_API_KEY=sk-proj-...")
