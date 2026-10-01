"""메이킹 필름 소재 준비: 중간 결과물 복사·크롭, 파형/코드 데이터, 완성본 프레임 추출."""
import glob
import json
import os
import shutil
import subprocess

import numpy as np
from PIL import Image
from scipy.io import wavfile

ROOT = "/Users/robin/Downloads/bangtan-cat"
SR_DIR = ROOT + "/showreel"
PUB = SR_DIR + "/public/making"
SCR = "/private/tmp/claude-501/-Users-robin-Downloads-bangtan-cat/f08e3c47-1c04-413a-a5b9-ef12b7e5fa68/scratchpad"
FINAL = ROOT + "/방탄_쇼릴_2026.mp4"
os.makedirs(PUB + "/img", exist_ok=True)
os.makedirs(PUB + "/strip", exist_ok=True)
os.makedirs(SR_DIR + "/src/making", exist_ok=True)


def to_jpg(src, dst, q=92, crop=None, scale=None):
    im = Image.open(src).convert("RGB")
    if crop:
        im = im.crop(crop)
    if scale:
        im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    im.save(dst, quality=q)
    print("img", os.path.basename(dst), im.size)


# 1) 작업 중 실제로 남은 중간 결과물
to_jpg(SCR + "/music_spec.png", PUB + "/img/music_spec.jpg")
to_jpg(SCR + "/preview/trk_sheet.jpg", PUB + "/img/trk_fail.jpg")
to_jpg(SCR + "/preview/trk2.jpg", PUB + "/img/trk_mask.jpg")
to_jpg(SCR + "/preview/trk3.jpg", PUB + "/img/trk_ok.jpg")
to_jpg(SCR + "/preview/cutouts.jpg", PUB + "/img/cutouts_green.jpg")
to_jpg(SCR + "/preview/vtile2.jpg", PUB + "/img/video_sheet.jpg")
to_jpg(SCR + "/draft_1.jpg", PUB + "/img/draft_1.jpg")
to_jpg(SCR + "/preview/grid_tani_p1.jpg", PUB + "/img/grid_tani.jpg")
to_jpg(SCR + "/preview/day_grid.jpg", PUB + "/img/day_grid.jpg")
# 스타일 첫 시도(어두웠던 하프톤/아스키) — 당시 콘택트 시트에서 잘라냄
to_jpg(SCR + "/preview/style_sheet.jpg", PUB + "/img/halftone_before.jpg", crop=(1280, 0, 1920, 360))
to_jpg(SCR + "/preview/style_sheet.jpg", PUB + "/img/ascii_before.jpg", crop=(1920, 360, 2560, 720))
# 검수 전 상태: 하트가 얼굴을 가리던 컷(f760), 사냥 패널 뒤 검은 화면(37.5초)
to_jpg(SCR + "/sheet_s4.jpg", PUB + "/img/heart_before.jpg", crop=(3 * 582, 2 * 330, 3 * 582 + 576, 2 * 330 + 324))
to_jpg(SCR + "/draft_2.jpg", PUB + "/img/panels_before.jpg", crop=(960, 180, 1280, 360))


# 2) 완성본에서 프레임 추출 (수정 후 비교 + 필름 스트립)
def grab(frame, dst, w=1920):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", FINAL, "-vf", f"select=eq(n\\,{frame}),scale={w}:-1", "-vframes", "1", "-q:v", "3", dst],
        check=True,
    )


grab(760, PUB + "/img/heart_after.jpg", 960)
grab(1125, PUB + "/img/panels_after.jpg", 960)
grab(870, PUB + "/img/clock_after.jpg", 960)
strip_frames = [130, 200, 300, 420, 470, 540, 650, 740, 800, 880, 990, 1100, 1180, 1250, 1300, 1350, 1400, 1460, 1530, 1640, 1720, 1760]
for i, fr in enumerate(strip_frames):
    grab(fr, f"{PUB}/strip/s{i:02d}.jpg", 480)
print("strip", len(strip_frames))

# 3) 파형 데이터 (쇼릴 음악)
sr, d = wavfile.read(SR_DIR + "/public/audio/music.wav")
x = d.astype(np.float32).mean(axis=1) / 32768.0
bins = 960
n = len(x) // bins
wave = [[round(float(x[i * n:(i + 1) * n].min()), 3), round(float(x[i * n:(i + 1) * n].max()), 3)] for i in range(bins)]

# 4) 코드 통계 / 스니펫
src_files = [f for f in glob.glob(SR_DIR + "/src/**/*.ts*", recursive=True) if "/making/" not in f]
lines = sum(sum(1 for _ in open(f)) for f in src_files)
tool_lines = sum(sum(1 for _ in open(f)) for f in glob.glob(SR_DIR + "/tools/*") if f.endswith((".py", ".swift", ".mjs")) and "making" not in f)
s2 = open(SR_DIR + "/src/scenes/S2Title.tsx").read().splitlines()
core = open(SR_DIR + "/src/lib/core.ts").read().splitlines()
snippet = s2[9:35]
timing = core[4:10]
json.dump(
    {"wave": wave, "srcLines": lines, "toolLines": tool_lines, "srcFiles": len(src_files), "snippet": snippet, "timing": timing},
    open(SR_DIR + "/src/making/data.json", "w"),
    ensure_ascii=False,
)
print("src lines", lines, "files", len(src_files), "tool lines", tool_lines)
