import React, {CSSProperties} from 'react';
import {useF} from '../lib/frame';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, E, lerp, prog, rnd, spr} from '../lib/core';

/** 필름 그레인 */
export const Grain: React.FC<{opacity?: number; blend?: CSSProperties['mixBlendMode']}> = ({opacity = 0.14, blend = 'overlay'}) => {
  const f = useF();
  const i = f % 8;
  const ox = Math.floor(rnd('gx' + f) * 200);
  const oy = Math.floor(rnd('gy' + f) * 120);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: blend, opacity, overflow: 'hidden'}}>
      <Img
        src={staticFile(`grain/g${i}.png`)}
        style={{position: 'absolute', left: -ox, top: -oy, width: 2200, height: 1240, imageRendering: 'pixelated'}}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.55, color = '0,0,0'}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/** 순간 플래시 */
export const Flash: React.FC<{at: number; dur?: number; color?: string; max?: number}> = ({at, dur = 6, color = '#fff', max = 0.9}) => {
  const f = useF();
  const o = f < at ? 0 : lerp(f, [at, at + dur], [max, 0], E.outQuart);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};

/** 방사형 집중선 버스트 */
export const Burst: React.FC<{
  at: number;
  x?: number;
  y?: number;
  n?: number;
  r0?: number;
  r1?: number;
  color?: string;
  width?: number;
  dur?: number;
  seed?: string;
}> = ({at, x = 960, y = 540, n = 16, r0 = 120, r1 = 520, color = C.white, width = 10, dur = 16, seed = 'b'}) => {
  const f = useF();
  if (f < at || f > at + dur + 2) return null;
  const p = prog(f, at, dur, E.outExpo);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1920} height={1080}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(seed + i) * 0.25;
        const len = (r1 - r0) * (0.6 + rnd(seed + 'l' + i) * 0.4);
        const head = r0 + len * p;
        const tail = r0 + len * Math.max(0, p * 1.35 - 0.35);
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * tail}
            y1={y + Math.sin(a) * tail}
            x2={x + Math.cos(a) * head}
            y2={y + Math.sin(a) * head}
            stroke={color}
            strokeWidth={width * (1 - p * 0.6)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** 충격파 링 */
export const Ring: React.FC<{at: number; x?: number; y?: number; r?: number; color?: string; width?: number; dur?: number}> = ({
  at,
  x = 960,
  y = 540,
  r = 420,
  color = C.white,
  width = 14,
  dur = 18,
}) => {
  const f = useF();
  if (f < at || f > at + dur) return null;
  const p = prog(f, at, dur, E.outExpo);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1920} height={1080}>
      <circle cx={x} cy={y} r={r * p} fill="none" stroke={color} strokeWidth={width * (1 - p) + 0.5} opacity={1 - p * 0.6} />
    </svg>
  );
};

const CONF_COLORS = [C.orange, C.ink, C.white, C.red, C.yellow, C.pink];

/** 컨페티 (물리 근사) */
export const Confetti: React.FC<{
  at: number;
  x?: number;
  y?: number;
  n?: number;
  power?: number;
  spread?: number; // 라디안
  angle?: number; // 발사 방향(라디안, -PI/2 = 위)
  gravity?: number;
  colors?: string[];
  seed?: string;
  life?: number;
}> = ({at, x = 960, y = 540, n = 80, power = 34, spread = Math.PI * 2, angle = -Math.PI / 2, gravity = 0.9, colors = CONF_COLORS, seed = 'c', life = 70}) => {
  const f = useF();
  const t = f - at;
  if (t < 0 || t > life) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const a = angle + (rnd(seed + 'a' + i) - 0.5) * spread;
        const v = power * (0.45 + rnd(seed + 'v' + i) * 0.75);
        const drag = 0.94;
        // 지수 감쇠 속도 적분
        const k = (1 - Math.pow(drag, t)) / (1 - drag);
        const px = x + Math.cos(a) * v * k;
        const py = y + Math.sin(a) * v * k + 0.5 * gravity * t * t * 0.55;
        const rot = t * (rnd(seed + 'r' + i) - 0.5) * 30;
        const flip = Math.cos(t * (0.2 + rnd(seed + 'f' + i) * 0.4));
        const size = 10 + rnd(seed + 's' + i) * 16;
        const shape = Math.floor(rnd(seed + 'sh' + i) * 3);
        const col = colors[Math.floor(rnd(seed + 'c' + i) * colors.length)];
        const fade = lerp(t, [life - 15, life], [1, 0]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: shape === 1 ? size * 0.7 : size,
              height: shape === 0 ? size * 0.45 : shape === 1 ? size * 0.7 : size * 0.5,
              borderRadius: shape === 1 ? '50%' : 3,
              background: col,
              transform: `translate(-50%,-50%) rotate(${rot}deg) scaleY(${flip})`,
              opacity: fade,
              boxShadow: col === C.white ? '0 0 0 2px rgba(0,0,0,0.08)' : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** 반짝이 별 */
export const Sparkle: React.FC<{x: number; y: number; at: number; size?: number; color?: string; dur?: number}> = ({x, y, at, size = 60, color = C.yellow, dur = 18}) => {
  const f = useF();
  if (f < at || f > at + dur) return null;
  const p = prog(f, at, dur, E.linear);
  const s = Math.sin(p * Math.PI) * size;
  return (
    <svg style={{position: 'absolute', left: x - size, top: y - size, overflow: 'visible'}} width={size * 2} height={size * 2}>
      <g transform={`translate(${size},${size}) rotate(${p * 90})`}>
        <path d={`M0 ${-s} Q0 0 ${s} 0 Q0 0 0 ${s} Q0 0 ${-s} 0 Q0 0 0 ${-s}Z`} fill={color} />
      </g>
    </svg>
  );
};

/** 발바닥 SVG 패스 (100x100 박스) */
export const PAW_PATH =
  'M50 92c-14 0-27-6-27-19 0-12 12-25 27-25s27 13 27 25c0 13-13 19-27 19z' +
  'M20 50c-7 1-13-6-13-14s5-15 12-15 12 6 12 14-4 14-11 15z' +
  'M80 50c7 1 13-6 13-14s-5-15-12-15-12 6-12 14 4 14 11 15z' +
  'M37 33c-7 0-12-7-12-16S30 1 37 1s12 7 12 16-5 16-12 16z' +
  'M63 33c7 0 12-7 12-16S70 1 63 1s-12 7-12 16 5 16 12 16z';

export const Paw: React.FC<{size?: number; color?: string; style?: CSSProperties}> = ({size = 100, color = C.ink, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d={PAW_PATH} fill={color} />
  </svg>
);

/** 발바닥 모양 마스크로 내용을 드러냄 (아이리스) */
export const PawMask: React.FC<{size: number; x?: number; y?: number; children: React.ReactNode}> = ({size, x = 960, y = 540, children}) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='${PAW_PATH}' fill='black'/></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <AbsoluteFill
      style={{
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: `${size}px ${size}px`,
        maskSize: `${size}px ${size}px`,
        WebkitMaskPosition: `${x - size / 2}px ${y - size * 0.55}px`,
        maskPosition: `${x - size / 2}px ${y - size * 0.55}px`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** 원형 마스크 */
export const CircleMask: React.FC<{r: number; x?: number; y?: number; children: React.ReactNode}> = ({r, x = 960, y = 540, children}) => (
  <AbsoluteFill style={{clipPath: `circle(${Math.max(0, r)}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>
);

/** 손그림 마커 원 (보일링 포함) */
export const Scribble: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  at: number;
  color?: string;
  width?: number;
  drawDur?: number;
  seed?: string;
  turns?: number;
}> = ({cx, cy, rx, ry, at, color = C.orange, width = 7, drawDur = 12, seed = 's', turns = 1.18}) => {
  const f = useF();
  if (f < at) return null;
  const boil = Math.floor(f / 3);
  const N = 48;
  const pts: string[] = [];
  const start = rnd(seed + 'st') * Math.PI * 2;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = start + t * Math.PI * 2 * turns;
    const j = 1 + (rnd(seed + boil + 'j' + i) - 0.5) * 0.08 + t * 0.06;
    pts.push(`${(cx + Math.cos(a) * rx * j).toFixed(1)},${(cy + Math.sin(a) * ry * j).toFixed(1)}`);
  }
  const d = 'M' + pts.join(' L');
  const p = prog(f, at, drawDur, E.outQuart);
  const len = 2 * Math.PI * Math.max(rx, ry) * turns * 1.1;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1920} height={1080}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
    </svg>
  );
};

/** 손그림 화살표 */
export const ScribbleArrow: React.FC<{x1: number; y1: number; x2: number; y2: number; at: number; color?: string; width?: number; bend?: number; seed?: string}> = ({
  x1,
  y1,
  x2,
  y2,
  at,
  color = C.white,
  width = 6,
  bend = 0.25,
  seed = 'a',
}) => {
  const f = useF();
  if (f < at) return null;
  const boil = Math.floor(f / 3);
  const jx = (rnd(seed + boil) - 0.5) * 4;
  const jy = (rnd(seed + 'y' + boil) - 0.5) * 4;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend + jx;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend + jy;
  const p = prog(f, at, 10, E.outQuart);
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.3;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const h = 22;
  const hp = prog(f, at + 8, 5, E.outQuart);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1920} height={1080}>
      <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      {hp > 0 && (
        <path
          d={`M${x2 - Math.cos(ang - 0.5) * h * hp},${y2 - Math.sin(ang - 0.5) * h * hp} L${x2},${y2} L${x2 - Math.cos(ang + 0.5) * h * hp},${y2 - Math.sin(ang + 0.5) * h * hp}`}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

/** 사선 스트라이프 와이프 (방송 스팅어) — mid 프레임에 화면 완전 덮음 */
export const StripeWipe: React.FC<{mid: number; colors?: string[]; dir?: 1 | -1; half?: number; logo?: React.ReactNode}> = ({
  mid,
  colors = [C.orange, C.cream, C.ink],
  dir = 1,
  half = 7,
  logo,
}) => {
  const f = useF();
  const s = mid - half;
  const e = mid + half;
  if (f < s - 4 || f > e + 6) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {colors.map((col, i) => {
        const d = i * 2;
        const pin = prog(f, s + d - 2, half, E.inOutExpo);
        const pout = prog(f, mid + d - 1, half, E.inOutExpo);
        const x = dir * (lerp(pin, [0, 1], [2700, 0]) + lerp(pout, [0, 1], [0, -2700]));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -400,
              top: -100,
              width: 2720,
              height: 1280,
              background: col,
              transform: `translateX(${x}px) skewX(${-18 * dir}deg)`,
            }}
          />
        );
      })}
      {logo ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: f > mid - 3 && f < mid + 4 ? 1 : 0}}>{logo}</AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** 수평 슬라이스 글리치 */
export const SliceGlitch: React.FC<{at: number; dur?: number; slices?: number; amp?: number; children: React.ReactNode; seed?: string}> = ({
  at,
  dur = 5,
  slices = 9,
  amp = 120,
  children,
  seed = 'g',
}) => {
  const f = useF();
  const active = f >= at && f < at + dur;
  if (!active) return <AbsoluteFill>{children}</AbsoluteFill>;
  const h = 1080 / slices;
  return (
    <AbsoluteFill>
      {Array.from({length: slices}).map((_, i) => {
        const off = (rnd(seed + f + 'o' + i) - 0.5) * 2 * amp;
        return (
          <AbsoluteFill key={i} style={{clipPath: `inset(${i * h}px 0 ${1080 - (i + 1) * h}px 0)`, transform: `translateX(${off}px)`}}>
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** 스프링 팝 래퍼 */
export const Pop: React.FC<{at: number; children: React.ReactNode; style?: CSSProperties; damping?: number; stiffness?: number; rot?: number; origin?: string}> = ({
  at,
  children,
  style,
  damping = 9,
  stiffness = 190,
  rot = 0,
  origin = '50% 50%',
}) => {
  const f = useF();
  const s = spr(f, at, {damping, stiffness, mass: 0.6});
  if (f < at) return null;
  return <div style={{position: 'absolute', transform: `scale(${s}) rotate(${(1 - s) * rot}deg)`, transformOrigin: origin, ...style}}>{children}</div>;
};
