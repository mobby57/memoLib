# Backend Schema - MemoLibDev
## Architecture des données
- **FastAPI** : Routes /transcribe, /talk, /speak, /workflow.
- **ChromaDB** : Vector store pour stocker l'historique des conversations et les documents lus.
- **Cache (SQLite/JSON)** : Stockage temporaire des sessions et des workflows en cours.
