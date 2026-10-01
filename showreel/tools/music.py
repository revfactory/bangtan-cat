#!/usr/bin/env python3
"""방탄 쇼릴 배경음악·효과음 합성기.

120 BPM, 4/4, 30마디 = 정확히 60초. 마디 n 의 시작 = (n-1)*2초.
외부 샘플 없이 numpy/scipy 로만 합성한다.

출력
  public/audio/music.wav        44.1kHz 16bit 스테레오, 2,646,000 샘플
  public/audio/sfx/*.wav        단발 효과음 (피크 -3dBFS)
"""
import os
import re
import subprocess
import tempfile

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 44100
BEAT = 0.5
BAR = 2.0
STEP = BAR / 16
DUR = 60.0
N = int(DUR * SR)            # 2,646,000
NT = N + 4 * SR              # 꼬리 렌더링 여유
rng = np.random.default_rng(20261001)

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.normpath(os.path.join(HERE, '..', 'public', 'audio'))
SFX_DIR = os.path.join(AUDIO_DIR, 'sfx')


# ───────────────────────────── 기본 도구 ─────────────────────────────
NOTE_IDX = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
            'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def hz(name):
    m = re.match(r'([A-G][#b]?)(-?\d)$', name)
    midi = 12 * (int(m.group(2)) + 1) + NOTE_IDX[m.group(1)]
    return 440.0 * 2 ** ((midi - 69) / 12)


def up(name, octaves=1):
    m = re.match(r'([A-G][#b]?)(-?\d)$', name)
    return f'{m.group(1)}{int(m.group(2)) + octaves}'


def smp(t):
    return int(round(t * SR))


def bt(bar, step=0.0):
    """마디(1부터)와 16분 스텝으로 초 단위 시각."""
    return (bar - 1) * BAR + step * STEP


def tarr(n):
    return np.arange(n) / SR


def pan_gains(pan):
    a = (pan + 1) * np.pi / 4
    return np.cos(a) * np.sqrt(2), np.sin(a) * np.sqrt(2)


def stereo(x, pan=0.0):
    if x.ndim == 2:
        return x
    l, r = pan_gains(pan)
    return np.stack([x * l, x * r], axis=1)


def ramp_in(n, length):
    e = np.ones(n)
    L = min(n, max(1, length))
    e[:L] = np.linspace(0, 1, L)
    return e


def fade_tail(x, length):
    L = min(len(x), max(1, length))
    x = x.copy()
    w = np.cos(np.linspace(0, np.pi / 2, L)) ** 2
    if x.ndim == 2:
        w = w[:, None]
    x[-L:] *= w
    return x


class Bus:
    def __init__(self, n=NT):
        self.x = np.zeros((n, 2))

    def add(self, t, sig, gain=1.0, pan=0.0):
        sig = stereo(np.asarray(sig, float), pan) * gain
        i = smp(t)
        if i < 0:
            sig = sig[-i:]
            i = 0
        n = min(len(sig), len(self.x) - i)
        if n > 0:
            self.x[i:i + n] += sig[:n]


# ───────────────────────────── 필터 ─────────────────────────────
def sos_lp(fc, order=2):
    return signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')


def sos_hp(fc, order=2):
    return signal.butter(order, fc, 'high', fs=SR, output='sos')


def sos_bp(lo, hi, order=2):
    return signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')


def filt(x, sos):
    return signal.sosfilt(sos, x, axis=0)


def rbj(kind, fc, q):
    fc = float(np.clip(fc, 20, SR * 0.45))
    w0 = 2 * np.pi * fc / SR
    c, s = np.cos(w0), np.sin(w0)
    alpha = s / (2 * q)
    if kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == 'bp':
        b = [alpha, 0, -alpha]
    else:  # hp
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    a = [1 + alpha, -2 * c, 1 - alpha]
    return np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1.0, a[1] / a[0], a[2] / a[0]]])


def sweep(x, fc_of_t, kind='lp', q=0.707, block=128):
    """블록 단위로 계수를 바꾸는 시변 바이쿼드. fc_of_t: 샘플 인덱스 배열 -> Hz."""
    x2 = x if x.ndim == 2 else x[:, None]
    y = np.zeros_like(x2)
    zi = np.zeros((1, 2, x2.shape[1]))
    starts = np.arange(0, len(x2), block)
    fcs = fc_of_t(starts)
    for b, fc in zip(starts, fcs):
        sos = rbj(kind, fc, q)
        y[b:b + block], zi = signal.sosfilt(sos, x2[b:b + block], axis=0, zi=zi)
    return y if x.ndim == 2 else y[:, 0]


# ───────────────────────────── 오실레이터 ─────────────────────────────
def _phase(f, n, ph0):
    dt = np.full(n, f / SR) if np.isscalar(f) else np.asarray(f) / SR
    ph = (ph0 + np.cumsum(dt) - dt) % 1.0
    return ph, dt


def _blep(ph, dt):
    out = np.zeros_like(ph)
    m = ph < dt
    x = ph[m] / dt[m]
    out[m] = x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    out[m] = x * x + x + x + 1
    return out


def saw(f, n, ph0=0.0):
    ph, dt = _phase(f, n, ph0)
    return 2 * ph - 1 - _blep(ph, dt)


def square(f, n, ph0=0.0, pw=0.5):
    ph, dt = _phase(f, n, ph0)
    s = np.where(ph < pw, 1.0, -1.0)
    return s + _blep(ph, dt) - _blep((ph - pw) % 1.0, dt)


def sine(f, n, ph0=0.0):
    ph, _ = _phase(f, n, ph0)
    return np.sin(2 * np.pi * ph)


def noise(n, ch=1):
    return rng.standard_normal(n) if ch == 1 else rng.standard_normal((n, ch))


# ───────────────────────────── 악기 ─────────────────────────────
def kick(level=1.0, soft=False):
    n = smp(0.5)
    t = tarr(n)
    f = 45 + 75 * np.exp(-t / 0.035) + 300 * np.exp(-t / 0.004)
    body = sine(f, n) * np.exp(-t / (0.22 if not soft else 0.16))
    body = np.tanh(body * (2.2 if not soft else 1.4)) / np.tanh(2.2 if not soft else 1.4)
    click = filt(noise(n), sos_hp(2500)) * np.exp(-t / 0.0025) * (0.35 if not soft else 0.08)
    x = (body + click) * ramp_in(n, 20)
    if soft:
        x = filt(x, sos_lp(1800))
    return x * level


def clap(level=1.0):
    n = smp(0.45)
    t = tarr(n)
    env = np.zeros(n)
    for k, d in enumerate([0.0, 0.011, 0.022]):
        i = smp(d)
        env[i:] += np.exp(-(t[:n - i]) / 0.0045) * (0.8 + 0.1 * k)
    i = smp(0.03)
    env[i:] += 0.9 * np.exp(-(t[:n - i]) / 0.13)
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = filt(noise(n), sos_bp(900, 4200)) * env
    return out * level * 0.7


def snare(level=1.0, tone=190.0, tail=0.15):
    n = smp(0.35)
    t = tarr(n)
    body = (sine(tone, n) + 0.5 * sine(tone * 1.72, n)) * np.exp(-t / 0.06)
    nz = filt(noise(n), sos_bp(1500, 9500)) * np.exp(-t / tail)
    return (0.55 * body + nz) * ramp_in(n, 10) * level * 0.6


def rim(level=1.0):
    n = smp(0.12)
    t = tarr(n)
    x = (sine(1700, n) * 0.6 + sine(460, n)) * np.exp(-t / 0.018)
    x += filt(noise(n), sos_hp(3000)) * np.exp(-t / 0.004) * 0.5
    return x * level * 0.5


_HAT_FREQS = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]


def hat(level=1.0, open_=False):
    n = smp(0.45 if open_ else 0.09)
    t = tarr(n)
    metal = sum(square(f * 1.5, n, rng.random()) for f in _HAT_FREQS) / 6
    x = 0.6 * filt(metal, sos_bp(7000, 15000)) + 0.5 * filt(noise(n), sos_hp(7500))
    x *= np.exp(-t / (0.16 if open_ else 0.022)) * ramp_in(n, 8)
    return x * level * 0.5


def crash(level=1.0, length=2.6):
    n = smp(length)
    t = tarr(n)
    out = np.zeros((n, 2))
    for c in range(2):
        metal = sum(square(f, n, rng.random()) for f in [3150, 4270, 5120, 6880, 8470, 3710]) / 6
        x = 0.4 * filt(metal, sos_bp(3500, 14000)) + filt(noise(n), sos_hp(3500))
        env = 0.65 * np.exp(-t / 0.75) + 0.35 * np.exp(-t / 0.08)
        out[:, c] = x * env * ramp_in(n, 15)
    return fade_tail(out, smp(0.3)) * level * 0.35


def impact(level=1.0, length=1.4):
    n = smp(length)
    t = tarr(n)
    boom = sine(32 + 40 * np.exp(-t / 0.09), n) * np.exp(-t / 0.55)
    boom = np.tanh(boom * 1.6)
    nz = filt(noise(n), sos_lp(900)) * np.exp(-t / 0.12) * 0.45
    x = (boom + nz) * ramp_in(n, 20)
    return fade_tail(x, smp(0.2)) * level


def tom(level=1.0, f0=170.0, f1=95.0):
    n = smp(0.35)
    t = tarr(n)
    x = sine(f1 + (f0 - f1) * np.exp(-t / 0.05), n) * np.exp(-t / 0.18)
    x += filt(noise(n), sos_bp(200, 2000)) * np.exp(-t / 0.02) * 0.25
    return x * ramp_in(n, 10) * level * 0.8


def riser(length=2.0, f_lo=300, f_hi=12000, tone=True):
    n = smp(length)
    t = tarr(n)
    u = t / length
    fc = lambda idx: f_lo * (f_hi / f_lo) ** ((idx / n) ** 1.3)
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = sweep(noise(n), fc, 'bp', q=1.2)
    if tone:
        f = 180 * (8.0 ** (u ** 1.6))
        tn = (saw(f, n) * 0.25 + sine(f * 2, n) * 0.2)
        tn = filt(tn, sos_lp(5000))
        out += stereo(tn) * 0.5
    env = u ** 2.2
    return out * env[:, None] * 0.6


def downlifter(length=1.0):
    n = smp(length)
    t = tarr(n)
    u = t / length
    fc = lambda idx: 9000 * (250 / 9000) ** ((idx / n) ** 0.7)
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = sweep(noise(n), fc, 'bp', q=1.5)
    env = (1 - u) ** 2 * ramp_in(n, smp(0.02))
    return out * env[:, None] * 0.6


def reverse_cymbal(length=1.0):
    c = crash(1.0, length=length + 0.4)
    c = c[:smp(length)][::-1].copy()
    u = np.linspace(0, 1, len(c))
    return c * (u ** 1.5)[:, None] * 2.2


def pluck(f, dur, bright=0.93, decay=0.42, level=1.0, release=0.08):
    """가산 합성 플럭: 고차 배음일수록 빨리 사라진다."""
    tail = 0.6
    n = smp(dur + tail)
    t = tarr(n)
    K = int(max(1, min(36, 15000 / f)))
    k = np.arange(1, K + 1)[:, None]
    amp = (1.0 / k) * bright ** (k - 1)
    tau = decay / (1 + 0.45 * (k - 1))
    ph = rng.random((K, 1)) * 0.15
    x = np.sum(amp * np.sin(2 * np.pi * (k * f * t[None, :] + ph)) * np.exp(-t[None, :] / tau), axis=0)
    env = ramp_in(n, smp(0.002))
    off = smp(dur)
    rel = np.ones(n)
    rel[off:] = np.exp(-(t[off:] - dur) / release)
    return x * env * rel * level * 0.6


def pluck_st(f, dur, **kw):
    a = pluck(f, dur, **kw)
    b = pluck(f * 2 ** (8 / 1200), dur, **kw)
    return np.stack([a * 0.8 + b * 0.35, a * 0.35 + b * 0.8], axis=1) * 0.85


def sine_lead(f, dur, level=1.0):
    n = smp(dur + 0.15)
    t = tarr(n)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.2, 0, 1)
    x = sine(f * vib, n) + 0.18 * sine(2 * f * vib, n)
    env = ramp_in(n, smp(0.006))
    off = smp(dur)
    env[off:] *= np.exp(-(t[off:] - dur) / 0.05)
    return x * env * level * 0.5


def square_lead(f, dur, level=1.0):
    n = smp(dur + 0.2)
    t = tarr(n)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    x = filt(square(f * vib, n, pw=0.35), sos_lp(2800))
    env = ramp_in(n, smp(0.02)) * (0.75 + 0.25 * np.exp(-t / 0.2))
    off = smp(dur)
    env[off:] *= np.exp(-(t[off:] - dur) / 0.08)
    return x * env * level * 0.35


def musicbox(f, level=1.0, decay=1.1):
    n = smp(decay * 2.6)
    t = tarr(n)
    idx = 2.2 * np.exp(-t / 0.05) + 0.15
    mod = np.sin(2 * np.pi * f * 3.0 * t) * idx
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / decay)
    x += 0.22 * np.sin(2 * np.pi * f * 4.17 * t) * np.exp(-t / 0.09)   # 금속성 팅
    x += 0.12 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / (decay * 0.5))
    x *= ramp_in(n, smp(0.0015))
    return fade_tail(x, smp(0.2)) * level * 0.5


def supersaw(notes, dur, voices=7, detune=22.0, cutoff=6000.0, attack=0.01, release=0.18,
             level=1.0, width=0.9, sustain_env=None):
    n = smp(dur + release)
    out = np.zeros((n, 2))
    spread = np.linspace(-1, 1, voices)
    for nm in notes:
        f = hz(nm) if isinstance(nm, str) else nm
        for d in spread:
            cents = detune * np.sign(d) * abs(d) ** 1.3
            s = saw(f * 2 ** (cents / 1200), n, rng.random())
            gain = 1.0 if d == 0 else 0.72
            out += stereo(s, d * width) * gain
    out /= np.sqrt(voices * len(notes)) * 2.2
    if cutoff:
        out = filt(out, sos_lp(cutoff, 2))
    t = tarr(n)
    env = ramp_in(n, smp(attack))
    if sustain_env is not None:
        env = env * sustain_env(t)
    off = smp(dur)
    env[off:] *= np.exp(-(t[off:] - dur) / (release / 3))
    return out * env[:, None] * level


def bass_note(name, dur, level=1.0, saw_cut=650, sub=1.0, sawl=0.45, attack=0.006, release=0.08):
    f = hz(name)
    n = smp(dur + release * 4)
    t = tarr(n)
    s = sine(f, n) * sub
    b = filt(saw(f, n) + 0.5 * saw(f * 1.005, n, 0.3), sos_lp(saw_cut, 2)) * sawl
    env = ramp_in(n, smp(attack))
    off = smp(dur)
    env[off:] *= np.exp(-(t[off:] - dur) / release)
    return np.tanh((s + b) * 1.2) * env * level


def blip(f, level=1.0):
    n = smp(0.4)
    t = tarr(n)
    ff = f * (1 + 0.04 * np.exp(-t / 0.01))
    x = (sine(ff, n) + 0.35 * sine(2 * ff, n) + 0.12 * sine(3 * ff, n)) * np.exp(-t / 0.13)
    return x * ramp_in(n, smp(0.002)) * level * 0.5


def crackle(length):
    n = smp(length)
    x = np.zeros(n)
    count = int(length * 38)
    pos = rng.integers(0, n - 200, count)
    amps = rng.exponential(0.25, count) * rng.choice([-1, 1], count)
    x[pos] = amps
    x = filt(x, sos_bp(1200, 9000)) * 1.5
    hiss = filt(noise(n), sos_bp(2000, 9000)) * 0.012
    return x + hiss


# ───────────────────────────── 리버브·다이나믹 ─────────────────────────────
def make_ir(rt60=1.8, length=2.6, predelay=0.018, seed=3):
    g = np.random.default_rng(seed)
    n = smp(length)
    t = tarr(n)
    bright = g.standard_normal((n, 2)) * np.exp(-6.9 * t / (rt60 * 0.45))[:, None]
    dark = filt(g.standard_normal((n, 2)), sos_lp(3200)) * np.exp(-6.9 * t / rt60)[:, None]
    ir = 0.6 * bright + dark
    ir = filt(ir, sos_hp(220))
    ir[:smp(0.004)] *= np.linspace(0, 1, smp(0.004))[:, None]
    ir = np.concatenate([np.zeros((smp(predelay), 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir):
    y = signal.fftconvolve(x, ir, axes=0)[:len(x)]
    return y


def sidechain_env(kick_times, depth, release, n=NT):
    g = np.zeros(n)
    L = smp(release)
    shape = (1 - np.linspace(0, 1, L)) ** 2
    a = smp(0.004)
    shape[:a] *= np.linspace(0.3, 1, a)
    for tk in kick_times:
        i = smp(tk)
        m = min(L, n - i)
        g[i:i + m] = np.maximum(g[i:i + m], shape[:m])
    return 1 - depth * g


def gate_env(windows, n=NT, fade=0.006):
    """windows: [(t0, t1, level)] 구간 동안 이득을 level 로."""
    e = np.ones(n)
    F = smp(fade)
    for t0, t1, lv in windows:
        i0, i1 = smp(t0), smp(t1)
        e[i0:i1] = np.minimum(e[i0:i1], lv)
        lo = max(0, i0 - F)
        e[lo:i0] = np.minimum(e[lo:i0], np.linspace(1, lv, i0 - lo))
        hi = min(n, i1 + F)
        e[i1:hi] = np.minimum(e[i1:hi], np.linspace(lv, 1, hi - i1))
    return e


def soft_clip(x, thr=0.8):
    a = np.abs(x)
    over = a > thr
    y = x.copy()
    y[over] = np.sign(x[over]) * (thr + (1 - thr) * np.tanh((a[over] - thr) / (1 - thr)))
    return y


def limiter(x, ceiling_db=-1.0, look=0.004, release=0.09):
    ceil = 10 ** (ceiling_db / 20)
    # 4배 오버샘플링으로 인터샘플(트루) 피크까지 검출
    os4 = signal.resample_poly(x, 4, 1, axis=0)
    peak = np.max(np.abs(os4[:len(x) * 4]).reshape(len(x), 4, 2), axis=(1, 2))
    peak = np.maximum(peak, np.max(np.abs(x), axis=1))
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-12))
    L = smp(look)
    g = minimum_filter1d(need, size=2 * L + 1, mode='nearest')
    # 즉시 어택·지수 릴리즈: u = 1-g 의 감쇠 피크 홀드를 로그 누적최대로 계산
    a = np.exp(-1.0 / (release * SR))
    d = np.maximum(1 - g, 1e-12)
    k = np.arange(len(d))
    la = np.log(a)
    u = np.exp(k * la + np.maximum.accumulate(np.log(d) - k * la))
    r = np.minimum(g, 1 - u)
    r = uniform_filter1d(r, size=L, mode='nearest')
    r = np.minimum(r, g)
    return x * r[:, None]


def measure_lufs(x):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        path = f.name
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true',
                        '-f', 'null', '-'], capture_output=True, text=True)
    os.unlink(path)
    txt = p.stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', txt)[-1])
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', txt)
    return I, float(tp[-1]) if tp else None


def write_wav(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).round().astype(np.int16))


# ───────────────────────────── 곡 구성 ─────────────────────────────
CHORD_OF_BAR = {1: 'Fmaj7', 2: 'Gsus4', 3: 'Fmaj7', 4: 'G6', 5: 'Fmaj7', 6: 'G6', 7: 'Em7', 8: 'Am7'}
for b, c in zip(range(9, 15), ['Fmaj7', 'G6', 'Em7', 'Am7', 'Fmaj7', 'G6']):
    CHORD_OF_BAR[b] = c
for b, c in zip(range(15, 27), ['Fmaj7', 'G6', 'Em7', 'Am7'] * 3):
    CHORD_OF_BAR[b] = c
CHORD_OF_BAR.update({27: 'Fmaj7', 28: 'G6', 29: 'C', 30: 'C'})

VOICING = {
    'Fmaj7': ['F3', 'A3', 'C4', 'E4'], 'G6': ['G3', 'B3', 'D4', 'E4'],
    'Em7': ['E3', 'G3', 'B3', 'D4'], 'Am7': ['A3', 'C4', 'E4', 'G4'],
    'C': ['C3', 'E3', 'G3', 'C4', 'E4'], 'Gsus4': ['G3', 'C4', 'D4', 'G4'], 'G': ['G3', 'B3', 'D4', 'G4'],
}
ROOT = {'Fmaj7': 'F2', 'G6': 'G2', 'Em7': 'E2', 'Am7': 'A2', 'C': 'C2', 'Gsus4': 'G2', 'G': 'G2'}
HOOK = {
    'Fmaj7': [(0, 'A5', 2), (3, 'C6', 2), (6, 'A5', 1), (7, 'G5', 2), (10, 'F5', 2), (12, 'G5', 1), (14, 'A5', 2)],
    'G6': [(0, 'B5', 2), (3, 'D6', 2), (6, 'B5', 1), (7, 'A5', 2), (10, 'G5', 4)],
    'Em7': [(0, 'G5', 2), (3, 'B5', 2), (6, 'G5', 1), (7, 'E5', 2), (10, 'D5', 2), (12, 'E5', 1), (14, 'G5', 2)],
    'Am7': [(0, 'A5', 3), (3, 'C6', 3), (6, 'E6', 4), (12, 'D6', 2), (14, 'C6', 2)],
}
MUSICBOX = {   # CH1: 한 옥타브 위, 느린 리듬
    'Fmaj7': [(0, 'A6', 4), (4, 'C7', 2), (6, 'A6', 2), (8, 'G6', 4), (12, 'F6', 4)],
    'G6': [(0, 'B6', 4), (4, 'D7', 2), (6, 'B6', 2), (8, 'A6', 4), (12, 'G6', 4)],
    'Em7': [(0, 'G6', 4), (4, 'B6', 2), (6, 'G6', 2), (8, 'E6', 4), (12, 'D6', 4)],
    'Am7': [(0, 'A6', 4), (4, 'C7', 4), (8, 'E7', 4)],
}
COUNTER = {    # 19마디부터 카운터 멜로디
    'Fmaj7': [(0, 'C5', 6), (6, 'E5', 4), (10, 'F5', 6)],
    'G6': [(0, 'D5', 6), (6, 'G5', 4), (10, 'E5', 6)],
    'Em7': [(0, 'B4', 6), (6, 'E5', 4), (10, 'G5', 6)],
    'Am7': [(0, 'C5', 6), (6, 'E5', 4), (10, 'A5', 6)],
}


def chorus_voicing(ch):
    v = VOICING[ch]
    return v + [up(v[-2]), up(v[-1])]


def compose():
    B = {k: Bus() for k in ['kick', 'drums', 'bass', 'chords', 'pad', 'lead', 'arp', 'fx', 'ch1', 'glitch',
                            'exempt']}
    sends = {'drums': 0.18, 'chords': 0.14, 'pad': 0.3, 'lead': 0.28, 'arp': 0.25, 'fx': 0.2, 'glitch': 0.15}
    four_floor = []   # 사이드체인 기준 킥 시각
    marks = {}

    # ── 인트로 (1~2마디) ──
    pad_notes = VOICING['Fmaj7']
    p1 = supersaw(pad_notes, 2.0, voices=5, detune=14, cutoff=None, attack=0.5, release=0.3, level=0.9)
    p2a = supersaw(VOICING['Gsus4'], 1.0, voices=5, detune=14, cutoff=None, attack=0.05, release=0.15, level=0.9)
    p2b = supersaw(VOICING['G'], 0.5, voices=5, detune=14, cutoff=None, attack=0.05, release=0.45, level=0.9)
    intro = Bus(smp(4.6))
    intro.add(0.0, p1)
    intro.add(2.0, p2a)
    intro.add(3.0, p2b)
    nI = len(intro.x)
    intro_f = sweep(intro.x, lambda i: 380 * (5200 / 380) ** np.clip(i / smp(3.4), 0, 1) ** 1.4, 'lp', q=1.1)
    intro_f *= np.clip(1 - (tarr(nI) - 3.45) / 0.4, 0.04, 1)[:, None]   # 박4: 빨려 들어가듯 사라짐
    B['pad'].add(0.0, intro_f, 1.3)
    for k in range(8):       # 가벼운 틱
        B['drums'].add(bt(1, 2 * k), hat(0.35 if k % 2 == 0 else 0.22), pan=0.3 if k % 2 else -0.3)
    for k, (nm, ft) in enumerate([('C5', 150), ('E5', 165), ('G5', 185)]):  # 카운트다운 3,2,1
        t0 = bt(2, 4 * k)
        B['fx'].add(t0, blip(hz(nm), 1.0), 0.75)
        B['fx'].add(t0, tom(0.9, ft * 1.6, ft * 0.65), 0.7)
        B['kick'].add(t0, kick(0.55, soft=True))
    rc = reverse_cymbal(1.0)
    B['exempt'].add(4.0 - len(rc) / SR, rc, 0.9)
    rs = riser(1.5, 400, 9000, tone=False)
    B['exempt'].add(4.0 - len(rs) / SR, rs, 0.35)
    marks['countdown'] = [2.0, 2.5, 3.0]

    # ── 공통 드럼 패턴 ──
    def floor_bar(bar, clap_lv=1.0, hats16=True, open_hat=False, kick_beats=(0, 1, 2, 3), clap_beats=(1, 3)):
        for b in kick_beats:
            t0 = bt(bar, 4 * b)
            B['kick'].add(t0, kick(1.0))
            four_floor.append(t0)
        for b in clap_beats:
            B['drums'].add(bt(bar, 4 * b), clap(clap_lv))
            B['drums'].add(bt(bar, 4 * b), snare(0.35 * clap_lv))
        for s in range(16):
            if hats16:
                acc = [0.55, 0.22, 0.38, 0.22][s % 4]
                B['drums'].add(bt(bar, s), hat(acc), pan=0.25 if s % 2 else -0.15)
            elif s % 4 == 2:
                B['drums'].add(bt(bar, s), hat(0.45), pan=0.2)
            if open_hat and s % 4 == 2:
                B['drums'].add(bt(bar, s), hat(0.45, open_=True), pan=-0.2)

    def fill(bar, kind='snare'):
        if kind == 'snare':
            for k, s in enumerate(range(12, 16)):
                B['drums'].add(bt(bar, s), snare(0.45 + 0.15 * k, tone=190 + 12 * k), pan=-0.1 + 0.07 * k)
        for k, s in enumerate([12, 13.5, 15]):
            B['drums'].add(bt(bar, s), tom(0.8, 230 - 45 * k, 120 - 18 * k), pan=0.4 - 0.4 * k)

    # ── 타이틀 드롭 (3~4마디) ──
    for bar in (3, 4):
        ch = CHORD_OF_BAR[bar]
        floor_bar(bar, kick_beats=(0, 1, 2, 3) if bar == 3 else (0, 1, 2), clap_beats=(1, 3) if bar == 3 else (1,),
                  open_hat=True)
        B['chords'].add(bt(bar), supersaw(chorus_voicing(ch), 2.0, cutoff=7000, level=1.0))
        B['bass'].add(bt(bar), bass_note(ROOT[ch], 2.0 if bar == 3 else 1.5))
        for s, nm, ln in HOOK[ch]:
            B['lead'].add(bt(bar, s), pluck_st(hz(nm), ln * STEP), 0.9)
            B['lead'].add(bt(bar, s), sine_lead(hz(nm), ln * STEP), 0.35)
    B['fx'].add(4.0, crash(1.0))
    B['fx'].add(4.0, impact(0.85))
    fill(4, kind='toms')
    dl = downlifter(1.2)
    B['fx'].add(bt(4, 12), dl, 0.7)
    marks['drop'] = 4.0

    # ── CH1 아기 시절 (5~8마디, 8~16초): 별도 버스 → 테이프 스톱 ──
    ch1 = B['ch1']
    for bar in range(5, 9):
        ch = CHORD_OF_BAR[bar]
        last = bar == 8
        ch1.add(bt(bar), supersaw(VOICING[ch], 2.0, voices=3, detune=9, cutoff=1300, attack=0.25, release=0.5,
                                   level=0.75))
        ch1.add(bt(bar), bass_note(ROOT[ch], 1.9, level=0.22, saw_cut=300, sawl=0.15, attack=0.08, release=0.2))
        for s, nm, ln in MUSICBOX[ch]:
            ch1.add(bt(bar, s), musicbox(hz(nm), 0.95), pan=0.12)
        # 뮤직박스 반주: 8분 분산화음
        tones = [up(n_) for n_ in VOICING[ch]]
        order = [0, 2, 1, 3, 2, 1, 3, 2]
        for k in range(8 if not last else 6):
            ch1.add(bt(bar, 2 * k), musicbox(hz(tones[order[k]]), 0.32, decay=0.6), pan=-0.25)
        # 로파이 하프타임 비트
        ch1.add(bt(bar, 0), kick(0.42, soft=True))
        ch1.add(bt(bar, 8), kick(0.36, soft=True))
        if not last:
            ch1.add(bt(bar, 10.5), kick(0.2, soft=True))
        ch1.add(bt(bar, 4), rim(0.8), pan=0.15)
        ch1.add(bt(bar, 12), rim(0.8), pan=0.15)
        for s in range(0, 16, 2):
            sh = filt(hat(0.18), sos_lp(7000))
            ch1.add(bt(bar, s + (0.2 if s % 4 else 0)), sh, pan=-0.3)
    cr = crackle(8.3)
    cr *= np.clip(tarr(len(cr)) / 0.4, 0, 1)
    ch1.add(8.0, cr, 0.55)
    marks['ch1'] = 8.0

    # ── CH2 캐릭터 소개 (9~14마디, 16~28초) ──
    B['fx'].add(16.0, crash(0.55))
    for bar in range(9, 15):
        ch = CHORD_OF_BAR[bar]
        kb = (0, 1, 2, 3) if bar < 14 else (0, 1, 2)
        floor_bar(bar, clap_lv=0.85, hats16=True, kick_beats=kb, clap_beats=(1, 3) if bar < 14 else (1,))
        B['chords'].add(bt(bar), supersaw(VOICING[ch], 2.0, cutoff=None, level=0.62, attack=0.02), 1.0)
        # 오프비트 베이스 + 서브
        B['bass'].add(bt(bar), bass_note(ROOT[ch], 2.0 if bar < 14 else 1.5, sawl=0.0, level=0.75))
        for b in range(4 if bar < 14 else 3):
            B['bass'].add(bt(bar, 4 * b + 2), bass_note(up(ROOT[ch]), STEP * 1.6, sub=0.0, sawl=0.9, saw_cut=1400,
                                                         level=0.5))
        tones = [up(n_) for n_ in VOICING[ch]] + [up(VOICING[ch][0], 2)]
        pat = [0, 1, 2, 3, 4, 3, 2, 1] * 2 if bar % 2 else [0, 2, 1, 3, 2, 4, 3, 1] * 2
        for s in range(16 if bar < 14 else 12):
            B['arp'].add(bt(bar, s), pluck_st(hz(tones[pat[s]]), STEP * 0.9, bright=0.88, decay=0.25),
                         0.55 if s % 4 == 0 else 0.4)
    # 13~14마디 빌드업: 스네어 롤 가속 + 라이저
    roll = [(13, s, 0.25) for s in (0, 4)] + [(13, s, 0.3) for s in (8, 10, 12, 14)]
    roll += [(14, s, 0.4) for s in range(0, 8)]
    roll += [(14, 8 + 0.5 * k, 0.5) for k in range(8)]
    roll += [(14, 12 + 0.5 * k, 0.6) for k in range(4)]
    for k, (bar, s, lv) in enumerate(roll):
        B['drums'].add(bt(bar, s), snare(lv + 0.15 * k / len(roll), tone=180 + 90 * k / len(roll)))
    rs = riser(3.75, 300, 13000)
    B['fx'].add(24.0, rs, 0.75)
    marks['ch2'] = 16.0

    # ── CH3 방탄의 하루 (15~22마디, 28~44초) 풀 코러스 ──
    for bar in range(15, 23):
        ch = CHORD_OF_BAR[bar]
        last = bar == 22
        floor_bar(bar, clap_lv=1.0, hats16=True, open_hat=True, kick_beats=(0, 1, 2) if last else (0, 1, 2, 3),
                  clap_beats=(1,) if last else (1, 3))
        B['chords'].add(bt(bar), supersaw(chorus_voicing(ch), 2.0, cutoff=7500, level=1.0))
        B['bass'].add(bt(bar), bass_note(ROOT[ch], 2.0 if not last else 1.5))
        for s, nm, ln in HOOK[ch]:
            B['lead'].add(bt(bar, s), pluck_st(hz(nm), ln * STEP), 0.9)
            B['lead'].add(bt(bar, s), sine_lead(hz(nm), ln * STEP), 0.35)
        if bar >= 19:
            for s, nm, ln in COUNTER[ch]:
                B['lead'].add(bt(bar, s), stereo(square_lead(hz(nm), ln * STEP), -0.35), 0.55)
    for t0 in (28.0, 36.0):
        B['fx'].add(t0, crash(1.0 if t0 == 28.0 else 0.75))
    B['fx'].add(28.0, impact(0.8))
    fill(22)
    marks['ch3'] = 28.0

    # ── CH4 스타일 실험실 (23~26마디, 44~52초) 글리치 브레이크 ──
    G = B['glitch']
    glitch_kicks = []
    for bar in range(23, 27):
        ch = CHORD_OF_BAR[bar]
        last = bar == 26
        ksteps = [0, 10] if bar % 2 else [0, 3, 10]
        for s in ksteps:
            if last and s >= 8:
                continue
            G.add(bt(bar, s), kick(1.0))
            glitch_kicks.append(bt(bar, s))
        G.add(bt(bar, 8), clap(1.0))
        G.add(bt(bar, 8), snare(0.6))
        for s in range(0, 16, 2):
            if last and s >= 8:
                break
            G.add(bt(bar, s), hat(0.4), pan=0.2)
        # 16분 스터터 롤
        roll_start = {23: 12, 24: 6, 25: 12, 26: None}[bar]
        if roll_start is not None:
            for k in range(8):
                G.add(bt(bar, roll_start + 0.5 * k), hat(0.25 + 0.05 * k), pan=-0.4 + 0.1 * k)
        # 게이트 코드 스탭
        gate = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]
        for s, g_ in enumerate(gate):
            if g_ and not (last and s >= 8):
                G.add(bt(bar, s), supersaw(VOICING[ch], STEP * 0.8, cutoff=3500, level=0.85, release=0.05))
        # 와블 베이스
        n_b = smp(2.0 if not last else 1.0)
        f = hz(ROOT[ch])
        wb = saw(f, n_b) * 0.7 + square(f * 0.5, n_b, pw=0.5) * 0.5 + saw(f * 1.007, n_b, 0.4) * 0.4
        tt = tarr(n_b)
        rate = np.where(tt < 1.0, 4.0, np.where(tt < 1.5, 8.0, 6.0))
        ph = np.cumsum(rate) / SR
        lfo = 0.5 - 0.5 * np.cos(2 * np.pi * ph)
        wb = sweep(wb, lambda idx: 160 * (2600 / 160) ** lfo[np.minimum(idx, n_b - 1)], 'lp', q=4.0, block=64)
        wb = np.tanh(wb * 1.4) * ramp_in(n_b, 40)
        wb = fade_tail(wb, smp(0.02))
        B['bass'].add(bt(bar), wb, 0.42)
        B['bass'].add(bt(bar), bass_note(ROOT[ch], 2.0 if not last else 1.0, sawl=0.0, level=0.55))
        # 비트크러시 훅
        for s, nm, ln in HOOK[ch]:
            if last and s >= 8:
                continue
            p = pluck(hz(nm), ln * STEP, bright=0.9)
            held = np.repeat(p[::5], 5)[:len(p)]
            crushed = np.round(held * 24) / 24
            G.add(bt(bar, s), crushed * 0.75 + p * 0.25, 0.85, pan=0.1)
    # 26마디 후반: 라이저 + 스네어 롤
    for k in range(4):
        G.add(bt(26, 8 + k), snare(0.4 + 0.08 * k, tone=200 + 10 * k))
    for k in range(8):
        G.add(bt(26, 12 + 0.5 * k), snare(0.65 + 0.04 * k, tone=240 + 10 * k))
    B['fx'].add(50.0, riser(1.75, 400, 12000), 0.8)
    B['fx'].add(44.0, crash(0.7))
    B['fx'].add(44.0, impact(0.6))
    marks['ch4'] = 44.0

    # ── 아웃트로 (27~30마디, 52~60초) ──
    for bar in (27, 28):
        ch = CHORD_OF_BAR[bar]
        floor_bar(bar, open_hat=True, kick_beats=(0, 1, 2, 3) if bar == 27 else (0, 1, 2),
                  clap_beats=(1, 3) if bar == 27 else (1,))
        B['chords'].add(bt(bar), supersaw(chorus_voicing(ch), 2.0, cutoff=8000, level=1.0))
        B['bass'].add(bt(bar), bass_note(ROOT[ch], 2.0 if bar == 27 else 1.5))
        for s, nm, ln in HOOK[ch]:
            B['lead'].add(bt(bar, s), pluck_st(hz(nm), ln * STEP), 0.9)
            B['lead'].add(bt(bar, s), sine_lead(hz(nm), ln * STEP), 0.35)
        for s, nm, ln in COUNTER[ch]:
            B['lead'].add(bt(bar, s), stereo(square_lead(hz(nm), ln * STEP), -0.35), 0.55)
    B['fx'].add(52.0, crash(1.0))
    B['fx'].add(52.0, impact(0.8))
    fill(28)
    # 29마디 최종 히트 (56초)
    B['kick'].add(56.0, kick(1.1))
    B['fx'].add(56.0, crash(1.1, length=3.6))
    B['fx'].add(56.0, impact(1.0, length=2.4))
    decay_env = lambda t: np.exp(-t / 1.6)
    B['chords'].add(56.0, supersaw(['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5'], 3.6, cutoff=7000, level=1.05,
                                   sustain_env=decay_env, release=0.4))
    B['pad'].add(56.0, supersaw(VOICING['C'], 3.4, voices=5, detune=12, cutoff=2400, attack=0.05, release=0.6,
                                level=0.6, sustain_env=lambda t: np.exp(-t / 3.0)))
    B['bass'].add(56.0, bass_note('C2', 2.6, release=0.6) * np.exp(-tarr(smp(2.6 + 2.4)) / 1.4))
    B['lead'].add(56.0, pluck_st(hz('C6'), 0.5, decay=0.8), 0.9)
    B['lead'].add(56.0, pluck_st(hz('E5'), 0.5, decay=0.8), 0.5)
    for k, (t0, nm) in enumerate([(56.5, 'C6'), (57.0, 'E6'), (57.5, 'G6'), (58.0, 'C7')]):
        B['lead'].add(t0, musicbox(hz(nm), 0.9 - 0.08 * k, decay=1.3), 0.95, pan=-0.3 + 0.2 * k)
    marks['outro'] = 52.0
    marks['final_hit'] = 56.0
    return B, sends, four_floor, glitch_kicks, marks


def tape_stop(x, t0, t1):
    i0, i1 = smp(t0), smp(t1)
    L = i1 - i0
    u = np.linspace(0, 1, L, endpoint=False)
    speed = (1 - u) ** 1.6
    pos = i0 + np.cumsum(speed) - speed[0]
    y = x.copy()
    for c in range(2):
        y[i0:i1, c] = np.interp(pos, np.arange(len(x)), x[:, c])
    y[i0:i1] *= (1 - u ** 3)[:, None]
    y[i1:] = 0
    return y


def stutter(x, t_src, slice_len, t0, t1):
    """t_src 에서 slice_len 만큼 잘라 t0~t1 동안 반복."""
    i_src, L = smp(t_src), smp(slice_len)
    piece = x[i_src:i_src + L].copy()
    fade = smp(0.002)
    piece[:fade] *= np.linspace(0, 1, fade)[:, None]
    piece[-fade:] *= np.linspace(1, 0, fade)[:, None]
    i0, i1 = smp(t0), smp(t1)
    x[i0:i1] = 0
    p = i0
    while p < i1:
        m = min(L, i1 - p)
        x[p:p + m] = piece[:m]
        p += L
    return x


def render_music():
    B, sends, four_floor, glitch_kicks, marks = compose()

    # 사이드체인
    sc_chords = sidechain_env(four_floor, 0.82, 0.32)
    sc_bass = sidechain_env(four_floor + glitch_kicks, 0.7, 0.22)
    sc_arp = sidechain_env(four_floor, 0.45, 0.25)
    B['chords'].x *= sc_chords[:, None]
    B['pad'].x *= sidechain_env(four_floor, 0.5, 0.3)[:, None]
    B['bass'].x *= sc_bass[:, None]
    B['arp'].x *= sc_arp[:, None]
    B['lead'].x *= sidechain_env(four_floor, 0.25, 0.15)[:, None]

    # CH2 빌드업 필터 상승 (13~14마디)
    t_all = np.arange(NT)

    def build_fc(idx):
        t = idx / SR
        u = np.clip((t - 24.0) / 3.5, 0, 1)
        return np.where(t < 24.0, 2600.0, 2600 * (14000 / 2600) ** (u ** 1.5))
    seg = slice(smp(16.0), smp(29.0))
    for k in ('chords', 'arp'):
        part = B[k].x[seg]
        B[k].x[seg] = sweep(part, lambda i: build_fc(i + smp(16.0)), 'lp', q=0.9, block=256)

    # 글리치 스터터 (24마디 박4, 25마디 박2 후반)
    G = B['glitch'].x
    stutter(G, bt(24, 12), STEP / 2, bt(24, 12), bt(25, 0))
    stutter(G, bt(25, 6), STEP / 4, bt(25, 6), bt(25, 8))

    # CH1 테이프 스톱
    B['ch1'].x = tape_stop(B['ch1'].x, 15.5, 16.0)

    # 리버브
    ir_big = make_ir(2.2, 3.0, seed=11)
    ir_small = make_ir(1.0, 1.6, seed=12)
    wet = np.zeros((NT, 2))
    for k, s in sends.items():
        wet += B[k].x * s
    rev = reverb(wet, ir_big) * 0.55
    ch1_wet = reverb(B['ch1'].x * 0.35, ir_small)
    ch1_wet[smp(16.25):] *= np.exp(-tarr(NT - smp(16.25)) / 0.15)[:, None]

    mix = (B['kick'].x * 0.78 + B['drums'].x * 1.15 + B['bass'].x * 0.5 + B['chords'].x * 1.15
           + B['pad'].x * 0.8 + B['lead'].x * 0.95 + B['arp'].x * 1.25 + B['fx'].x * 0.8
           + B['glitch'].x * 0.8 + rev)
    # CH1 은 코러스(28~44초)보다 체감 7dB 낮게 자동 정렬 (120Hz 이하 제외하고 비교)
    def loud(x, t0, t1):
        seg = filt(x[smp(t0):smp(t1)], sos_hp(120, 2))
        return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)
    ch1_sum = B['ch1'].x + ch1_wet
    g1 = 10 ** ((loud(mix, 28.0, 44.0) - 7.0 - loud(ch1_sum, 8.0, 15.5)) / 20)
    print(f'  ch1 bus gain {20 * np.log10(g1):+.1f} dB')
    mix += ch1_sum * g1

    # 브레이크(무음) 구간
    gates = [(3.55, 4.0, 0.05), (27.75, 28.0, 0.0), (51.75, 52.0, 0.0)]
    mix *= gate_env(gates)[:, None]
    mix += B['exempt'].x

    mix = filt(mix, sos_hp(28, 2))
    mix = mix[:N]
    # 마지막 페이드 59→60초
    fade = np.ones(N)
    i0 = smp(59.0)
    fade[i0:] = np.cos(np.linspace(0, np.pi / 2, N - i0)) ** 2
    fade[-smp(0.01):] = 0
    mix *= fade[:, None]

    # 마스터: 라우드니스 맞추기
    mix /= np.max(np.abs(mix))
    gain = 1.0
    target = -14.0
    for it in range(4):
        y = limiter(soft_clip(mix * gain, 0.85), -1.2)
        I, tp = measure_lufs(y)
        print(f'  master iter {it}: gain={gain:.3f} I={I:.2f} LUFS TP={tp} dBFS')
        if abs(I - target) < 0.3:
            break
        gain *= 10 ** ((target - I) / 20)
    y = limiter(y, -1.2)
    write_wav(os.path.join(AUDIO_DIR, 'music.wav'), y)
    return y, marks


# ───────────────────────────── 효과음 ─────────────────────────────
def norm(x, peak_db=-3.0):
    return x / np.max(np.abs(x)) * 10 ** (peak_db / 20)


def sfx_whoosh(length, f_lo=350, f_hi=4500, f_end=700):
    n = smp(length)
    u = np.linspace(0, 1, n)
    peak_at = 0.58

    def fc(idx):
        v = idx / n
        return np.where(v < peak_at, f_lo * (f_hi / f_lo) ** (v / peak_at),
                        f_hi * (f_end / f_hi) ** ((v - peak_at) / (1 - peak_at)))
    x = sweep(noise(n), fc, 'bp', q=1.4)
    x2 = sweep(noise(n), lambda i: fc(i) * 1.6, 'bp', q=2.5) * 0.4
    env = np.where(u < peak_at, (u / peak_at) ** 2.2, ((1 - u) / (1 - peak_at)) ** 1.6)
    mono = (x + x2) * env
    pan = np.linspace(-0.8, 0.8, n)
    a = (pan + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def sfx_pop(f0, f1, length=0.15):
    n = smp(length)
    t = tarr(n)
    f = f0 * (f1 / f0) ** np.clip(t / 0.05, 0, 1)
    x = sine(f, n) * np.exp(-t / 0.035) * ramp_in(n, smp(0.001))
    x += filt(noise(n), sos_bp(2000, 8000)) * np.exp(-t / 0.002) * 0.3
    return fade_tail(x, smp(0.02))


def sfx_click():
    n = smp(0.05)
    t = tarr(n)
    x = sine(2600, n) * np.exp(-t / 0.006) + filt(noise(n), sos_hp(4000)) * np.exp(-t / 0.0015) * 0.6
    return fade_tail(x * ramp_in(n, 10), smp(0.01))


def sfx_shutter():
    n = smp(0.3)
    t = tarr(n)
    x = np.zeros(n)
    for d, lv in [(0.0, 1.0), (0.012, 0.5), (0.075, 0.8), (0.085, 0.35)]:
        i = smp(d)
        m = n - i
        tt = t[:m]
        x[i:] += lv * (filt(noise(m), sos_bp(1800, 7000)) * np.exp(-tt / 0.006)
                       + 0.5 * sine(420, m) * np.exp(-tt / 0.012))
    return fade_tail(x, smp(0.03))


def sfx_glitch():
    n = smp(0.4)
    x = np.zeros(n)
    p = 0
    sl = smp(0.03)
    while p < n:
        f = rng.choice([220, 330, 440, 660, 880, 1320, 1760])
        L = sl * int(rng.integers(1, 3))
        m = min(L, n - p)
        chunk = square(f, m, pw=rng.uniform(0.2, 0.5)) * 0.6 + noise(m) * 0.3
        chunk = np.repeat(chunk[::6], 6)[:m]
        chunk = np.round(chunk * 6) / 6
        chunk *= np.linspace(1, 0.6, m)
        reps = int(rng.integers(1, 3))
        for r in range(reps):
            q = p + r * m
            if q >= n:
                break
            mm = min(m, n - q)
            x[q:q + mm] = chunk[:mm]
        p += m * reps
    x = fade_tail(x * ramp_in(n, 30), smp(0.04))
    return np.stack([x, np.roll(x, smp(0.007))], axis=1)


def sfx_type():
    n = smp(0.05)
    t = tarr(n)
    x = filt(noise(n), sos_bp(1200, 6000)) * np.exp(-t / 0.004)
    x += sine(180, n) * np.exp(-t / 0.01) * 0.5
    return fade_tail(x, smp(0.008))


def sfx_ding():
    n = smp(1.6)
    t = tarr(n)
    f = hz('E6')
    x = np.zeros(n)
    for r, a, d in [(1, 1.0, 1.0), (2.76, 0.45, 0.35), (5.4, 0.25, 0.15), (8.93, 0.12, 0.08), (2.0, 0.2, 0.6)]:
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d)
    x *= ramp_in(n, smp(0.001))
    return fade_tail(x, smp(0.2))


def sfx_boop():
    n = smp(0.2)
    t = tarr(n)
    f = 950 * (520 / 950) ** np.clip(t / 0.09, 0, 1)
    x = (sine(f, n) + 0.25 * sine(2 * f, n)) * np.sin(np.pi * np.clip(t / 0.19, 0, 1)) ** 0.8
    return fade_tail(x, smp(0.03))


def sfx_whistle():
    n = smp(0.5)
    t = tarr(n)
    trill = 1 + 0.035 * np.sign(np.sin(2 * np.pi * 28 * t)) * 0.5 + 0.02 * np.sin(2 * np.pi * 28 * t)
    f = 2850 * trill
    tone = sine(f, n) + 0.15 * sine(2 * f, n)
    breath = sweep(noise(n), lambda i: 2850 * trill[np.minimum(i, n - 1)], 'bp', q=6.0) * 0.6
    env = np.clip(t / 0.03, 0, 1) * np.clip((0.5 - t) / 0.06, 0, 1)
    return (tone + breath) * env


def sfx_bell():
    n = smp(1.2)
    t = tarr(n)
    f0 = 640.0
    x = np.zeros(n)
    for r, a, d in [(1.0, 1.0, 0.9), (1.003, 0.6, 0.9), (2.32, 0.5, 0.5), (3.71, 0.35, 0.3), (5.1, 0.25, 0.18),
                    (6.9, 0.15, 0.1)]:
        x += a * np.sin(2 * np.pi * f0 * r * t + rng.random() * 6) * np.exp(-t / d)
    x += filt(noise(n), sos_hp(2000)) * np.exp(-t / 0.004) * 0.8
    x *= ramp_in(n, smp(0.0008))
    return fade_tail(x, smp(0.15))


def sfx_crowd():
    n = smp(1.5)
    t = tarr(n)
    out = np.zeros((n, 2))
    formants = [(730, 1090), (570, 840), (300, 870), (660, 1700)]
    for v in range(36):
        f0 = rng.uniform(170, 380)
        glide = f0 * (1 + 0.25 * np.clip((t - rng.uniform(0, 0.3)) / 0.5, 0, 1))
        jitter = 1 + 0.01 * np.sin(2 * np.pi * rng.uniform(4, 7) * t + rng.random() * 6)
        src = saw(glide * jitter, n, rng.random())
        F1, F2 = formants[rng.integers(0, len(formants))]
        y = filt(src, sos_bp(F1 * 0.8, F1 * 1.2)) + 0.6 * filt(src, sos_bp(F2 * 0.85, F2 * 1.15))
        st = rng.uniform(0, 0.25)
        env = np.clip((t - st) / 0.15, 0, 1) * np.clip((1.5 - t) / 0.6, 0, 1)
        env *= 0.7 + 0.3 * np.sin(2 * np.pi * rng.uniform(2, 4) * t + rng.random() * 6)
        out += stereo(y * env, rng.uniform(-0.9, 0.9))
    air = filt(noise(n, 2), sos_bp(400, 4000)) * (np.clip(t / 0.2, 0, 1) * np.clip((1.5 - t) / 0.6, 0, 1))[:, None]
    out = out / 36 * 6 + air * 0.25
    return reverb(out, make_ir(1.2, 1.4, seed=5)) * 0.6 + out


def render_sfx():
    ir = make_ir(1.1, 1.5, seed=21)
    items = {
        'whoosh': sfx_whoosh(0.6),
        'whoosh_short': sfx_whoosh(0.3, 600, 6500, 1200),
        'impact': (lambda x: stereo(x) + reverb(stereo(x), ir)[:len(x)] * 0.25)(impact(1.0, 1.2)),
        'pop': sfx_pop(420, 1250),
        'pop_hi': sfx_pop(800, 2300, 0.12),
        'click': sfx_click(),
        'shutter': sfx_shutter(),
        'riser': riser(2.0, 300, 12000),
        'glitch': sfx_glitch(),
        'swoosh_rev': reverse_cymbal(1.0),
        'type': sfx_type(),
        'ding': sfx_ding(),
        'boop': sfx_boop(),
        'whistle': sfx_whistle(),
        'bell': sfx_bell(),
        'crowd': sfx_crowd(),
    }
    info = {}
    for name, x in items.items():
        x = stereo(np.asarray(x, float))
        x = filt(x, sos_hp(25, 2))                    # DC 제거
        x[:smp(0.001)] *= np.linspace(0, 1, smp(0.001))[:, None]
        x = fade_tail(x, smp(0.005))                  # 붙일 때 틱 소리 방지
        x = norm(x, -3.0)
        write_wav(os.path.join(SFX_DIR, f'{name}.wav'), x)
        info[name] = len(x) / SR
    return info


if __name__ == '__main__':
    print('render music…')
    y, marks = render_music()
    print('music samples:', len(y), 'marks:', marks)
    print('render sfx…')
    info = render_sfx()
    for k, v in info.items():
        print(f'  {k}.wav  {v:.3f}s')
