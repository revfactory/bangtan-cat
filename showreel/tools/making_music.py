#!/usr/bin/env python3
"""방탄 메이킹 필름 배경음악·효과음 합성기.

90 BPM, 4/4. 1박 = 0.6667초, 1마디 = 2.6667초(117,600샘플, 영상 80프레임).
쇼릴 합성기(music.py)의 오실레이터·드럼·리버브·리미터를 재사용한다.

출력
  public/making/audio/music_a.wav   29마디 = 3,410,400샘플 (77.333초)
  public/making/audio/music_b.wav   2마디 = 235,200샘플 (5.333초, 크레딧 아웃트로)
  public/making/audio/sfx/*.wav     단발 효과음 (피크 -3dBFS)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import music as M  # noqa: E402

SR = M.SR
smp, tarr, stereo, filt = M.smp, M.tarr, M.stereo, M.filt
sos_lp, sos_hp, sos_bp = M.sos_lp, M.sos_hp, M.sos_bp
ramp_in, fade_tail = M.ramp_in, M.fade_tail
sine, saw, square, noise = M.sine, M.saw, M.square, M.noise
hz, up = M.hz, M.up

BPM = 90
BEAT = 60 / BPM
BAR = 4 * BEAT
STEP = BAR / 16
BAR_S = 117600
NA = 29 * BAR_S            # 3,410,400
NB = 2 * BAR_S             # 235,200
TAIL = 4 * SR
SWING = 0.58
rng = np.random.default_rng(20261002)

OUT_DIR = os.path.normpath(os.path.join(HERE, '..', 'public', 'making', 'audio'))
SFX_DIR = os.path.join(OUT_DIR, 'sfx')
SCRATCH = '/private/tmp/claude-501/-Users-robin-Downloads-bangtan-cat/f08e3c47-1c04-413a-a5b9-ef12b7e5fa68/scratchpad'


def bar_t(bar):
    return (bar - 1) * BAR_S / SR


def ts(bar, s=0.0, swing=True, jitter=0.0):
    """마디(1부터)·16분 스텝 → 초. 홀수 16분은 스윙으로 뒤로 민다."""
    t = bar_t(bar) + s * STEP
    if swing and float(s).is_integer() and int(s) % 2 == 1:
        t += (2 * SWING - 1) * STEP
    if jitter:
        t += rng.uniform(-jitter, jitter)
    return max(0.0, t)


class Bus(M.Bus):
    def __init__(self, n):
        super().__init__(n)


# ───────────────────────────── 악기 ─────────────────────────────
def rhodes(f, dur, vel=0.7, level=1.0):
    """FM 일렉트릭 피아노: 1:1 모듈레이터(감쇠 인덱스) + 고배음 틴 + 바크."""
    tail = 1.4
    n = smp(dur + tail)
    t = tarr(n)
    I = (0.7 + 1.5 * vel) * np.exp(-t / 0.32) + 0.22
    body = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * t))
    tine = np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t / 0.014) * 0.22 * vel
    tine += np.sin(2 * np.pi * f * 3.0 * t) * np.exp(-t / 0.05) * 0.08 * vel
    x = body + tine
    drive = 1 + 1.2 * vel
    x = np.tanh(x * drive) / np.tanh(drive)
    env = (0.62 * np.exp(-t / 1.5) + 0.38 * np.exp(-t / 0.22)) * ramp_in(n, smp(0.003))
    off = smp(dur)
    env[off:] *= np.exp(-(t[off:] - dur) / 0.13)
    return fade_tail(x * env, smp(0.05)) * level * 0.32


def rhodes_chord(notes, dur, vel=0.7, level=1.0, strum=0.014):
    """살짝 굴려 치는 코드 (저음부터)."""
    parts = []
    for k, nm in enumerate(notes):
        v = vel * rng.uniform(0.88, 1.05)
        parts.append((k * strum + rng.uniform(0, 0.004), rhodes(hz(nm), dur - k * strum, v, level)))
    n = max(smp(o) + len(p) for o, p in parts)
    out = np.zeros(n)
    for o, p in parts:
        i = smp(o)
        out[i:i + len(p)] += p
    return out


def flute(f, dur, level=1.0):
    n = smp(dur + 0.3)
    t = tarr(n)
    vib = 1 + 0.0045 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) / 0.25, 0, 1)
    x = sine(f * vib, n) + 0.13 * sine(2 * f * vib, n) + 0.04 * sine(3 * f * vib, n)
    breath = filt(noise(n), sos_bp(f * 0.85, f * 1.35)) * 0.05
    breath += filt(noise(n), sos_hp(5000)) * 0.006 * np.exp(-t / 0.06)
    env = np.clip(t / 0.045, 0, 1) ** 1.5
    off = smp(dur)
    env[off:] *= np.exp(-(t[off:] - dur) / 0.11)
    return fade_tail((x + breath) * env, smp(0.04)) * level * 0.4


def kick_lofi(level=1.0):
    n = smp(0.55)
    t = tarr(n)
    f = 48 + 62 * np.exp(-t / 0.045) + 140 * np.exp(-t / 0.006)
    body = sine(f, n) * (0.8 * np.exp(-t / 0.26) + 0.2 * np.exp(-t / 0.05))
    body = np.tanh(body * 1.8) / np.tanh(1.8)
    knock = filt(noise(n), sos_bp(300, 1800)) * np.exp(-t / 0.008) * 0.25
    x = filt(body + knock, sos_lp(2200)) * ramp_in(n, 30)
    return fade_tail(x, smp(0.05)) * level


def snare_lofi(level=1.0, tone=196.0):
    n = smp(0.4)
    t = tarr(n)
    body = (sine(tone, n) + 0.45 * sine(tone * 1.6, n)) * np.exp(-t / 0.05)
    nz = filt(noise(n), sos_bp(1300, 6500)) * (0.75 * np.exp(-t / 0.11) + 0.25 * np.exp(-t / 0.02))
    x = (0.5 * body + nz) * ramp_in(n, 12)
    x = filt(x, sos_lp(6500))
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    return fade_tail(x, smp(0.06)) * level * 0.55


def hat_lofi(level=1.0, open_=False):
    x = M.hat(level, open_)
    return filt(x, sos_lp(8500))


def shaker(level=1.0):
    n = smp(0.12)
    t = tarr(n)
    env = np.clip(t / 0.02, 0, 1) * np.exp(-np.clip(t - 0.02, 0, None) / 0.03)
    return filt(noise(n), sos_bp(4500, 11000)) * env * level * 0.35


def crackle(length, density=34, level=1.0):
    n = smp(length)
    x = np.zeros(n)
    count = int(length * density)
    pos = rng.integers(0, max(1, n - 400), count)
    amps = rng.exponential(0.22, count) * rng.choice([-1, 1], count)
    x[pos] = amps
    # 가끔 큰 팝
    big = rng.integers(0, max(1, n - 400), int(length * 0.7))
    x[big] += rng.choice([-1, 1], len(big)) * rng.uniform(0.6, 1.0, len(big))
    x = filt(x, sos_bp(900, 8000)) * 1.4
    hiss = filt(noise(n), sos_bp(1800, 9000)) * 0.010
    rumble = filt(noise(n), sos_lp(60)) * 0.02
    mono = x + hiss + rumble
    return np.stack([mono, np.roll(mono, smp(0.0007)) * 0.9 + filt(noise(n), sos_bp(1800, 9000)) * 0.004], axis=1) * level


def soft_swell(length=0.9):
    """부드러운 심벌 스웰 (다운비트로 빨려 들어감)."""
    c = M.reverse_cymbal(length)
    return filt(c, sos_lp(7000)) * 0.6


def soft_crash(level=1.0):
    c = M.crash(1.0, length=2.2)
    return filt(c, sos_lp(5500)) * level


# ───────────────────────────── 화성 ─────────────────────────────
RH = {   # 루트 없는 로파이 보이싱
    'Fmaj7': ['A3', 'C4', 'E4', 'G4'],
    'Em7': ['G3', 'B3', 'D4', 'F#4'],
    'Dm7': ['F3', 'A3', 'C4', 'E4'],
    'G13': ['F3', 'B3', 'E4', 'A4'],
    'Cmaj9': ['E3', 'G3', 'B3', 'D4'],
    'G6': ['B3', 'D4', 'E4', 'G4'],
    'Am7': ['G3', 'B3', 'C4', 'E4'],
}
ROOT = {'Fmaj7': 'F2', 'Em7': 'E2', 'Dm7': 'D2', 'G13': 'G2', 'Cmaj9': 'C2', 'G6': 'G2', 'Am7': 'A2'}
CH = {1: 'Fmaj7', 2: 'Em7'}
for b, c in zip(range(3, 15), ['Fmaj7', 'Em7', 'Dm7', 'G13', 'Cmaj9', 'Em7', 'Dm7', 'G13', 'Fmaj7', 'Em7', 'Dm7', 'G13']):
    CH[b] = c
for b, c in zip(range(15, 23), ['Fmaj7', 'G6', 'Em7', 'Am7'] * 2):   # 쇼릴 진행으로 콜백
    CH[b] = c
for b, c in zip(range(23, 30), ['Fmaj7', 'Em7', 'Dm7', 'G13', 'Fmaj7', 'G13', 'Cmaj9']):
    CH[b] = c
ACCENT_BARS = [5, 7, 12, 14, 17, 19, 22, 26]


def compose_a():
    n = NA + TAIL
    B = {k: Bus(n) for k in ['rhodes', 'bass', 'kick', 'drums', 'lead', 'arp', 'fx', 'exempt']}

    for bar in range(1, 30):
        ch = CH[bar]
        cold = bar <= 2
        # ── 로즈 컴핑
        if cold:
            B['rhodes'].add(ts(bar, 0), rhodes_chord(RH[ch], BAR * 0.95, vel=0.55, strum=0.03))
            if bar == 2:
                B['rhodes'].add(ts(bar, 10), rhodes_chord(RH[ch][1:], BEAT * 1.2, vel=0.4, strum=0.02), 0.8)
        else:
            v = 0.62 + 0.06 * rng.random()
            B['rhodes'].add(ts(bar, 0, jitter=0.004), rhodes_chord(RH[ch], BEAT * 1.6, vel=v))
            pat = bar % 4
            if pat in (0, 2):
                B['rhodes'].add(ts(bar, 6), rhodes_chord(RH[ch], BEAT * 0.7, vel=0.45), 0.8)
                B['rhodes'].add(ts(bar, 10), rhodes_chord(RH[ch][1:], BEAT * 1.1, vel=0.4), 0.75)
            else:
                B['rhodes'].add(ts(bar, 8), rhodes_chord(RH[ch], BEAT * 1.2, vel=0.48), 0.8)
                B['rhodes'].add(ts(bar, 14), rhodes_chord(RH[CH.get(bar + 1, ch)][2:], BEAT * 0.5, vel=0.35), 0.7)

        if cold:
            continue

        # ── 베이스
        nxt = CH.get(bar + 1, ch)
        B['bass'].add(ts(bar, 0), M.bass_note(ROOT[ch], STEP * 6.5, level=0.9, saw_cut=420, sawl=0.4, attack=0.01,
                                              release=0.07))
        B['bass'].add(ts(bar, 10), M.bass_note(ROOT[ch], STEP * 2.6, level=0.7, saw_cut=420, sawl=0.4, attack=0.01,
                                               release=0.06))
        appr = up(ROOT[nxt], 0)
        B['bass'].add(ts(bar, 14), M.bass_note(appr if bar % 2 else ROOT[ch], STEP * 1.5, level=0.55, saw_cut=520,
                                               sawl=0.45, attack=0.01, release=0.05))

        # ── 드럼 (붐뱁)
        kpat = [[0, 10], [0, 3, 10], [0, 10, 11], [0, 7, 10]][(bar - 3) % 4]
        if bar == 3:
            kpat = [0, 10]
        for s in kpat:
            B['kick'].add(ts(bar, s), kick_lofi(1.0 if s == 0 else 0.78))
        for s in (4, 12):
            if bar == 28 and s == 12:
                continue
            B['drums'].add(ts(bar, s, jitter=0.002), snare_lofi(0.95, tone=196 + rng.uniform(-6, 6)), pan=0.05)
        if bar % 2 == 0:
            B['drums'].add(ts(bar, 15), snare_lofi(0.16), pan=0.1)
        if bar % 4 == 1:
            B['drums'].add(ts(bar, 7), snare_lofi(0.12), pan=0.1)
        acc = [0.42, 0.10, 0.26, 0.12, 0.40, 0.10, 0.28, 0.14, 0.42, 0.10, 0.26, 0.12, 0.40, 0.10, 0.30, 0.16]
        for s in range(16):
            if bar == 28 and s >= 12:
                break
            lv = acc[s] * rng.uniform(0.8, 1.15)
            if s % 2 == 1 and rng.random() < 0.35:
                continue
            if s == 14 and bar % 2 == 1:
                B['drums'].add(ts(bar, s, jitter=0.003), hat_lofi(0.32, open_=True), pan=-0.25)
            else:
                B['drums'].add(ts(bar, s, jitter=0.003), hat_lofi(lv), pan=0.28 if s % 2 else 0.18)
        if bar >= 11:
            for s in (2, 6, 10, 14):
                B['drums'].add(ts(bar, s, jitter=0.004), shaker(0.5), pan=-0.45)

        # ── 훅 콜백 (15~22)
        if 15 <= bar <= 22:
            for s, nm, ln in M.HOOK[ch]:
                f = hz(nm) / 2
                B['lead'].add(ts(bar, s), flute(f, ln * STEP * 1.05, 1.0), 0.95, pan=0.08)
                if bar >= 19:
                    B['lead'].add(ts(bar, s), M.musicbox(hz(nm), 0.55, decay=0.7), 0.35, pan=-0.2)

        # ── 신스 아르페지오 (19~21): 쇼릴 플럭 오마주
        if 19 <= bar <= 21:
            tones = [up(nm) for nm in RH[ch]]
            order = [0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2]
            for s in range(16):
                v = 0.5 if s % 4 == 0 else 0.33
                B['arp'].add(ts(bar, s), M.pluck_st(hz(tones[order[s]]), STEP * 0.8, bright=0.86, decay=0.22), v)

    # ── 3마디 진입
    sw = soft_swell(1.3)
    B['exempt'].add(bar_t(3) - len(sw) / SR, sw, 0.55)
    B['fx'].add(bar_t(3), soft_crash(0.45))
    B['fx'].add(bar_t(3), filt(M.impact(0.5, 1.2), sos_lp(500)), 0.6)

    # ── STEP 악센트
    for b in ACCENT_BARS:
        sw = soft_swell(0.8)
        B['fx'].add(bar_t(b) - len(sw) / SR, sw, 0.32)
        B['fx'].add(bar_t(b), soft_crash(0.22))
        B['fx'].add(bar_t(b), M.tom(0.35, 150, 90), 0.5, pan=-0.2)

    # ── 28마디 박4 필인
    for k, s in enumerate([12, 13, 14, 15]):
        B['drums'].add(ts(28, s), snare_lofi(0.35 + 0.15 * k, tone=200 + 15 * k), pan=-0.15 + 0.1 * k)
    for k, s in enumerate([12.5, 13.5, 14.5]):
        B['drums'].add(ts(28, s, swing=False), M.tom(0.6, 200 - 40 * k, 110 - 18 * k), pan=0.35 - 0.35 * k)

    # ── 29마디 끝 라이저 (테이프 스톱 이후)
    rs = riser_soft(2.25)
    B['exempt'].add(NA / SR - len(rs) / SR, rs, 1.15)
    return B


def tape_wobble(x, depth_ms=1.1, rate=0.55, flutter_ms=0.08, f_rate=6.3):
    n = len(x)
    t = tarr(n)
    d = (depth_ms * (1 + np.sin(2 * np.pi * rate * t + 0.7)) + flutter_ms * np.sin(2 * np.pi * f_rate * t)) * SR / 1000
    pos = np.arange(n) - d
    y = np.zeros_like(x)
    for c in range(x.shape[1]):
        y[:, c] = np.interp(pos, np.arange(n), x[:, c])
    return y


def tape_stop(x, t0, t1):
    i0, i1 = smp(t0), smp(t1)
    L = i1 - i0
    u = np.linspace(0, 1, L, endpoint=False)
    speed = (1 - u) ** 1.7
    pos = i0 + np.cumsum(speed) - speed[0]
    y = x.copy()
    for c in range(x.shape[1]):
        y[i0:i1, c] = np.interp(pos, np.arange(len(x)), x[:, c])
    y[i0:i1] *= (1 - u ** 2.5)[:, None]
    y[i1:] = 0
    return y


def master(x, target, ceiling=-1.7):
    x = x / np.max(np.abs(x))
    gain = 1.0
    y = x
    for it in range(5):
        y = M.limiter(M.soft_clip(x * gain, 0.82), ceiling)
        I, tp = M.measure_lufs(y)
        print(f'  master iter {it}: gain={gain:.3f} I={I:.2f} LUFS TP={tp} dBFS')
        if abs(I - target) < 0.25:
            break
        gain *= 10 ** ((target - I) / 20)
    return M.limiter(y, ceiling)


def render_a():
    B = compose_a()
    n = NA + TAIL
    t = tarr(n)
    # 콜드 오픈: 로즈 멀리서 → 3마디에서 열림
    t3 = bar_t(3)
    B['rhodes'].x = M.sweep(B['rhodes'].x,
                            lambda i: np.where(i / SR < t3 - 0.7, 1300.0,
                                               1300 * (4200 / 1300) ** np.clip((i / SR - (t3 - 0.7)) / 0.7, 0, 1)),
                            'lp', q=0.8, block=256)
    # 오토팬 트레몰로
    trem = 0.2 * np.sin(2 * np.pi * 4.1 * t)
    B['rhodes'].x[:, 0] *= 1 + trem
    B['rhodes'].x[:, 1] *= 1 - trem
    # 킥 사이드체인 (살짝)
    kicks = []
    for bar in range(3, 30):
        kicks.append(ts(bar, 0))
        kicks.append(ts(bar, 10))
    sc = M.sidechain_env(kicks, 0.35, 0.28, n=n)
    for k in ('rhodes', 'lead', 'arp'):
        B[k].x *= sc[:, None]
    B['bass'].x *= M.sidechain_env(kicks, 0.5, 0.2, n=n)[:, None]
    B['arp'].x = filt(B['arp'].x, sos_lp(3200))

    melodic = B['rhodes'].x * 1.0 + B['lead'].x * 0.85 + B['arp'].x * 0.6
    melodic = tape_wobble(melodic)
    drums = B['kick'].x * 0.9 + B['drums'].x * 0.85
    # 드럼 버스 로파이 처리: 살짝 비트 감소 + 로우패스
    held = np.repeat(drums[::2], 2, axis=0)[:n]
    drums = 0.75 * drums + 0.25 * held
    drums = filt(drums, sos_lp(7500))

    ir = M.make_ir(1.8, 2.6, seed=31)
    ir_s = M.make_ir(0.7, 1.0, seed=32)
    wet = M.reverb(melodic * 0.32 + B['fx'].x * 0.25, ir) * 0.5 + M.reverb(B['drums'].x * 0.12, ir_s) * 0.6
    mix = melodic + drums + B['bass'].x * 0.55 + B['fx'].x * 0.7 + wet
    mix = np.tanh(mix * 0.9) / 0.9
    mix = filt(mix, sos_lp(11000))
    mix = filt(mix, sos_hp(30))

    # 29마디 1박 테이프 스톱
    t29 = bar_t(29)
    mix = tape_stop(mix, t29, t29 + BEAT * 1.05)

    # 크래클(테이프 스톱과 무관, 끝까지)
    cr = crackle(n / SR, level=1.0)[:n]
    cr *= np.clip(t / 0.25, 0, 1)[:, None]
    cr_env = np.ones(n)
    i29 = smp(t29)
    cr_env[i29:] = 0.55
    mix += cr * 0.11 * cr_env[:, None]
    mix += B['exempt'].x

    mix = mix[:NA]
    # 끝 클릭 방지 (마지막 6ms)
    e = smp(0.006)
    mix[-e:] *= np.cos(np.linspace(0, np.pi / 2, e))[:, None] ** 2
    mix[:smp(0.01)] *= np.linspace(0, 1, smp(0.01))[:, None]
    y = master(mix, -16.0)
    y[-e:] *= np.cos(np.linspace(0, np.pi / 2, e))[:, None] ** 2
    M.write_wav(os.path.join(OUT_DIR, 'music_a.wav'), y)
    return y


def render_b():
    n = NB + TAIL
    t = tarr(n)
    rh = Bus(n)
    rh.add(0.0, rhodes_chord(['F2', 'C3'] + RH['Fmaj7'], BAR * 0.95, vel=0.5, strum=0.035), 0.9)
    rh.add(BAR, rhodes_chord(['C2', 'G2'] + RH['Cmaj9'] + ['G4'], BAR * 1.2, vel=0.45, strum=0.045), 0.9)
    mb = Bus(n)
    for k, nm in enumerate(['C6', 'E6', 'G6', 'C7']):
        mb.add(BEAT * (1 + 1.5 * k), M.musicbox(hz(nm), 0.8 - 0.08 * k, decay=1.4), 0.8, pan=-0.3 + 0.2 * k)
    melodic = filt(rh.x, sos_lp(3500)) + mb.x * 0.55
    trem = 0.18 * np.sin(2 * np.pi * 3.8 * t)
    melodic[:, 0] *= 1 + trem
    melodic[:, 1] *= 1 - trem
    melodic = tape_wobble(melodic, depth_ms=1.3, rate=0.5)
    wet = M.reverb(melodic * 0.5, M.make_ir(2.6, 3.4, seed=41)) * 0.6
    mix = melodic + wet + crackle(n / SR, level=1.0)[:n] * 0.1
    mix = mix[:NB]
    env = np.clip(tarr(NB) / 0.12, 0, 1)
    i0 = smp(3.2)
    env[i0:] *= np.cos(np.linspace(0, np.pi / 2, NB - i0)) ** 2
    env[-smp(0.01):] = 0
    mix *= env[:, None]
    y = master(mix, -18.0, ceiling=-2.0)
    y *= env[:, None]
    M.write_wav(os.path.join(OUT_DIR, 'music_b.wav'), y)
    return y


# ───────────────────────────── 효과음 ─────────────────────────────
def keystroke(level=1.0, pitch=1.0, space=False):
    n = smp(0.12)
    t = tarr(n)
    click = filt(noise(n), sos_bp(2200 * pitch, 7000)) * np.exp(-t / 0.0025)
    thock_f = (150 if space else 260) * pitch
    thock = sine(thock_f * (1 + 0.3 * np.exp(-t / 0.004)), n) * np.exp(-t / (0.022 if space else 0.014)) * 0.7
    body = filt(noise(n), sos_bp(500, 2200)) * np.exp(-t / 0.008) * 0.45
    x = click * 0.8 + thock + body
    # 바닥 치는 2차 클릭 / 릴리즈
    d = smp(rng.uniform(0.028, 0.045))
    m = n - d
    x[d:] += (filt(noise(m), sos_bp(1800, 6000)) * np.exp(-tarr(m) / 0.002) * 0.35
              + sine(thock_f * 1.3, m) * np.exp(-tarr(m) / 0.008) * 0.2)
    if space:
        x += filt(noise(n), sos_bp(300, 1200)) * np.exp(-t / 0.03) * 0.25
    return fade_tail(x * ramp_in(n, 8), smp(0.01)) * level


def sfx_keys(length=1.6, rate=12.0):
    n = smp(length)
    out = np.zeros((n, 2))
    tcur = 0.02
    k = 0
    while tcur < length - 0.12:
        space = rng.random() < 0.12
        ks = keystroke(rng.uniform(0.55, 1.0), rng.uniform(0.85, 1.2), space)
        out_i = smp(tcur)
        m = min(len(ks), n - out_i)
        pan = rng.uniform(-0.35, 0.35)
        out[out_i:out_i + m] += stereo(ks[:m], pan)
        tcur += (1 / rate) * rng.uniform(0.6, 1.45)
        k += 1
    return out


def sfx_enter():
    n = smp(0.28)
    t = tarr(n)
    x = keystroke(1.0, 0.75, space=True)
    x = np.concatenate([x, np.zeros(n - len(x))])[:n]
    x += sine(110 * (1 + 0.4 * np.exp(-t / 0.005)), n) * np.exp(-t / 0.03) * 0.8
    spring = (np.sin(2 * np.pi * 2650 * t) + 0.5 * np.sin(2 * np.pi * 3900 * t)) * np.exp(-t / 0.045) * 0.06
    i = smp(0.035)
    x[i:] += spring[:n - i]
    return fade_tail(x, smp(0.02))


def sfx_mouse():
    n = smp(0.13)
    t = tarr(n)
    x = np.zeros(n)
    for d, lv, f in [(0.0, 1.0, 3100), (0.065, 0.55, 2700)]:
        i = smp(d)
        m = n - i
        tt = tarr(m)
        x[i:] += lv * (filt(noise(m), sos_bp(f * 0.6, f * 2.2)) * np.exp(-tt / 0.0018)
                       + 0.4 * sine(f * 0.45, m) * np.exp(-tt / 0.004))
    return fade_tail(x * ramp_in(n, 6), smp(0.01))


def sfx_tick():
    n = smp(0.07)
    t = tarr(n)
    x = sine(1750, n) * np.exp(-t / 0.009) + 0.3 * sine(3500, n) * np.exp(-t / 0.004)
    x += filt(noise(n), sos_hp(5000)) * np.exp(-t / 0.0015) * 0.15
    return fade_tail(x * ramp_in(n, 10), smp(0.01)) * 0.8


def sfx_swipe():
    x = M.sfx_whoosh(0.4, 300, 3200, 600)
    return filt(x, sos_lp(5000))


def sfx_paper():
    n = smp(0.22)
    t = tarr(n)
    slap = filt(noise(n), sos_bp(500, 3200)) * np.exp(-t / 0.006)
    thump = sine(105 * (1 + 0.5 * np.exp(-t / 0.004)), n) * np.exp(-t / 0.025) * 0.6
    rustle = filt(noise(n), sos_bp(2500, 8000)) * np.exp(-np.abs(t - 0.03) / 0.02) * 0.18
    x = slap + thump + rustle
    return fade_tail(x * ramp_in(n, 6), smp(0.03))


def sfx_error():
    n = smp(0.5)
    t = tarr(n)
    x = np.zeros(n)
    for d, nm in [(0.0, 'E5'), (0.2, 'C5')]:
        i = smp(d)
        m = smp(0.17)
        tt = tarr(m)
        f = hz(nm) * (1 + 0.012 * np.sin(2 * np.pi * 16 * tt))
        tone = filt(square(f, m, pw=0.42), sos_lp(2200)) * 0.5 + sine(f, m) * 0.5
        env = np.clip(tt / 0.01, 0, 1) * np.clip((0.17 - tt) / 0.04, 0, 1)
        x[i:i + m] += tone * env
    return fade_tail(x, smp(0.02))


def sfx_success():
    n = smp(0.8)
    out = np.zeros(n)
    for k, (d, nm) in enumerate([(0.0, 'C6'), (0.1, 'E6'), (0.2, 'G6')]):
        i = smp(d)
        mb = M.musicbox(hz(nm), 1.0 - 0.1 * k, decay=0.35)
        m = min(len(mb), n - i)
        out[i:i + m] += mb[:m]
        mar = sine(hz(nm) / 2, n - i) * np.exp(-tarr(n - i) / 0.12) * 0.3
        out[i:] += mar
    return fade_tail(out, smp(0.15))


def sfx_rec():
    n = smp(0.4)
    t = tarr(n)
    x = np.zeros(n)
    for d in (0.0, 0.17):
        i = smp(d)
        m = smp(0.085)
        tt = tarr(m)
        env = np.clip(tt / 0.004, 0, 1) * np.clip((0.085 - tt) / 0.01, 0, 1)
        x[i:i + m] += (sine(1046.5, m) + 0.25 * sine(2093, m)) * env
    return fade_tail(x, smp(0.02))


def riser_soft(length=2.6):
    n = smp(length)
    t = tarr(n)
    u = t / length
    fc = lambda idx: 250 * (7000 / 250) ** ((idx / n) ** 1.4)
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = M.sweep(noise(n), fc, 'bp', q=0.9)
    f = 220 * (4.0 ** (u ** 1.8))
    tone = (sine(f, n) + 0.3 * sine(f * 1.5, n) + 0.15 * sine(f * 2.0, n))
    tone = filt(tone, sos_lp(4000))
    out = out * 0.7 + stereo(tone) * 0.35
    out = filt(out, sos_lp(9000))
    env = u ** 2.4
    out *= env[:, None]
    out[:smp(0.01)] *= np.linspace(0, 1, smp(0.01))[:, None]
    e = smp(0.004)
    out[-e:] *= np.linspace(1, 0, e)[:, None]
    return out * 0.7


def render_sfx():
    items = {
        'keys': sfx_keys(),
        'key1': keystroke(1.0, 1.0),
        'enter': sfx_enter(),
        'mouse': sfx_mouse(),
        'tick': sfx_tick(),
        'swipe': sfx_swipe(),
        'paper': sfx_paper(),
        'error': sfx_error(),
        'success': sfx_success(),
        'rec': sfx_rec(),
        'riser_soft': riser_soft(2.6),
    }
    info = {}
    for name, x in items.items():
        x = stereo(np.asarray(x, float))
        x = filt(x, sos_hp(25, 2))
        x[:smp(0.001)] *= np.linspace(0, 1, smp(0.001))[:, None]
        x = fade_tail(x, smp(0.005))
        x = M.norm(x, -3.0)
        M.write_wav(os.path.join(SFX_DIR, f'{name}.wav'), x)
        info[name] = (len(x), len(x) / SR)
    return info


# ───────────────────────────── 검증 ─────────────────────────────
def spectrogram_png(x, path, width=1600, height=420):
    mono = x.mean(axis=1)
    f, tt, Z = signal.stft(mono, SR, nperseg=2048, noverlap=2048 - 512)
    mag = 20 * np.log10(np.abs(Z) + 1e-9)
    # 로그 주파수 축 30Hz~20kHz
    fl = np.geomspace(30, 20000, height)
    idx = np.clip(np.searchsorted(f, fl), 0, len(f) - 1)
    img = mag[idx][::-1]
    cols = np.linspace(0, img.shape[1] - 1, width).astype(int)
    img = img[:, cols]
    v = np.clip((img + 110) / 100, 0, 1)
    rgb = np.stack([np.clip(v * 1.6, 0, 1), np.clip(v * 1.6 - 0.5, 0, 1) ** 0.8, np.clip(v * 2.2 - 1.3, 0, 1)], -1)
    im = Image.fromarray((rgb * 255).astype(np.uint8))
    # 마디 눈금
    px = im.load()
    total = len(mono) / SR
    for b in range(int(total / BAR) + 1):
        xx = int(b * BAR / total * (width - 1))
        for yy in range(0, height, 3):
            px[min(xx, width - 1), yy] = (90, 200, 255)
    im.save(path)


def bar_rms(y):
    out = []
    for b in range(len(y) // BAR_S):
        seg = y[b * BAR_S:(b + 1) * BAR_S]
        out.append(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12))
    return out


if __name__ == '__main__':
    os.makedirs(SFX_DIR, exist_ok=True)
    print('render music_a…')
    ya = render_a()
    print('  samples', len(ya), '(expect', NA, ')')
    print('render music_b…')
    yb = render_b()
    print('  samples', len(yb), '(expect', NB, ')', 'last', yb[-1])
    print('bar RMS (dBFS):')
    for k, r in enumerate(bar_rms(ya)):
        print(f'  bar {k + 1:2d}  {bar_t(k + 1):6.2f}s  {r:6.1f}')
    print('render sfx…')
    for k, (ns, s) in render_sfx().items():
        print(f'  {k}.wav  {s:.3f}s ({ns})')
    spectrogram_png(ya, os.path.join(SCRATCH, 'making_music_a_spec.png'))
    spectrogram_png(yb, os.path.join(SCRATCH, 'making_music_b_spec.png'), width=600)
    print('t29', bar_t(29), 'end', NA / SR)
