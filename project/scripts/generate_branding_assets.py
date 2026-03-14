#!/usr/bin/env python3
import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 3:
        return 2

    branding_dir = Path(sys.argv[1])
    default_logo = Path(sys.argv[2])
    config_path = branding_dir / "config.json"
    generated_dir = branding_dir / "generated"
    generated_dir.mkdir(parents=True, exist_ok=True)

    config = json.loads(config_path.read_text(encoding="utf-8"))

    source = default_logo
    if config.get("sourceType") == "upload":
        ext = config.get("logoExt", ".png")
        uploaded = branding_dir / f"source{ext}"
        if uploaded.exists():
            source = uploaded

    try:
        from PIL import Image  # type: ignore
    except Exception:
        return 1

    base = Image.open(source).convert("RGBA")
    bg_color = config.get("appIconBackground", "#0B1020")

    def render(size: int, name: str) -> None:
        canvas = Image.new("RGBA", (size, size), bg_color)
        padding = int(size * 0.18)
        target = size - (padding * 2)
        logo = base.copy()
        logo.thumbnail((target, target), Image.Resampling.LANCZOS)
        x = (size - logo.width) // 2
        y = (size - logo.height) // 2
        canvas.alpha_composite(logo, (x, y))
        canvas.convert("RGB").save(generated_dir / name, format="PNG")

    render(32, "favicon-32.png")
    render(180, "apple-180.png")
    render(192, "pwa-192.png")
    render(512, "pwa-512.png")
    render(512, "preview-512.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
