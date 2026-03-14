#!/usr/bin/env python3
import io
import json
import sys
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen


def _read_bytes_from_url(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": "KostBranding/1.0"})
    with urlopen(req, timeout=10) as response:  # nosec B310
        return response.read()


def _load_source_image(config: dict, branding_dir: Path, default_logo: Path, image_module):
    source_type = str(config.get("sourceType") or "default")

    if source_type == "upload":
        ext = str(config.get("logoExt") or ".png")
        uploaded = branding_dir / f"source{ext}"
        if uploaded.exists():
            return image_module.open(uploaded).convert("RGBA")

    if source_type == "url":
        logo_url = str(config.get("logoUrl") or "").strip()
        parsed = urlparse(logo_url)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            data = _read_bytes_from_url(logo_url)
            return image_module.open(io.BytesIO(data)).convert("RGBA")

    return image_module.open(default_logo).convert("RGBA")


def _render_icon(base, size: int, background: str, padding_ratio: float, image_module):
    canvas = image_module.new("RGBA", (size, size), background)
    padding = int(size * padding_ratio)
    target = max(size - (padding * 2), 1)

    logo = base.copy()
    logo.thumbnail((target, target), image_module.Resampling.LANCZOS)

    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    return canvas


def main() -> int:
    if len(sys.argv) < 3:
        return 2

    branding_dir = Path(sys.argv[1])
    default_logo = Path(sys.argv[2])
    config_path = branding_dir / "config.json"
    generated_dir = branding_dir / "generated"
    generated_dir.mkdir(parents=True, exist_ok=True)

    try:
      from PIL import Image  # type: ignore
    except Exception:
      return 1

    config = json.loads(config_path.read_text(encoding="utf-8"))

    try:
        base = _load_source_image(config, branding_dir, default_logo, Image)
    except Exception:
        base = Image.open(default_logo).convert("RGBA")

    bg_color = str(config.get("appIconBackground") or "#0B1020")

    output_specs = [
        (32, "favicon-32.png", 0.18),
        (180, "apple-180.png", 0.18),
        (192, "pwa-192.png", 0.18),
        (512, "pwa-512.png", 0.18),
        (192, "pwa-192-maskable.png", 0.10),
        (512, "pwa-512-maskable.png", 0.10),
        (512, "preview-512.png", 0.18),
    ]

    for size, filename, padding in output_specs:
        icon = _render_icon(base, size, bg_color, padding, Image)
        icon.convert("RGB").save(generated_dir / filename, format="PNG")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
