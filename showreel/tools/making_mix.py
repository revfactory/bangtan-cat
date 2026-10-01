"""메이킹 필름 오디오: 로파이 본편 + 완성본 오디오 3구간 + 크레딧 + 효과음 → out/making_mix.wav"""
import os

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
FPS = 30
PUB = os.path.normpath(os.path.join(HERE, '..', 'public'))
OUT = os.path.normpath(os.path.join(HERE, '..', 'out', 'making_mix.wav'))
TOTAL = int(round(2960 / FPS * SR))


def load(path):
    sr, raw = wavfile.read(path)
    assert sr == SR, path
    d = raw.astype(np.float32)
    if raw.dtype == np.int16:
        d /= 32768.0
    if d.ndim == 1:
        d = np.stack([d, d], axis=1)
    return d


def sfx(name):
    p = os.path.join(PUB, 'making', 'audio', 'sfx', name + '.wav')
    if not os.path.exists(p):
        p = os.path.join(PUB, 'audio', 'sfx', name + '.wav')
    return load(p)


def put(mix, sig, frame, gain=1.0):
    i0 = int(round(frame / FPS * SR))
    i1 = min(len(mix), i0 + len(sig))
    if i1 > i0:
        mix[i0:i1] += sig[: i1 - i0] * gain


CUES = [
    # M0 콜드 오픈
    (12, 'keys', 0.5), (38, 'keys', 0.45), (60, 'keys', 0.5), (86, 'keys', 0.45), (102, 'enter', 0.6), (106, 'tick', 0.4), (124, 'tick', 0.35),
    # M1 타이틀
    (160, 'swipe', 0.5), (220, 'pop', 0.4), (240, 'pop', 0.4), (260, 'pop_hi', 0.4),
    # M2 STEP01
    (320, 'swipe', 0.5), (348, 'mouse', 0.5), *[(352 + k * 3, 'tick', 0.3) for k in range(6)], (400, 'error', 0.4), (414, 'pop', 0.35), (432, 'paper', 0.6),
    # M3 STEP02
    (480, 'swipe', 0.5), (526, 'keys', 0.45), (548, 'keys', 0.4), (598, 'success', 0.45), (606, 'pop', 0.3), (612, 'pop', 0.3), (618, 'pop', 0.3),
    (630, 'swipe', 0.4), *[(640 + k * 6, 'tick', 0.3) for k in range(6)], (698, 'swipe', 0.4),
    (742, 'tick', 0.35), (744, 'tick', 0.35), (748, 'tick', 0.35), (757, 'tick', 0.35), (771, 'tick', 0.35),
    (780, 'error', 0.45), (798, 'success', 0.4), (812, 'whoosh', 0.35), (842, 'impact', 0.35), (850, 'paper', 0.55),
    # M4 STEP03
    (880, 'swipe', 0.5), (912, 'pop', 0.4), (926, 'tick', 0.3), (930, 'pop', 0.4), (944, 'tick', 0.3), (948, 'pop', 0.4),
    *[(972 + k * 4, 'pop_hi', 0.25) for k in range(7)], (990, 'paper', 0.55),
    # M5 STEP04
    (1040, 'swipe', 0.5), *[(1080 + k * 5, 'tick', 0.3) for k in range(4)], (1102, 'whoosh', 0.35), (1120, 'pop', 0.35),
    (1134, 'swipe', 0.4), (1146, 'error', 0.45), (1168, 'tick', 0.3), (1190, 'success', 0.45), (1216, 'swipe', 0.4), (1246, 'paper', 0.55),
    # M6 STEP05
    (1280, 'swipe', 0.5), (1312, 'pop', 0.35), (1318, 'pop', 0.35), (1324, 'error', 0.3), (1332, 'paper', 0.55), (1344, 'swipe', 0.35), (1350, 'swipe', 0.35),
    (1362, 'tick', 0.3), (1366, 'tick', 0.3), (1382, 'whoosh', 0.35), *[(1384 + k * 2, 'tick', 0.22) for k in range(8)], (1404, 'pop', 0.35),
    # M7 STEP06
    (1440, 'swipe', 0.5), (1480, 'tick', 0.3), (1490, 'tick', 0.3), (1500, 'tick', 0.3), (1510, 'tick', 0.3), (1536, 'paper', 0.55),
    (1574, 'whoosh', 0.35), *[(1578 + k * 4, 'pop_hi', 0.2) for k in range(8)], (1632, 'tick', 0.3), (1662, 'success', 0.45),
    # M8 STEP07
    (1680, 'swipe', 0.5), (1716, 'keys', 0.4), (1736, 'keys', 0.35), (1764, 'mouse', 0.45), (1770, 'tick', 0.3),
    (1852, 'whoosh', 0.35), *[(1856 + k * 3, 'tick', 0.25) for k in range(7)], (1876, 'swipe', 0.3), (1976, 'pop', 0.35), (1982, 'pop', 0.35), (1988, 'pop', 0.35),
    # M9 STEP08
    (2000, 'swipe', 0.5), (2034, 'mouse', 0.4), (2042, 'pop', 0.3), (2052, 'paper', 0.55), (2086, 'error', 0.35), (2096, 'success', 0.35),
    (2116, 'swipe', 0.35), (2128, 'swipe', 0.35), (2150, 'swipe', 0.35), (2160, 'swipe', 0.35), (2182, 'whoosh', 0.35),
    *[(2186 + k * 2, 'tick', 0.22) for k in range(8)], (2206, 'pop', 0.35), (2222, 'success', 0.5),
    # M12 크레딧
    (2894, 'pop', 0.35), (2898, 'pop_hi', 0.3), (2902, 'pop_hi', 0.3),
]


def main():
    mix = np.zeros((TOTAL, 2), np.float32)
    put(mix, load(os.path.join(PUB, 'making', 'audio', 'music_a.wav')), 0)
    reel = load(os.path.normpath(os.path.join(HERE, '..', 'out', 'mix.wav')))
    fade = int(0.006 * SR)
    for i, (s0, s1) in enumerate([(4.0, 8.0), (28.0, 32.0), (52.0, 60.0)]):
        seg = reel[int(s0 * SR):int(s1 * SR)].copy()
        ramp = np.linspace(0, 1, fade)[:, None]
        if i > 0:
            seg[:fade] *= ramp
        if i < 2:
            seg[-fade:] *= ramp[::-1]
        put(mix, seg, 2320 + [0, 120, 240][i], 0.86)
    put(mix, load(os.path.join(PUB, 'making', 'audio', 'music_b.wav')), 2800)
    for fr, name, g in CUES:
        put(mix, sfx(name), fr, g)
    print('pre-limit peak', round(float(np.abs(mix).max()), 3), 'cues', len(CUES))
    env = np.abs(mix).max(axis=1)
    target = np.minimum(1.0, 0.89 / np.maximum(env, 1e-9))
    w = int(0.012 * SR)
    g = minimum_filter1d(target, size=2 * w + 1)
    g = uniform_filter1d(g, size=w)
    g = minimum_filter1d(g, size=w // 2 + 1)
    mix = mix * g[:, None]
    mix *= 0.84 / max(1e-9, float(np.abs(mix).max()))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    wavfile.write(OUT, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
    print('wrote', OUT, round(len(mix) / SR, 3), 's')


if __name__ == '__main__':
    main()
