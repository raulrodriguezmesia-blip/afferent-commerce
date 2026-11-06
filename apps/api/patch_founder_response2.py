from pathlib import Path

p = Path("app/services/ai_assistant.py")
s = p.read_text()
old = '''    def _founder_vision_answer(self) -> str:
        return (
            "## Product Vision\\n\\n"
            "Afferent Commerce is not just a demo of isolated components or scripts; it is the convergence "
            "between somatosensory physics and autonomous financial execution.\\n\\n"
            "Technical excellence (FastAPI/React monorepo, 50 Hz telemetry, and multimodal reasoning with "
            "NVIDIA Nemotron) only matters when it solves a critical real-world problem. By delegating the "
            "conditional payment decision in PayPal to the agent based on the physical quality of the product, "
            "we transform a complex quality inspection into a reliable, fraud-resistant commerce engine."
        )'''
new = '''    def _founder_vision_answer(self) -> str:
        return (
            "Every year millions of dollars move through B2B commerce before physical quality is verified.\\n\\n"
            "Afferent Commerce transforms real quality evidence into trusted financial execution.\\n\\n"
            "AI recommends. Humans approve. PayPal executes.\\n\\n"
            "The result: Less fraud. Less dispute. More trust."
        )'''
if old not in s:
    raise SystemExit("founder answer anchor not found")
s = s.replace(old, new, 1)

old_kw = '''        founder_keywords = (
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
            "why should this win",
        )'''
new_kw = '''        founder_keywords = (
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
            "why should this win",
        )'''
if old_kw not in s:
    raise SystemExit("keywords anchor not found")
s = s.replace(old_kw, new_kw, 1)
p.write_text(s, encoding="utf-8")
print("updated")
