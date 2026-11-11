"""Builds the site's pictures and js/data.js.

    uv run --with pillow tools/build.py                                  # data.js only
    uv run --with pillow tools/build.py --src ~/scratch/kone-research    # pictures too

The originals (profile pictures, posts, cover art) are not kept in this repo.
With --src the covers in data/catalog.json and the photos listed below are
cropped, toned and compressed into art/ and img/. The cut-out figures are made
first with tools/cutout.swift (see README).
"""
import argparse, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--src", help="folder holding the original pictures")
args = ap.parse_args()

catalog = json.loads((ROOT / "data" / "catalog.json").read_text())
unreleased = json.loads((ROOT / "data" / "unreleased.json").read_text())

# K.ONE's own colours: the cobalt of the sweater, the powder blue of the wall,
# the cream of the cap, over a blue-black night.
NIGHT = (6, 8, 13)
COBALT = (18, 52, 200)
POWDER = (173, 193, 217)


def save(im, path, q=80):
    path.parent.mkdir(exist_ok=True)
    im.convert("RGB").save(path, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"{path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def frac_crop(im, box):
    """Crop by fractions of the picture: (left, top, right, bottom)."""
    w, h = im.size
    return im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))


def fit_w(im, width):
    from PIL import Image
    if im.width <= width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def night(im, amount=0.55, sat=1.08):
    """Take a daylight picture into the dark: lower it toward blue-black and
    keep the colour, so the blues still read under light type."""
    from PIL import Image, ImageEnhance
    im = ImageEnhance.Color(im.convert("RGB")).enhance(sat)
    lut = []
    for ch in range(3):
        lut += [round(NIGHT[ch] * 0.6 + (i - NIGHT[ch] * 0.6) * ((i / 255) ** 0.55) * (1 - amount)) for i in range(256)]
    return im.point(lut)


def vignette(im, strength=0.6, cx=0.5, cy=0.45):
    """Darken the edges (where the type sits), leave the middle."""
    from PIL import Image, ImageDraw, ImageFilter
    w, h = im.size
    m = Image.new("L", (w // 8, h // 8), 0)
    d = ImageDraw.Draw(m)
    rx, ry = m.width * 0.62, m.height * 0.72
    d.ellipse((m.width * cx - rx, m.height * cy - ry, m.width * cx + rx, m.height * cy + ry), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(m.width / 6)).resize((w, h))
    dark = Image.new("RGB", (w, h), NIGHT)
    return Image.composite(im, Image.blend(im, dark, strength), m)


if args.src:
    from PIL import Image, ImageFilter, ImageEnhance, ImageOps
    SRC = pathlib.Path(args.src).expanduser()

    def op(name):
        return Image.open(SRC / name).convert("RGB")

    def square(im):
        side = min(im.size)
        return im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))

    # --- cover art: one square per release, and the next single's
    for r in catalog:
        save(fit_w(square(op(r["src"])), 640), ROOT / "art" / f"{r['id']}.jpg", 80)
    save(fit_w(op("img/presave_falling-for-you-deeper.jpg"), 900), ROOT / "art" / "falling-for-you-deeper.jpg", 80)

    # --- landing: the blue studio portrait from K.ONE's "upcoming dates" post, taken into the dark
    press = op("img_ig/igc_DcteENnlnVs_01.jpg")
    hero = fit_w(frac_crop(press, (0.0, 0.035, 1.0, 0.035 + 0.75 * 0.625)), 2000)   # 16:10 across the top half
    save(vignette(night(hero, 0.50), 0.55, 0.52, 0.42), ROOT / "img" / "hero.jpg", 78)
    hero_m = fit_w(frac_crop(press, (0.10, 0.02, 0.86, 0.98)), 1100)
    save(vignette(night(hero_m, 0.50), 0.50, 0.5, 0.36), ROOT / "img" / "hero-m.jpg", 76)

    # --- the ticket's poster: the same portrait as it was shot
    save(fit_w(frac_crop(press, (0.04, 0.03, 0.96, 0.95)), 900), ROOT / "img" / "poster.jpg", 80)
    # --- the menu's small picture: the cap and the sweater
    save(fit_w(frac_crop(press, (0.36, 0.05, 0.86, 0.39)), 420), ROOT / "img" / "pill.jpg", 80)

    # --- about: four cut-out figures (made by tools/cutout.swift into <src>/work/)
    cuts = {
        "cut-1": ("work/cut_bandcamp_pic.png", 1000),
        "cut-2": ("work/cut_igc_DcteENnlnVs_01.png", 1100),
        "cut-3": ("work/cut_sp_avatar.png", 640),
        "cut-4": ("work/cut_linktree_pic.png", 1000),
    }
    for name, (f, hmax) in cuts.items():
        im = Image.open(SRC / f).convert("RGBA")
        im = im.crop(im.getbbox())
        if im.height > hmax:
            im = im.resize((round(im.width * hmax / im.height), hmax), Image.LANCZOS)
        out = ROOT / "img" / f"{name}.webp"
        im.save(out, "WEBP", quality=84, method=6)
        print(f"img/{name}.webp  {im.width}x{im.height}  {out.stat().st_size // 1024} KB")

    # --- pictures from K.ONE's posts
    photos = {
        "g-silo": ("img_ig/igc_DbmD_u9Fmg__01.jpg", (0.0, 0.0, 1.0, 0.86), 1500),
        "g-la": ("img_ig/igc_DclouJylpED_01.jpg", None, 900),
        "g-radio": ("img_ig/igc_DclouJylpED_02.jpg", None, 900),
        "g-decks": ("img_ig/igc_DclouJylpED_04.jpg", None, 900),
        "g-rest": ("img_ig/igc_DclouJylpED_06.jpg", None, 900),
        "g-board": ("img_ig/igc_DclouJylpED_07.jpg", None, 900),
        "g-mirror": ("img_ig/igc_DclouJylpED_08.jpg", None, 900),
        "g-square": ("img_ig/igc_DezlFn4FvH9_01.jpg", None, 900),
        "g-square-bw": ("img_ig/igc_DezlFn4FvH9_02.jpg", (0.0, 0.0, 1.0, 0.8), 900),
        "g-lille": ("img_ig/igc_DeSGiSWid9p_01.jpg", None, 900),
    }
    for name, (f, box, w) in photos.items():
        im = op(f)
        if box:
            im = frac_crop(im, box)
        save(fit_w(im, w), ROOT / "img" / f"{name}.jpg", 76)

    # --- the two filmed sets
    save(fit_w(op("img/iggrid_DeaXSrwFpqu.jpg"), 960), ROOT / "img" / "set-scholes.jpg", 82)
    save(fit_w(op("img/yt_hb3pTfoUyR4.jpg"), 960), ROOT / "img" / "set-clubhouse.jpg", 78)

    # --- unreleased: each card is a picture out of focus (blurred here, not in the browser)
    secrets = [
        ("img/presave_falling-for-you-deeper.jpg", (0.1, 0.1, 0.9, 0.9)),
        ("img/yt_hb3pTfoUyR4.jpg", (0.1, 0.0, 0.7, 1.0)),
        ("img_ig/igc_DclouJylpED_02.jpg", (0.0, 0.2, 1.0, 0.9)),
        ("img_ig/igc_DbmD_u9Fmg__01.jpg", (0.1, 0.1, 0.9, 0.8)),
        ("img_ig/igc_DclouJylpED_04.jpg", (0.0, 0.1, 1.0, 0.9)),
    ]
    for i, (f, box) in enumerate(secrets, 1):
        im = fit_w(frac_crop(op(f), box), 520)
        im = ImageEnhance.Brightness(ImageOps.grayscale(im).filter(ImageFilter.GaussianBlur(26)).convert("RGB")).enhance(0.55)
        save(im, ROOT / "img" / f"secret-{i}.jpg", 60)

    # --- link preview picture
    share = fit_w(frac_crop(press, (0.0, 0.035, 1.0, 0.035 + 0.75 * 0.525)), 1200)
    save(night(share.crop((0, 0, 1200, 630)), 0.35), ROOT / "img" / "share.jpg", 80)

# --- js/data.js
rows = []
for r in catalog:
    rows.append({
        "id": r["id"], "title": r["title"], "by": r["by"], "date": r["date"], "label": r["label"],
        "kind": r["kind"], "seconds": r["seconds"], "art": f"art/{r['id']}.jpg",
        "soundcloud": r["sc"], "spotify": f"https://open.spotify.com/album/{r['sp']}" if r["sp"] else "",
        # False where SoundCloud will not play the track inside another site: Play opens SoundCloud
        "embed": r.get("embed", True),
    })
out = ("// Generated by tools/build.py from data/catalog.json and data/unreleased.json. Do not edit by hand.\n"
       "window.KONE = " + json.dumps({"records": rows, "unreleased": unreleased}, indent=1, ensure_ascii=False) + ";\n")
(ROOT / "js").mkdir(exist_ok=True)
(ROOT / "js" / "data.js").write_text(out)
print("js/data.js", len(rows), "records")
missing = [r["id"] for r in catalog if not (ROOT / "art" / f"{r['id']}.jpg").exists()]
if missing:
    print("no cover art for:", ", ".join(missing), file=sys.stderr)
