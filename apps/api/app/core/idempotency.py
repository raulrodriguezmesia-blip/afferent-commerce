import time
from typing import Any, Dict, Optional

_STORE: Dict[str, Dict[str, Any]] = {}
_TTL_SECONDS = 600  # 10 minutos


def get_idempotent(key: str) -> Optional[Dict[str, Any]]:
    if not key:
        return None
    entry = _STORE.get(key)
    if not entry:
        return None
    if time.time() - entry["ts"] > _TTL_SECONDS:
        _STORE.pop(key, None)
        return None
    return entry.get("response")


def set_idempotent(key: str, response: Dict[str, Any]) -> None:
    if not key:
        return
    _STORE[key] = {"ts": time.time(), "response": response}
