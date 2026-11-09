# Application Flow - MemoLibDev
## Parcours pour l'utilisateur (Maman)
1. **Démarrage** : Lancement de l'interface Streamlit (gros boutons).
2. **Action** : L'utilisateur clique sur le bouton micro et parle.
3. **Traitement** : Whisper transcrit -> Le routeur d'intention analyse -> ChromaDB récupère le contexte -> Le LLM génère la réponse.
4. **Retour** : Kokoro synthétise la voix et l'interface la joue automatiquement.
