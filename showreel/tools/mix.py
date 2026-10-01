"""음악 + 효과음 큐 믹스 → out/mix.wav (리미터 포함).

큐는 영상 프레임(30fps) 기준. 화면 이벤트와 같은 프레임에 둔다.
"""
import os

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.normpath(os.path.join(HERE, '..', 'public', 'audio'))
OUT = os.path.normpath(os.path.join(HERE, '..', 'out', 'mix.wav'))
SR = 44100
FPS = 30

# (프레임, 파일, 게인)
CUES = [
    # ── 인트로
    (0, 'whoosh_short', 0.45),
    *[(6 + k * 3, 'type', 0.22) for k in range(7)],
    (28, 'pop', 0.5), (33, 'pop_hi', 0.45), (36, 'pop', 0.5),
    (54, 'whoosh_short', 0.35),
    (103, 'impact', 0.45), (103, 'boop', 0.6),
    # ── 타이틀
    (120, 'impact', 0.5), (135, 'impact', 0.5),
    (148, 'pop', 0.55), (153, 'pop', 0.55),
    (164, 'pop_hi', 0.4), (167, 'pop_hi', 0.4), (170, 'pop', 0.45),
    (180, 'whoosh', 0.55), (184, 'pop_hi', 0.35),
    (224, 'whoosh', 0.5),
    # ── CH1 아기 시절
    (240, 'whoosh', 0.5), (266, 'whoosh_short', 0.4),
    (276, 'whistle', 0.35),
    (290, 'ding', 0.25),
    (300, 'whoosh_short', 0.3), (360, 'whoosh_short', 0.3), (420, 'whoosh_short', 0.3),
    (390, 'ding', 0.25),
    (426, 'boop', 0.7), (433, 'boop', 0.7), (439, 'pop_hi', 0.6), (439, 'ding', 0.25),
    (444, 'shutter', 0.75),
    # ── CH2 캐릭터
    (480, 'whoosh', 0.45),
    (504, 'click', 0.45), (510, 'click', 0.45), (516, 'click', 0.45),
    (528, 'pop_hi', 0.3), (533, 'pop_hi', 0.3), (538, 'pop_hi', 0.3),
    (554, 'boop', 0.5), (560, 'pop', 0.45),
    (588, 'whoosh', 0.55),
    (626, 'click', 0.45), (632, 'click', 0.45), (638, 'click', 0.45),
    (642, 'ding', 0.3),
    (650, 'pop_hi', 0.3), (655, 'pop_hi', 0.3), (660, 'pop_hi', 0.3),
    (720, 'whoosh', 0.55), (726, 'impact', 0.55),
    (750, 'whoosh_short', 0.4), (755, 'ding', 0.35), (756, 'pop', 0.4),
    (780, 'impact', 0.45), (795, 'pop', 0.55), (802, 'pop', 0.55), (810, 'pop_hi', 0.4),
    # ── CH3 방탄의 하루
    (848, 'boop', 0.65),
    (885, 'whoosh_short', 0.45),
    (915, 'pop', 0.45),
    (925, 'pop_hi', 0.3), (931, 'pop_hi', 0.3), (939, 'pop', 0.3),
    (953, 'whoosh_short', 0.45),
    (974, 'click', 0.3),
    (1020, 'whoosh', 0.45),
    (1050, 'whoosh_short', 0.45),
    (1056, 'click', 0.3),
    (1080, 'pop', 0.45), (1095, 'pop', 0.45), (1110, 'pop', 0.45), (1125, 'whoosh_short', 0.35),
    (1140, 'whoosh', 0.45), (1150, 'ding', 0.3),
    *[(1162 + k * 3, 'type', 0.2) for k in range(10)],
    (1200, 'glitch', 0.45),
    (1230, 'whoosh_short', 0.45),
    (1260, 'whoosh', 0.5),
    (1282, 'click', 0.5),
    (1290, 'ding', 0.25),
    # ── CH4 스타일 실험실
    (1320, 'glitch', 0.5),
    *[(1335 + k * 15, 'click', 0.5) for k in range(7)],
    *[(1335 + k * 15, 'whoosh_short', 0.2) for k in range(7)],
    (1440, 'whoosh', 0.4), (1442, 'pop', 0.35), (1446, 'pop', 0.35), (1450, 'pop', 0.35),
    (1456, 'pop_hi', 0.5), (1462, 'pop_hi', 0.5), (1468, 'pop_hi', 0.5),
    *[(1500 + round(k * 7.5), 'pop', 0.45) for k in range(7)],
    # ── 아웃트로
    (1560, 'whoosh', 0.5),
    (1620, 'pop_hi', 0.3),
    (1680, 'impact', 0.45),
    (1746, 'pop', 0.55), (1756, 'pop_hi', 0.5),
    (1766, 'whoosh_short', 0.35),
]


def load(path):
    sr, raw = wavfile.read(path)
    assert sr == SR, path
    d = raw.astype(np.float32)
    if raw.dtype == np.int16:
        d /= 32768.0
    elif raw.dtype == np.int32:
        d /= 2147483648.0
    if d.ndim == 1:
        d = np.stack([d, d], axis=1)
    return d


def soft_limit(x, ceiling=0.89):
    """룩어헤드 게인 리미터: 피크 주변 10ms 최소 게인을 부드럽게 적용."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d

    env = np.abs(x).max(axis=1)
    target = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    w = int(0.012 * SR)
    g = minimum_filter1d(target, size=2 * w + 1)
    g = uniform_filter1d(g, size=w)
    g = minimum_filter1d(g, size=w // 2 + 1)
    y = x * g[:, None]
    return np.clip(y, -0.98, 0.98)


def main():
    music = load(os.path.join(PUB, 'music.wav'))
    mix = music.copy()
    for frame, name, gain in CUES:
        s = load(os.path.join(PUB, 'sfx', name + '.wav')) * gain
        i0 = int(round(frame / FPS * SR))
        i1 = min(len(mix), i0 + len(s))
        mix[i0:i1] += s[: i1 - i0]
    peak = np.abs(mix).max()
    print('pre-limit peak', round(float(peak), 3), 'cues', len(CUES))
    mix = soft_limit(mix)
    # 피크 -1 dBFS 로 정규화
    mix *= 0.84 / max(1e-9, float(np.abs(mix).max()))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    wavfile.write(OUT, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
    print('wrote', OUT, 'peak', round(float(np.abs(mix).max()), 3))


if __name__ == '__main__':
    main()
