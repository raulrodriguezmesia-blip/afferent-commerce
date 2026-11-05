from pathlib import Path
p = Path("app/services/ai_assistant.py")
s = p.read_text()
old = '''        founder_keywords = (
            "vision",
            "special",
            "purpose",
            "product founder",
            "what does",
            "what is",
            "how does",
            "system",
            "project",
            "afferent",
        )'''
new = '''        founder_keywords = (
            "vision",
            "special",
            "purpose",
            "product founder",
            "what does",
            "what is",
            "how does",
            "system",
            "project",
            "afferent",
            "que es",
            "como funciona",
            "que hace",
            "especial",
        )'''
if old not in s:
    raise SystemExit("anchor not found")
s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
print("updated")
