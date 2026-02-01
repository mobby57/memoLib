import json
import os
from typing import Any, Dict, List


class _RedisLangCache:
    def __init__(self):
        self.enabled = bool(os.environ.get("REDIS_URL"))
        self._store: List[Dict[str, Any]] = []

    def set(self, prompt: str, response: str) -> bool:
        try:
            self._store.append({"prompt": prompt, "response": response})
            return True
        except Exception:
            return False

    def search(
        self, prompt: str, similarity_threshold: float = 0.8
    ) -> List[Dict[str, Any]]:
        # naive similarity: presence of common words
        def similarity(a: str, b: str) -> float:
            sa = set(a.lower().split())
            sb = set(b.lower().split())
            inter = len(sa & sb)
            union = len(sa | sb) or 1
            return inter / union

        results = []
        for item in self._store:
            sim = similarity(prompt, item["prompt"])
            if sim >= similarity_threshold:
                results.append({**item, "similarity": sim})
        results.sort(key=lambda r: r["similarity"], reverse=True)
        return results


redis_langcache = _RedisLangCache()
