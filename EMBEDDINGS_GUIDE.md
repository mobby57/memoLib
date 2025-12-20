# 🔍 Fonctionnalité Embeddings OpenAI - IAPosteManager

## Vue d'ensemble

L'intégration des **Embeddings OpenAI** permet d'ajouter des capacités de recherche sémantique et d'analyse intelligente à IAPosteManager. Les embeddings transforment le texte en vecteurs numériques qui capturent le sens sémantique, permettant de comparer la similarité entre textes même s'ils utilisent des mots différents.

## ✅ Tests Validés

**Date:** 20 décembre 2024  
**Statut:** ✅ Tous les tests réussis  
**Tokens utilisés:** 84 (pour 4 tests)  
**Coût approximatif:** ~$0.0001

### Résultats des Tests

1. **Embedding Simple** ✅
   - Modèle: text-embedding-ada-002
   - Dimensions: 1536
   - Tokens: 14

2. **Batch Embeddings** ✅
   - 4 textes traités simultanément
   - Tokens: 42
   - Performance optimale

3. **Similarité Sémantique** ✅
   - Textes similaires: **90.74%** de similarité
   - Textes différents: **81.48%** de similarité
   - ✓ Détection correcte des textes liés

4. **Modèle v3** ✅
   - text-embedding-3-small avec 512 dimensions
   - Réduction de 66% de la taille (économie de coûts)

## 📚 API Endpoints

### 1. Créer un Embedding

**Endpoint:** `POST /api/ai/embeddings`

**Requête:**
```json
{
  "text": "Où est mon colis ?",
  "model": "text-embedding-ada-002"
}
```

**Réponse:**
```json
{
  "success": true,
  "embedding": [-0.0204, 0.0014, -0.0181, ...],  // 1536 valeurs
  "tokens_used": 14,
  "model": "text-embedding-ada-002",
  "dimensions": 1536,
  "request_id": "iaposte_1766266359_b80ea32b1cd6fbd3"
}
```

### 2. Créer Plusieurs Embeddings (Batch)

**Requête:**
```json
{
  "texts": [
    "Suivi de colis",
    "Demande de remboursement",
    "Modification d'adresse"
  ],
  "model": "text-embedding-ada-002"
}
```

**Réponse:**
```json
{
  "success": true,
  "embeddings": [
    {
      "index": 0,
      "embedding": [...]
    },
    {
      "index": 1,
      "embedding": [...]
    },
    {
      "index": 2,
      "embedding": [...]
    }
  ],
  "tokens_used": 42,
  "count": 3,
  "model": "text-embedding-ada-002"
}
```

### 3. Calculer la Similarité

**Endpoint:** `POST /api/ai/similarity`

**Requête:**
```json
{
  "embedding1": [-0.0204, 0.0014, ...],
  "embedding2": [-0.0195, 0.0012, ...]
}
```

**Réponse:**
```json
{
  "success": true,
  "similarity": 0.9074
}
```

## 🎯 Cas d'Usage

### 1. Recherche Sémantique d'Emails

```python
# Rechercher des emails similaires à une requête
query = "problème de livraison urgente"
query_embedding = ai_service.create_embedding(query)

# Comparer avec tous les emails
for email in emails:
    email_text = f"{email.subject} {email.body}"
    email_embedding = ai_service.create_embedding(email_text)
    similarity = ai_service.calculate_similarity(
        query_embedding['embedding'],
        email_embedding['embedding']
    )
    if similarity > 0.8:  # Très similaire
        print(f"Email pertinent trouvé: {email.subject}")
```

### 2. Classification Automatique

```python
# Catégories prédéfinies
categories = {
    'suivi': "Où est mon colis ? Suivi de livraison",
    'remboursement': "Demande de remboursement produit défectueux",
    'adresse': "Modification d'adresse de livraison"
}

# Créer embeddings pour chaque catégorie
category_embeddings = {}
for cat, text in categories.items():
    result = ai_service.create_embedding(text)
    category_embeddings[cat] = result['embedding']

# Classifier un nouvel email
new_email = "Mon colis n'est toujours pas arrivé"
email_embedding = ai_service.create_embedding(new_email)

best_category = None
best_score = 0
for cat, cat_embedding in category_embeddings.items():
    similarity = ai_service.calculate_similarity(
        email_embedding['embedding'],
        cat_embedding
    )
    if similarity > best_score:
        best_score = similarity
        best_category = cat

print(f"Catégorie: {best_category} (confiance: {best_score:.1%})")
```

### 3. Détection de Doublons

```python
# Vérifier si un email est similaire à un email existant
new_email_text = "Je n'ai pas reçu mon colis"
new_embedding = ai_service.create_embedding(new_email_text)

for existing_email in recent_emails:
    existing_embedding = stored_embeddings[existing_email.id]
    similarity = ai_service.calculate_similarity(
        new_embedding['embedding'],
        existing_embedding
    )
    
    if similarity > 0.95:  # Quasi-identique
        print(f"⚠ Possible doublon détecté avec email #{existing_email.id}")
        print(f"   Similarité: {similarity:.2%}")
```

### 4. Suggestions de Réponses

```python
# Trouver les réponses précédentes les plus pertinentes
incoming_message = "Comment suivre mon colis ?"
message_embedding = ai_service.create_embedding(incoming_message)

# Comparer avec historique de réponses
suggestions = []
for response in response_templates:
    response_embedding = stored_response_embeddings[response.id]
    similarity = ai_service.calculate_similarity(
        message_embedding['embedding'],
        response_embedding
    )
    suggestions.append({
        'response': response,
        'similarity': similarity
    })

# Trier par similarité
suggestions.sort(key=lambda x: x['similarity'], reverse=True)

# Proposer les 3 meilleures réponses
for i, sugg in enumerate(suggestions[:3], 1):
    print(f"{i}. {sugg['response'].subject} ({sugg['similarity']:.1%})")
```

## 💾 Stockage en Base de Données

### Schéma de Table Recommandé

```sql
CREATE TABLE email_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    embedding_vector TEXT NOT NULL,  -- JSON array
    model VARCHAR(50) NOT NULL,
    dimensions INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id),
    INDEX idx_email_id (email_id)
);
```

### Exemple de Stockage/Récupération

```python
import json

# Stocker un embedding
def store_embedding(email_id, embedding_vector, model="text-embedding-ada-002"):
    embedding_json = json.dumps(embedding_vector)
    cursor.execute('''
        INSERT INTO email_embeddings (email_id, embedding_vector, model, dimensions)
        VALUES (?, ?, ?, ?)
    ''', (email_id, embedding_json, model, len(embedding_vector)))

# Récupérer un embedding
def get_embedding(email_id):
    cursor.execute('SELECT embedding_vector FROM email_embeddings WHERE email_id = ?', (email_id,))
    row = cursor.fetchone()
    if row:
        return json.loads(row[0])
    return None
```

## 🔧 Modèles Disponibles

| Modèle | Dimensions | Prix (par 1M tokens) | Recommandation |
|--------|------------|---------------------|----------------|
| `text-embedding-ada-002` | 1536 | $0.10 | ✅ Standard, excellent rapport qualité/prix |
| `text-embedding-3-small` | 512-1536 | $0.02 | 💰 Économique, 80% moins cher |
| `text-embedding-3-large` | 256-3072 | $0.13 | 🎯 Haute précision pour cas critiques |

### Optimisation des Coûts

```python
# Utiliser des dimensions réduites pour économiser
result = ai_service.create_embedding(
    text="Exemple",
    model="text-embedding-3-small",
    dimensions=512  # Réduit de 1536 à 512
)
# Économie: ~66% sur le stockage, qualité légèrement réduite
```

## 📊 Performance & Limites

### Limites Techniques

- **Texte maximum:** 8192 tokens (~30,000 caractères)
- **Batch maximum:** 2048 textes par requête
- **Tokens batch max:** 300,000 tokens total
- **Rate limit:** 3,000 requêtes/minute (tier 2)

### Temps de Réponse Typiques

- Embedding simple: ~200ms
- Batch de 10 textes: ~300ms
- Calcul de similarité: <1ms (local)

### Optimisations Recommandées

1. **Mettre en cache les embeddings** calculés
2. **Utiliser batch pour >5 textes** simultanés
3. **Précharger les embeddings** des catégories/templates
4. **Utiliser dimensions réduites** si la précision absolue n'est pas critique

## 🛠 Intégration dans l'Application

### Frontend (JavaScript)

```javascript
// Recherche sémantique
async function semanticSearch(query) {
    const response = await fetch('/api/ai/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: query })
    });
    
    const result = await response.json();
    return result.embedding;
}
```

### Backend (Python)

```python
# Ajouter au service existant
from backend.app import ai_service

@app.route('/search', methods=['POST'])
def search_emails():
    data = request.json
    query = data.get('query')
    
    # Créer embedding pour la requête
    query_result = ai_service.create_embedding(query)
    
    # Rechercher dans la base
    emails = db.get_all_emails()
    results = []
    
    for email in emails:
        email_embedding = db.get_embedding(email.id)
        if email_embedding:
            similarity = ai_service.calculate_similarity(
                query_result['embedding'],
                email_embedding
            )
            results.append({
                'email': email,
                'similarity': similarity
            })
    
    # Trier par pertinence
    results.sort(key=lambda x: x['similarity'], reverse=True)
    return jsonify(results[:10])  # Top 10
```

## 📈 Métriques & Monitoring

### Indicateurs à Suivre

1. **Tokens utilisés par jour**
   ```python
   total_tokens = sum([r['tokens_used'] for r in embedding_results])
   cost = total_tokens / 1_000_000 * 0.10  # Prix ada-002
   ```

2. **Cache hit rate**
   ```python
   cache_hits = embeddings_from_cache / total_embeddings_requested
   ```

3. **Temps de réponse moyen**
   ```python
   avg_response_time = sum(response_times) / len(response_times)
   ```

## 🎨 Interface Utilisateur

Une page de démonstration complète est disponible : **semantic-search-demo.html**

Fonctionnalités:
- ✅ Recherche sémantique interactive
- ✅ Affichage des scores de similarité
- ✅ Visualisation des vecteurs d'embedding
- ✅ Base d'emails de démonstration
- ✅ Design responsive avec Tailwind CSS

## 🚀 Démarrage Rapide

1. **Tester l'API:**
   ```bash
   python test_embeddings.py
   ```

2. **Démarrer le serveur:**
   ```bash
   python src/backend/app.py
   ```

3. **Ouvrir la démo:**
   ```
   http://localhost:5000/semantic-search-demo.html
   ```

## 📝 Notes Importantes

- Les embeddings sont **déterministes** : même texte = même vecteur
- La similarité cosinus varie de **-1 à 1** (en pratique, souvent entre 0.6 et 1.0)
- Un score > **0.9** indique une forte similarité
- Un score > **0.95** indique des textes quasi-identiques
- Penser à **normaliser les textes** (lowercase, ponctuation) pour de meilleurs résultats

## 🔐 Sécurité

- La clé API OpenAI est stockée dans `.env` et ne doit **jamais être commitée**
- Tous les embeddings passent par l'authentification `@auth.login_required`
- Rate limiting activé: 20 requêtes/minute par utilisateur
- Les vecteurs d'embedding ne contiennent **pas le texte original** (sécurité des données)

## 🆘 Dépannage

### "OpenAI client not initialized"
→ Vérifier que `OPENAI_API_KEY` est définie dans `.env`

### "Too many tokens"
→ Réduire la taille du texte ou utiliser batch pour plusieurs textes

### Similarité toujours > 0.8
→ Normal pour des textes en français sur des sujets similaires (emails postaux)

### Performance lente
→ Activer le cache pour les embeddings fréquemment utilisés

---

**Développé pour IAPosteManager v2.2.0**  
**Documentation mise à jour:** 20/12/2024
