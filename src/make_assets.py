"""Builds the site's binary assets into docs/: subset web fonts, app screenshots, icons and the social preview image.

Run with a Python that has fonttools, brotli and pillow:  python src/make_assets.py
Sources: the app repo (../dailybible) for fonts and screenshots; the glyph matches brand/redes in Bible-film.
"""
from pathlib import Path

from fontTools import subset
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT.parent / "dailybible"
OUT = ROOT / "docs"
FONTS = APP / "node_modules/@expo-google-fonts"
SCREENS = APP / "build-output/screens/owner-2026-11-05-vc15"

NAVY, GOLD, CREAM = (31, 58, 95), (214, 168, 64), (250, 246, 238)
# Latin, Latin-1, Latin Extended-A (pl, ro), general punctuation, euro sign.
UNICODES = "U+0000-00FF,U+0100-017F,U+0218-021B,U+2000-206F,U+20AC,U+2122,U+2190-2193"


def fonts():
    (OUT / "fonts").mkdir(parents=True, exist_ok=True)
    for family, weight in [("literata", "400Regular"), ("literata", "600SemiBold"),
                           ("literata", "400Regular_Italic"), ("inter", "400Regular"),
                           ("inter", "500Medium"), ("inter", "600SemiBold")]:
        name = f"{family.capitalize()}_{weight}"
        src = FONTS / family / weight / f"{name}.ttf"
        dst = OUT / "fonts" / f"{family}-{weight.lower().replace('_', '-')}.woff2"
        subset.main([str(src), f"--unicodes={UNICODES}", "--flavor=woff2", "--layout-features=*",
                     f"--output-file={dst}"])


def glyph(d, x0, y0, size, bg=NAVY):
    """The app icon glyph (1024-unit design) drawn at (x0, y0) with the given size."""
    k = size / 1024
    p = lambda pts: [(x0 + x * k, y0 + y * k) for x, y in pts]
    cx, cy, r = x0 + 512 * k, y0 + 445 * k, 181 * k
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLD)
    d.polygon(p([(135, 528), (507, 577), (507, 805), (135, 774)]), fill=CREAM)
    d.polygon(p([(519, 577), (889, 528), (889, 774), (519, 805)]), fill=CREAM)


def icons():
    for size, name in [(180, "apple-touch-icon.png"), (512, "icon-512.png"), (192, "icon-192.png")]:
        img = Image.new("RGB", (size, size), NAVY)
        glyph(ImageDraw.Draw(img), 0, 0, size)
        img.save(OUT / name, optimize=True)
    img = Image.new("RGB", (48, 48), NAVY)
    glyph(ImageDraw.Draw(img), 0, 0, 48)
    img.save(OUT / "favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)])


def og(lang, tagline):
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(img)
    glyph(d, 70, 95, 300)
    serif = FONTS / "literata/600SemiBold/Literata_600SemiBold.ttf"
    sans = FONTS / "inter/400Regular/Inter_400Regular.ttf"
    d.text((420, 190), "Biblive", font=ImageFont.truetype(str(serif), 112), fill=CREAM, anchor="ls")
    f = ImageFont.truetype(str(sans), 40)
    y = 270
    line = ""
    for word in tagline.split():  # wrap to the text column
        test = f"{line} {word}".strip()
        if d.textlength(test, font=f) > 700:
            d.text((420, y), line, font=f, fill=(233, 196, 106)); y += 56; line = word
        else:
            line = test
    d.text((420, y), line, font=f, fill=(233, 196, 106))
    d.text((420, 540), "biblive.app", font=ImageFont.truetype(str(sans), 30), fill=(169, 177, 192))
    img.save(OUT / "img" / f"og-{lang}.png", optimize=True)


def screens():
    (OUT / "img").mkdir(parents=True, exist_ok=True)
    for src, name in [("owner-bible-03-home.png", "app-hoy"), ("owner-bible-02-audio.png", "app-escuchar")]:
        im = Image.open(SCREENS / src).convert("RGB")
        im = im.crop((0, 150, 1080, 2330))  # drop the status bar and the gesture bar
        for wd in (360, 720):
            im.resize((wd, round(im.height * wd / im.width)), Image.LANCZOS).save(
                OUT / "img" / f"{name}-{wd}.webp", quality=82, method=6)
    # The film still on the home card, for the "Ver" feature.
    still = Image.open(SCREENS / "owner-bible-03-home.png").convert("RGB").crop((56, 366, 1026, 912))
    for wd in (480, 960):
        still.resize((wd, round(still.height * wd / still.width)), Image.LANCZOS).save(
            OUT / "img" / f"pasaje-{wd}.webp", quality=80, method=6)


if __name__ == "__main__":
    fonts()
    (OUT / "img").mkdir(parents=True, exist_ok=True)
    icons()
    og("es", "La Biblia, palabra por palabra, un pasaje cada día.")
    og("en", "The Bible, word for word, one passage every day.")
    screens()
    print("assets ok")
