#!/usr/bin/env python3
"""Generate the Kadai Tracker app icons (simple ₹ on a brown tile). Needs Pillow + DejaVu Sans Bold.
   python3 tools/make-icons.py  ->  icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png"""
import os
from PIL import Image, ImageDraw, ImageFont

BROWN = (58, 36, 22, 255)
SAFFRON = (232, 140, 30, 255)
CREAM = (255, 244, 224, 255)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
os.makedirs(out, exist_ok=True)

def make(size, maskable):
    S = size * 4  # draw big, then downsample for smooth edges
    img = Image.new("RGBA", (S, S), BROWN if maskable else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if not maskable:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=BROWN)
    scale = 0.60 if maskable else 0.76          # maskable keeps content inside the 80% safe zone
    r = int(S * scale / 2)
    c = S // 2
    d.ellipse([c - r, c - r, c + r, c + r], fill=SAFFRON)
    f = ImageFont.truetype(FONT, int(r * 1.35))
    d.text((c, c), "\u20b9", font=f, fill=CREAM, anchor="mm")
    return img.resize((size, size), Image.LANCZOS).quantize(colors=48, method=Image.FASTOCTREE)  # small file: icons are inlined in the manifest

make(192, False).save(os.path.join(out, "icon-192.png"), optimize=True)
make(512, False).save(os.path.join(out, "icon-512.png"), optimize=True)
make(512, True).save(os.path.join(out, "icon-maskable-512.png"), optimize=True)
print("icons written to", os.path.abspath(out))
