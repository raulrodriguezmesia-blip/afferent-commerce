import re
from pathlib import Path

def normalize_class_value(value):
    tokens = value.split()
    groups = {}
    order = []
    for token in tokens:
        is_dark = token.startswith("dark:")
        core = token[5:] if is_dark else token
        parts = core.split(":")
        modifiers = parts[:-1]
        utility = parts[-1]
        prop = utility.split("-")[0]
        key = (is_dark, tuple(modifiers), prop)
        if key not in groups:
            groups[key] = token
            order.append(key)
        elif is_dark:
            groups[key] = token
    return " ".join(groups[key] for key in order)

text = 'bg-slate-50/90 dark:bg-slate-50 dark:bg-slate-50/90 dark:bg-slate-50 dark:bg-slate-950/80'
print(repr(normalize_class_value(text)))
