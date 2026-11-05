from pathlib import Path
import re

p = Path("src/components/AfferentChatDrawer.tsx")
s = p.read_text()
pattern = re.compile(r"export const FOUNDER_VISION_RESPONSE = `.*?`;", re.S)
replacement = """export const FOUNDER_VISION_RESPONSE = `Afferent Commerce is not just a demo of isolated components or scripts; it is the convergence between somatosensory physics and autonomous financial execution.

As a Product Founder, the vision was clear: technical excellence (FastAPI/React monorepo, 50 Hz telemetry, and multimodal reasoning with NVIDIA Nemotron) only matters when it solves a critical real-world problem. By delegating the conditional payment decision in PayPal to the agent based on the physical quality of the product, we transform a complex quality inspection into a reliable, fraud-resistant commerce engine.`;"""
s2, count = pattern.subn(replacement, s, count=1)
if count != 1:
    raise SystemExit(f"replacement count={count}")
p.write_text(s2, encoding="utf-8")
print("updated")
