#!/usr/bin/env python3
"""Test structure API OpenAI 1.12.0"""

import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY', 'sk-test'))

print("\nStructure client.beta:")
print("-" * 50)
beta_attrs = [a for a in dir(client.beta) if not a.startswith('_')]
for attr in beta_attrs:
    obj = getattr(client.beta, attr)
    print(f"  {attr}: {type(obj)}")
    
    # Si c'est un objet avec des attributs, les afficher
    if hasattr(obj, '__dict__') or hasattr(obj, '__dir__'):
        sub_attrs = [a for a in dir(obj) if not a.startswith('_') and not a.startswith('with_')]
        if sub_attrs and len(sub_attrs) < 20:
            for sub in sub_attrs[:10]:
                print(f"    - {sub}")

print("\nStructure client (niveau racine):")
print("-" * 50)
root_attrs = [a for a in dir(client) if not a.startswith('_')]
for attr in root_attrs[:20]:
    print(f"  {attr}")
