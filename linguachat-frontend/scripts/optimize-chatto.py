#!/usr/bin/env python3
"""
optimize-chatto.py — derive small, web-ready Chatto assets from the official
masters WITHOUT touching their design.

The six 1254x1254 RGBA PNG masters in src/assets/chatto are the canonical art and
stay in place as the source of truth. This script writes size-bucketed WebP (+
optimized PNG fallback) into src/assets/chatto/gen/, preserving transparency and
proportions. The UI loads only the small derivative it needs.

Buckets (px) are chosen from real display sizes (logos ~30-40px, mascots up to
128px) with retina headroom. Nothing is cropped, recolored or reshaped.

Run: python scripts/optimize-chatto.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "src", "assets", "chatto"))
GEN = os.path.join(SRC, "gen")

# label -> master filename
MOODS = {
    "official": "chatto-official.png",
    "welcome": "chatto-welcome.png",
    "celebrate": "chatto-celebrate.png",
    "thinking": "chatto-thinking.png",
    "supportive": "chatto-supportive.png",
    "calm": "chatto-calm.png",
}

# Display buckets. Covers up to ~42px @3x (128), ~104px @2.5x (256), 128px @3x (384).
SIZES = [128, 256, 384]
# Lossless WebP: the derivative is pixel-identical to the resized master, so there
# is zero perceptible (or measurable) difference at the display size, while still
# being ~40x smaller than the 1.8 MB PNG master. Fidelity is prioritized.
WEBP_LOSSLESS = True


def _composite(im, bg):
    base = Image.new("RGBA", im.size, bg + (255,))
    return Image.alpha_composite(base, im).convert("RGB")


def fidelity(master_rgba, size, webp_path):
    """Visible max/mean per-pixel difference (0 = identical). Compares the decoded
    WebP against the resized reference *as seen*, i.e. composited over both a dark
    and a light background — RGB in fully transparent regions is ignored because it
    is never visible."""
    ref = master_rgba.resize((size, size), Image.LANCZOS)
    dec = Image.open(webp_path).convert("RGBA")
    max_d = 0
    total = 0
    count = 0
    for bg in ((16, 20, 24), (248, 243, 234)):
        a = _composite(ref, bg).tobytes()
        b = _composite(dec, bg).tobytes()
        for i in range(len(a)):
            d = abs(a[i] - b[i])
            if d > max_d:
                max_d = d
            total += d
        count += len(a)
    return max_d, total / count


def main():
    os.makedirs(GEN, exist_ok=True)
    print(f"masters: {SRC}")
    print(f"output : {GEN}\n")
    rows = []
    for label, fname in MOODS.items():
        master_path = os.path.join(SRC, fname)
        master = Image.open(master_path).convert("RGBA")
        master_bytes = os.path.getsize(master_path)
        for size in SIZES:
            resized = master.resize((size, size), Image.LANCZOS)
            webp_path = os.path.join(GEN, f"chatto-{label}-{size}.webp")
            png_path = os.path.join(GEN, f"chatto-{label}-{size}.png")
            resized.save(webp_path, "WEBP", lossless=WEBP_LOSSLESS, method=6)
            resized.save(png_path, "PNG", optimize=True)
            wp = os.path.getsize(webp_path)
            pn = os.path.getsize(png_path)
            max_d, mean_d = fidelity(master, size, webp_path)
            rows.append((label, size, master_bytes, wp, pn, max_d, mean_d))
            print(f"  chatto-{label}-{size}: webp {wp/1024:6.1f} KB | png {pn/1024:6.1f} KB "
                  f"| fidelity max_diff={max_d} mean_diff={mean_d:.3f}")
    # summary
    total_master = sum({(r[0]): r[2] for r in rows}.values())
    total_webp = sum(r[3] for r in rows)
    print(f"\nmasters total (6): {total_master/1024/1024:.2f} MB")
    print(f"generated webp total (18): {total_webp/1024:.1f} KB")
    worst = max(r[5] for r in rows)
    print(f"worst-case max per-channel diff across all webp: {worst} (0-255 scale)")


if __name__ == "__main__":
    main()
