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


def _hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = (value or "").strip().lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    if len(value) != 6:
        return (11, 16, 32)
    try:
        return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))
    except ValueError:
        return (11, 16, 32)


def _distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def _strip_background_if_embedded_icon(image, configured_bg: tuple[int, int, int], image_module):
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()

    corners = [
        pixels[0, 0],
        pixels[width - 1, 0],
        pixels[0, height - 1],
        pixels[width - 1, height - 1],
    ]
    corner_rgb = [(r, g, b) for (r, g, b, a) in corners if a > 245]
    if len(corner_rgb) < 3:
        return rgba

    avg_corner = (
        sum(rgb[0] for rgb in corner_rgb) // len(corner_rgb),
        sum(rgb[1] for rgb in corner_rgb) // len(corner_rgb),
        sum(rgb[2] for rgb in corner_rgb) // len(corner_rgb),
    )

    # Only key out background when corners match configured icon background closely.
    if _distance(avg_corner, configured_bg) > 45:
        return rgba

    keyed = rgba.copy()
    keyed_pixels = keyed.load()
    bg_like = 0
    total = width * height

    for y in range(height):
        for x in range(width):
            r, g, b, a = keyed_pixels[x, y]
            if a < 32:
                continue
            if _distance((r, g, b), avg_corner) <= 42:
                keyed_pixels[x, y] = (r, g, b, 0)
                bg_like += 1

    # If almost nothing was keyed, keep original to avoid damaging valid logos.
    if bg_like < total * 0.12:
        return rgba

    # Ensure something visible remains.
    alpha = keyed.split()[-1]
    if alpha.getbbox() is None:
        return rgba

    return keyed


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


def _assert_icon_contains_logo(icon, bg: tuple[int, int, int]):
    rgb = icon.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    non_bg = 0
    total = width * height

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if _distance((r, g, b), bg) > 24:
                non_bg += 1

    if non_bg < total * 0.01:
        raise RuntimeError("Generated icon appears to contain background only")


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
    bg_color = str(config.get("appIconBackground") or "#0B1020")
    bg_rgb = _hex_to_rgb(bg_color)

    try:
        loaded = _load_source_image(config, branding_dir, default_logo, Image)
        base = _strip_background_if_embedded_icon(loaded, bg_rgb, Image)
    except Exception:
        base = Image.open(default_logo).convert("RGBA")
        base = _strip_background_if_embedded_icon(base, bg_rgb, Image)

    output_specs = [
        (16, "favicon-16.png", 0.18),
        (32, "favicon-32.png", 0.18),
        (180, "apple-touch-icon.png", 0.18),
        (180, "apple-180.png", 0.18),
        (192, "icon-192.png", 0.18),
        (512, "icon-512.png", 0.18),
        (192, "icon-192-maskable.png", 0.10),
        (512, "icon-512-maskable.png", 0.10),
        (192, "pwa-192.png", 0.18),
        (512, "pwa-512.png", 0.18),
        (192, "pwa-192-maskable.png", 0.10),
        (512, "pwa-512-maskable.png", 0.10),
        (512, "preview-512.png", 0.18),
    ]

    try:
        for size, filename, padding in output_specs:
            icon = _render_icon(base, size, bg_color, padding, Image)
            _assert_icon_contains_logo(icon, bg_rgb)
            icon.convert("RGB").save(generated_dir / filename, format="PNG")
    except Exception:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
