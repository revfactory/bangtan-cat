import {Easing, interpolate, random, spring} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// ── 타이밍: 120 BPM, 30fps → 1박 15프레임, 1마디 60프레임
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;
/** 마디(1부터)·박(1부터) → 절대 프레임 */
export const at = (bar: number, beat = 1) => (bar - 1) * BAR + (beat - 1) * BEAT;

// ── 색
export const C = {
  orange: '#FF8A1F',
  orangeDeep: '#E2650A',
  orangeSoft: '#FFC48A',
  ink: '#17131D',
  ink2: '#2A2433',
  cream: '#FFF4E3',
  white: '#FFFDF8',
  red: '#E5383B',
  pink: '#FF8FAB',
  sky: '#8FD3E8',
  yellow: '#FFD23F',
  navy: '#1E1A3C',
};

// ── 폰트
export const F = {
  bhs: 'BlackHanSans',
  bagel: 'BagelFatOne',
  gasoek: 'GasoekOne',
  archivo: 'ArchivoBlack',
  mono: 'SpaceMono',
  pen: 'NanumPenScript',
  gaegu: 'Gaegu',
  unb: 'Unbounded',
  pre: 'Pretendard',
};

let fontsLoaded = false;
export const ensureFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const list: [string, string, string?][] = [
    [F.bhs, 'fonts/BlackHanSans-Regular.ttf'],
    [F.bagel, 'fonts/BagelFatOne-Regular.ttf'],
    [F.gasoek, 'fonts/GasoekOne-Regular.ttf'],
    [F.archivo, 'fonts/ArchivoBlack-Regular.ttf'],
    [F.mono, 'fonts/SpaceMono-Bold.ttf', '700'],
    [F.mono, 'fonts/SpaceMono-Regular.ttf', '400'],
    [F.pen, 'fonts/NanumPenScript-Regular.ttf'],
    [F.gaegu, 'fonts/Gaegu-Bold.ttf'],
    [F.unb, 'fonts/Unbounded[wght].ttf', '200 900'],
    [F.pre, 'fonts/PretendardVariable.woff2', '45 920'],
  ];
  for (const [family, url, weight] of list) {
    loadFont({family, url: staticFile(url), weight: weight ?? '400'});
  }
};

// ── 이징
export const E = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  outQuart: Easing.bezier(0.25, 1, 0.5, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inQuart: Easing.bezier(0.5, 0, 0.75, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  outBackBig: Easing.bezier(0.2, 2.2, 0.5, 1),
  linear: Easing.linear,
};

/** clamp 걸린 보간 */
export const lerp = (
  f: number,
  input: [number, number] | number[],
  output: [number, number] | number[],
  easing: (t: number) => number = E.linear,
) =>
  interpolate(f, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** 0→1 진행도 */
export const prog = (f: number, start: number, dur: number, easing = E.outExpo) =>
  lerp(f, [start, start + dur], [0, 1], easing);

/** 스프링 (start 이전 0) */
export const spr = (
  f: number,
  start: number,
  cfg: {damping?: number; stiffness?: number; mass?: number} = {},
) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: {damping: cfg.damping ?? 11, stiffness: cfg.stiffness ?? 170, mass: cfg.mass ?? 0.7},
  });

/** 시드 고정 난수 */
export const rnd = (seed: string | number) => random(seed);

/** 타격 지점들에서 감쇠하는 흔들림 (px) */
export const shakeAt = (f: number, hits: number[], amp = 18, decay = 5) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const h of hits) {
    const t = f - h;
    if (t < 0 || t > decay * 6) continue;
    const k = Math.exp(-t / decay);
    x += Math.sin(t * 2.7 + h) * amp * k;
    y += Math.cos(t * 3.1 + h * 0.7) * amp * 0.8 * k;
    r += Math.sin(t * 2.2 + h * 1.3) * 1.2 * k;
  }
  return {x, y, r};
};

/** 박마다 튕기는 펄스 0..1 */
export const beatPulse = (f: number, start: number, end: number, every = BEAT, decay = 4) => {
  if (f < start || f >= end) return 0;
  const t = (f - start) % every;
  return Math.exp(-t / decay);
};

export const img = (name: string) => staticFile(`img/${name}.jpg`);
export const sticker = (name: string) => staticFile(`sticker/${name}.png`);
