"""소재 전처리: 생성 이미지 변환, 스티커 외곽선, 스타일 실험실 변형, 그레인 텍스처."""
import glob
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = "/Users/robin/Downloads/bangtan-cat"
PUB = ROOT + "/showreel/public"
FONTS = PUB + "/fonts"
os.makedirs(PUB + "/img", exist_ok=True)
os.makedirs(PUB + "/sticker", exist_ok=True)
os.makedirs(PUB + "/style", exist_ok=True)
os.makedirs(PUB + "/grain", exist_ok=True)


def fresh(src, dst):
    return not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)


# 1) 생성 이미지 → JPEG
for f in sorted(glob.glob(ROOT + "/generated/*.png")):
    name = os.path.basename(f)[:-4]
    dst = f"{PUB}/img/{name}.jpg"
    if fresh(f, dst):
        Image.open(f).convert("RGB").save(dst, quality=93)
        print("img", name)

ORIG = {
    "tani_p1": "KakaoTalk_Photo_2026-10-01-22-23-18 001.jpeg",
    "both_p2": "KakaoTalk_Photo_2026-10-01-22-23-19 002.jpeg",
    "bangi_p3": "KakaoTalk_Photo_2026-10-01-22-23-49 003.jpeg",
}
for k, v in ORIG.items():
    dst = f"{PUB}/img/{k}.jpg"
    if not os.path.exists(dst):
        im = ImageOps.exif_transpose(Image.open(f"{ROOT}/{v}")).convert("RGB")
        im.thumbnail((2200, 2200), Image.LANCZOS)
        im.save(dst, quality=93)
        print("orig", k, im.size)


# 2) 스티커: 흰 외곽선을 구워 넣는다
def sticker(src, dst, outline=18):
    im = Image.open(src).convert("RGBA")
    pad = outline * 2
    W, H = im.size
    canvas = Image.new("RGBA", (W + 2 * pad, H + 2 * pad), (0, 0, 0, 0))
    canvas.paste(im, (pad, pad))
    a = np.array(canvas.getchannel("A"))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * outline + 1, 2 * outline + 1))
    d = cv2.dilate((a > 60).astype(np.uint8) * 255, k)
    # 외곽선을 조금 둥글게
    d = cv2.GaussianBlur(d, (0, 0), 2.0)
    d = np.clip((d.astype(np.float32) - 64) * 2.0, 0, 255).astype(np.uint8)
    white = Image.new("RGBA", canvas.size, (255, 253, 248, 0))
    white.putalpha(Image.fromarray(d))
    white.alpha_composite(canvas)
    bb = white.getchannel("A").getbbox()
    white = white.crop(bb)
    white.save(dst, optimize=True)
    print("sticker", os.path.basename(dst), white.size)


for f in sorted(glob.glob(PUB + "/cut/*.png")):
    dst = PUB + "/sticker/" + os.path.basename(f)
    if fresh(f, dst):
        sticker(f, dst)


# 3) 스타일 실험실
def load_crop(path, W=1920, H=1080, cy=0.5):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    tw, th = w, int(w * H / W)
    if th > h:
        th, tw = h, int(h * W / H)
    top = int((h - th) * cy)
    left = (w - tw) // 2
    im = im.crop((left, top, left + tw, top + th)).resize((W, H), Image.LANCZOS)
    return np.array(im)


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def gradient_map(gray, stops):
    """gray: 0..1, stops: [(pos, hex), ...]"""
    out = np.zeros(gray.shape + (3,), np.float32)
    pos = [s[0] for s in stops]
    cols = [hexrgb(s[1]) for s in stops]
    for c in range(3):
        out[..., c] = np.interp(gray, pos, [col[c] for col in cols])
    return out.clip(0, 255).astype(np.uint8)


def lum(rgb):
    return (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]) / 255.0


def style_variants(src_path, prefix, cy=0.5):
    base = load_crop(src_path, cy=cy)
    H, W = base.shape[:2]
    Image.fromarray(base).save(f"{PUB}/style/{prefix}_0_original.jpg", quality=92)
    g = lum(base.astype(np.float32))
    g_eq = cv2.equalizeHist((g * 255).astype(np.uint8)).astype(np.float32) / 255.0
    g_mix = 0.6 * g + 0.4 * g_eq

    # 듀오톤
    duo = gradient_map(g_mix, [(0, "#1A1446"), (0.45, "#C2366B"), (0.75, "#FF8A1F"), (1, "#FFE9C7")])
    Image.fromarray(duo).save(f"{PUB}/style/{prefix}_1_duotone.jpg", quality=92)

    # 하프톤 (45도 회전 그리드, 2배 슈퍼샘플)
    S = 2
    step = 16
    canvas = Image.new("L", (W * S, H * S), 255)
    dr = ImageDraw.Draw(canvas)
    gsm = np.clip((cv2.GaussianBlur(g, (0, 0), 3) - 0.08) * 1.35, 0, 1) ** 0.85
    ang = np.deg2rad(45)
    ca, sa = np.cos(ang), np.sin(ang)
    R = int(np.hypot(W, H))
    for i in range(-R // step, R // step + 1):
        for j in range(-R // step, R // step + 1):
            u, v = i * step, j * step
            x = W / 2 + u * ca - v * sa
            y = H / 2 + u * sa + v * ca
            if -step <= x < W + step and -step <= y < H + step:
                xi, yi = int(np.clip(x, 0, W - 1)), int(np.clip(y, 0, H - 1))
                dark = 1 - gsm[yi, xi]
                r = step * 0.56 * dark ** 0.9
                if r > 0.4:
                    dr.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=0)
    ht = np.array(canvas.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255.0
    paper = hexrgb("#FFF4E3")
    ink = hexrgb("#1E1A3C")
    halftone = (ht[..., None] * paper + (1 - ht[..., None]) * ink).astype(np.uint8)
    Image.fromarray(halftone).save(f"{PUB}/style/{prefix}_2_halftone.jpg", quality=92)

    # 연필 스케치 (컬러 닷지)
    g8 = (g * 255).astype(np.uint8)
    inv = 255 - g8
    blur = cv2.GaussianBlur(inv, (0, 0), 9)
    sketch = cv2.divide(g8, 255 - blur, scale=256)
    sketch = np.clip((sketch.astype(np.float32) - 40) * 1.25, 0, 255)
    sketch = (sketch / 255.0) ** 1.6
    paper2 = hexrgb("#FBF7EE")
    graphite = hexrgb("#2B2A33")
    sk = (sketch[..., None] * paper2 + (1 - sketch[..., None]) * graphite).astype(np.uint8)
    Image.fromarray(sk).save(f"{PUB}/style/{prefix}_3_sketch.jpg", quality=92)

    # 팝아트 포스터라이즈
    smooth = cv2.bilateralFilter(base, 9, 60, 9)
    gs = lum(smooth.astype(np.float32))
    levels = np.digitize(gs, [0.22, 0.42, 0.62, 0.8])
    pal = np.array([hexrgb(c) for c in ["#111111", "#E8336D", "#FF8A1F", "#FFD23F", "#FFFFFF"]])
    pop = pal[levels].astype(np.uint8)
    edges = cv2.Canny(cv2.GaussianBlur((gs * 255).astype(np.uint8), (0, 0), 2), 40, 110)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8))
    pop[edges > 0] = (17, 17, 17)
    Image.fromarray(pop).save(f"{PUB}/style/{prefix}_4_popart.jpg", quality=92)

    # 픽셀 모자이크
    small = cv2.resize(base, (96, 54), interpolation=cv2.INTER_AREA)
    small = cv2.convertScaleAbs(small, alpha=1.12, beta=-8)
    hsv = cv2.cvtColor(small, cv2.COLOR_RGB2HSV).astype(np.float32); hsv[..., 1] = np.clip(hsv[..., 1] * 1.35, 0, 255)
    small = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    pim = Image.fromarray(small).quantize(colors=20, method=Image.Quantize.MEDIANCUT).convert("RGB")
    pix = np.array(pim.resize((W, H), Image.NEAREST))
    # 픽셀 격자선
    for x in range(0, W, W // 96):
        pix[:, x:x + 1] = (pix[:, x:x + 1] * 0.85).astype(np.uint8)
    for y in range(0, H, H // 54):
        pix[y:y + 1, :] = (pix[y:y + 1, :] * 0.85).astype(np.uint8)
    Image.fromarray(pix).save(f"{PUB}/style/{prefix}_5_pixel.jpg", quality=92)

    # 리소그래프 (핑크/틸 2도 인쇄, 어긋난 판)
    rng = np.random.default_rng(7)
    paper3 = np.full((H, W, 3), hexrgb("#F4EEDF"), np.float32)
    grain = rng.normal(0, 0.06, (H, W)).astype(np.float32)
    d1 = np.clip((1 - g_mix) * 1.1 + grain, 0, 1)
    d1 = (d1 > rng.random((H, W)) * 0.9 + 0.05).astype(np.float32)
    d1 = cv2.GaussianBlur(d1, (0, 0), 0.8)
    edge_layer = cv2.GaussianBlur(g_mix, (0, 0), 1.5)
    d2 = np.clip((0.55 - edge_layer) * 2.2 + grain, 0, 1)
    M = np.float32([[1, 0, 9], [0, 1, -6]])
    d2 = cv2.warpAffine(d2, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    pink = hexrgb("#FF4FA3") / 255.0
    teal = hexrgb("#1D8F9A") / 255.0
    out = paper3 / 255.0
    out = out * (1 - d1[..., None] * (1 - pink) * 0.92)
    out = out * (1 - d2[..., None] * (1 - teal) * 0.9)
    riso = (out * 255).clip(0, 255).astype(np.uint8)
    Image.fromarray(riso).save(f"{PUB}/style/{prefix}_6_riso.jpg", quality=92)

    # 컬러 아스키
    font = ImageFont.truetype(FONTS + "/SpaceMono-Bold.ttf", 19)
    cw, ch = 12, 22
    cols, rows = W // cw, H // ch
    small = cv2.resize(base, (cols, rows), interpolation=cv2.INTER_AREA).astype(np.float32)
    sg = lum(small)
    ramp = ".:-=+*o#%@@"
    asc = Image.new("RGB", (W, H), (14, 12, 20))
    dr = ImageDraw.Draw(asc)
    for r in range(rows):
        for c in range(cols):
            v = sg[r, c]
            px = small[r, c]
            bgc = tuple(int(x * 0.32) for x in px)
            dr.rectangle([c * cw, r * ch, c * cw + cw - 1, r * ch + ch - 1], fill=bgc)
            chr_ = ramp[int(v * (len(ramp) - 1) + 0.5)]
            col = tuple(int(min(255, x * 1.35 + 60)) for x in px)
            dr.text((c * cw, r * ch - 3), chr_, font=font, fill=col)
    asc.save(f"{PUB}/style/{prefix}_7_ascii.jpg", quality=92)
    print("style", prefix)


if "--style" in sys.argv or not glob.glob(PUB + "/style/*.jpg"):
    src = ROOT + "/generated/g11_basket.png"
    if os.path.exists(src):
        style_variants(src, "basket", cy=0.42)


# 4) 팝아트 그리드용 정사각 타일 9장
def pop_tiles(src_path, prefix):
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    s = min(w, h)
    left = (w - s) // 2
    im = im.crop((left, 0, left + s, s)).resize((640, 640), Image.LANCZOS)
    a = np.array(cv2.bilateralFilter(np.array(im), 9, 60, 9)).astype(np.float32)
    g = lum(a)
    lv = np.digitize(g, [0.25, 0.48, 0.72])
    edges = cv2.Canny(cv2.GaussianBlur((g * 255).astype(np.uint8), (0, 0), 1.6), 40, 110)
    palettes = [
        ["#1B1B3A", "#FF4F81", "#FFB238", "#FFF3D6"],
        ["#0B3954", "#087E8B", "#BFD7EA", "#FF5A5F"],
        ["#2E1F27", "#F25F5C", "#FFE066", "#70C1B3"],
        ["#14213D", "#FCA311", "#E5E5E5", "#FFFFFF"],
        ["#3D0C11", "#D80032", "#F78764", "#F9DBBD"],
        ["#03045E", "#0077B6", "#90E0EF", "#FFD6A5"],
        ["#231942", "#5E548E", "#E0B1CB", "#FFF0F3"],
        ["#1A1A1A", "#FF8A1F", "#FFD8A8", "#FFFFFF"],
        ["#004B23", "#38B000", "#CCFF33", "#FFF8E7"],
    ]
    for i, p in enumerate(palettes):
        pal = np.array([hexrgb(c) for c in p])
        t = pal[lv].astype(np.uint8)
        t[edges > 0] = pal[0].astype(np.uint8)
        Image.fromarray(t).save(f"{PUB}/style/{prefix}_pop{i}.jpg", quality=90)
    print("pop tiles", prefix)


if "--style" in sys.argv or not glob.glob(PUB + "/style/*_pop0.jpg"):
    src = ROOT + "/generated/g11_basket.png"
    if os.path.exists(src):
        pop_tiles(src, "basket")

# 5) 필름 그레인
if not glob.glob(PUB + "/grain/*.png"):
    rng = np.random.default_rng(1)
    for i in range(8):
        n = rng.normal(128, 38, (540, 960)).clip(0, 255).astype(np.uint8)
        n = cv2.GaussianBlur(n, (0, 0), 0.6)
        Image.fromarray(n).save(f"{PUB}/grain/g{i}.png")
    print("grain")
