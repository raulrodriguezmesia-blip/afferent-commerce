from pathlib import Path
p = Path("apps/api/app/services/ai_assistant.py")
s = p.read_text()
old = '''    def _fallback_answer(self, question: str) -> str:
        q = question.lower()
        if "revenue" in q or "ventas" in q:'''
new = '''    def _fallback_answer(self, question: str) -> str:
        q = question.lower()
        founder_keywords = (
            "vision",
            "especial",
            "proposito",
            "product founder",
            "que hace",
            "que es",
            "como funciona",
            "sistema",
            "proyecto",
            "affectent",
        )
        if any(keyword in q for keyword in founder_keywords):
            return self._founder_vision_answer()

        if "revenue" in q or "ventas" in q:'''
if old not in s:
    raise SystemExit("anchor not found")
s = s.replace(old, new, 1)
p.write_text(s)
print("updated")
