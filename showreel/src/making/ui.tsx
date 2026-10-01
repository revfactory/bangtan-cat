import React, {CSSProperties} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Grain} from '../components/fx';
import {Odometer} from '../components/text';
import {C, E, F, lerp, prog, rnd, spr} from '../lib/core';
import {useF} from '../lib/frame';

export const MB = 80; // 1마디 (90 BPM)
export const MBEAT = 20;
export const mk = (name: string) => staticFile(`making/${name}`);

export const M = {
  bg: '#141218',
  panel: '#1E1B24',
  line: 'rgba(255,255,255,0.08)',
  mint: '#4CD9A0',
  note: '#FFE36E',
  grey: '#8B8794',
};

/* 배경 */
export const MakingBg: React.FC<{grid?: boolean}> = ({grid = true}) => {
  const f = useF();
  return (
    <AbsoluteFill style={{background: M.bg}}>
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            backgroundPosition: `${(f * 0.3) % 60}px 0`,
          }}
        />
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,138,31,0.06), rgba(0,0,0,0) 60%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

export const Overlay: React.FC = () => <Grain opacity={0.1} />;

/* 맥 스타일 창 */
export const Win: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  at?: number;
  light?: boolean;
  children?: React.ReactNode;
  style?: CSSProperties;
  out?: number;
}> = ({x, y, w, h, title, at = 0, light, children, style, out}) => {
  const f = useF();
  if (f < at) return null;
  const s = spr(f, at, {damping: 14, stiffness: 160});
  const po = out !== undefined ? prog(f, out, 10, E.inExpo) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 16,
        overflow: 'hidden',
        background: light ? '#FBF8F3' : '#0F0E13',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
        transform: `translateY(${(1 - s) * 60 + po * 80}px) scale(${0.94 + s * 0.06 - po * 0.06})`,
        opacity: Math.min(1, s * 1.5) * (1 - po),
        ...style,
      }}
    >
      <div style={{height: 42, background: light ? '#ECE7DF' : '#22202A', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 9, position: 'relative'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 14, height: 14, borderRadius: '50%', background: c}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: F.mono, fontSize: 17, color: light ? '#776F64' : '#9A95A4', pointerEvents: 'none'}}>{title}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 42, bottom: 0}}>{children}</div>
    </div>
  );
};

/* 터미널 */
export type TLine = {text: string; at: number; kind?: 'cmd' | 'out' | 'ok' | 'err' | 'dim' | 'claude'; cps?: number};
export const Terminal: React.FC<{lines: TLine[]; size?: number; pad?: number}> = ({lines, size = 26, pad = 28}) => {
  const f = useF();
  const blink = Math.floor(f / 10) % 2 === 0;
  let lastTyping = -1;
  lines.forEach((l, i) => {
    if (f >= l.at) lastTyping = i;
  });
  return (
    <div style={{padding: pad, fontFamily: F.mono, fontSize: size, lineHeight: 1.55, color: '#E8E4EF', whiteSpace: 'pre-wrap', wordBreak: 'keep-all'}}>
      {lines.map((l, i) => {
        if (f < l.at) return null;
        const chars = Array.from(l.text);
        const cps = l.cps ?? (l.kind === 'cmd' ? 1.2 : 99);
        const n = Math.min(chars.length, Math.floor((f - l.at) * cps) + 1);
        const done = n >= chars.length;
        const col =
          l.kind === 'ok' ? M.mint : l.kind === 'err' ? '#FF6B6B' : l.kind === 'dim' ? '#6F6A7A' : l.kind === 'claude' ? C.cream : l.kind === 'out' ? '#B9B3C6' : '#FFFFFF';
        return (
          <div key={i} style={{color: col, fontFamily: l.kind === 'claude' ? F.pre : F.mono, fontWeight: l.kind === 'claude' ? 600 : 400}}>
            {l.kind === 'cmd' && <span style={{color: C.orange}}>❯ </span>}
            {l.kind === 'claude' && <span style={{color: C.orange}}>● </span>}
            {chars.slice(0, n).join('')}
            {i === lastTyping && (!done || blink) && (
              <span style={{display: 'inline-block', width: '0.55em', height: '1.05em', background: C.orange, verticalAlign: '-0.15em', marginLeft: 2}} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* 감독 노트 포스트잇 */
export const Note: React.FC<{x: number; y: number; at: number; lines: string[]; rot?: number; w?: number; out?: number; color?: string}> = ({
  x,
  y,
  at,
  lines,
  rot = -3,
  w = 470,
  out,
  color = M.note,
}) => {
  const f = useF();
  if (f < at) return null;
  const s = spr(f, at, {damping: 9, stiffness: 240, mass: 0.6});
  const po = out !== undefined ? prog(f, out, 8, E.inExpo) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        padding: '26px 30px 24px',
        background: color,
        boxShadow: '0 18px 30px rgba(0,0,0,0.4), inset 0 -30px 40px rgba(0,0,0,0.04)',
        transform: `translate(-50%,-50%) rotate(${rot + (1 - s) * 12}deg) scale(${(0.6 + s * 0.4) * (1 - po)})`,
        opacity: Math.min(1, s * 2) * (1 - po),
      }}
    >
      <div style={{position: 'absolute', left: '50%', top: -16, width: 130, height: 34, background: 'rgba(255,255,255,0.55)', transform: 'translateX(-50%) rotate(2deg)'}} />
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: 3, color: 'rgba(23,19,29,0.55)', marginBottom: 6}}>DIRECTOR'S NOTE</div>
      {lines.map((l, i) => (
        <div key={i} style={{fontFamily: F.pen, fontSize: 52, lineHeight: 1.08, color: C.ink}}>
          {l}
        </div>
      ))}
    </div>
  );
};

/* 스텝 헤더: 크게 등장 → 좌상단 라벨로 축소 */
export const StepHeader: React.FC<{n: number; title: string; time: string; hold?: number}> = ({n, title, time, hold = 26}) => {
  const f = useF();
  const pin = prog(f, 0, 10, E.outExpo);
  const shrink = prog(f, hold, 12, E.inOutExpo);
  const big = {x: 140, y: 420};
  const small = {x: 70, y: 52};
  const x = lerp(shrink, [0, 1], [big.x, small.x]);
  const y = lerp(shrink, [0, 1], [big.y, small.y]);
  const sc = lerp(shrink, [0, 1], [1, 0.36]);
  return (
    <>
      {shrink < 1 && (
        <AbsoluteFill style={{background: `rgba(10,9,13,${0.7 * (1 - shrink)})`}} />
      )}
      <div style={{position: 'absolute', left: x, top: y, transform: `scale(${sc})`, transformOrigin: '0 0'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, transform: `translateX(${(1 - pin) * -200}px)`, opacity: pin}}>
          <div style={{background: C.orange, color: C.ink, fontFamily: F.unb, fontWeight: 900, fontSize: 64, padding: '4px 26px', borderRadius: 12}}>STEP {String(n).padStart(2, '0')}</div>
          <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: M.grey, letterSpacing: 2}}>{time}</div>
        </div>
        <div style={{fontFamily: F.bhs, fontSize: 150, color: C.white, lineHeight: 1.15, marginTop: 10, overflow: 'hidden'}}>
          <div style={{transform: `translateY(${(1 - prog(f, 3, 12, E.outExpo)) * 110}%)`}}>{title}</div>
        </div>
      </div>
    </>
  );
};

/* 칩 */
export const Chip: React.FC<{x: number; y: number; at: number; text: string; bg?: string; fg?: string; size?: number; rot?: number; icon?: string}> = ({
  x,
  y,
  at,
  text,
  bg = C.cream,
  fg = C.ink,
  size = 34,
  rot = 0,
  icon,
}) => {
  const f = useF();
  if (f < at) return null;
  const s = spr(f, at, {damping: 10, stiffness: 230});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`,
        background: bg,
        color: fg,
        fontFamily: F.pre,
        fontWeight: 800,
        fontSize: size,
        padding: `${size * 0.22}px ${size * 0.7}px`,
        borderRadius: 100,
        whiteSpace: 'nowrap',
        boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
      }}
    >
      {icon ? <span style={{marginRight: 10}}>{icon}</span> : null}
      {text}
    </div>
  );
};

/* 도장 (✓ / ✗) */
export const Stamp: React.FC<{x: number; y: number; at: number; ok: boolean; text: string; size?: number}> = ({x, y, at, ok, text, size = 1}) => {
  const f = useF();
  if (f < at) return null;
  const p = prog(f, at, 7, E.outExpo);
  const col = ok ? M.mint : '#FF5A5F';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${lerp(p, [0, 1], [2.4, 1]) * size}) rotate(${ok ? -8 : 8}deg)`,
        opacity: lerp(f, [at, at + 2], [0, 1]),
        border: `8px solid ${col}`,
        color: col,
        borderRadius: 18,
        padding: '6px 26px',
        fontFamily: F.bhs,
        fontSize: 62,
        whiteSpace: 'nowrap',
        background: 'rgba(20,18,24,0.75)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span style={{fontFamily: F.archivo, fontSize: 64}}>{ok ? '✓' : '✗'}</span>
      {text}
    </div>
  );
};

/* 사진 카드 (테두리 없는 둥근 카드) */
export const Card: React.FC<{src: string; x: number; y: number; w: number; h: number; at?: number; rot?: number; fit?: 'cover' | 'contain'; label?: string; style?: CSSProperties; pos?: string}> = ({
  src,
  x,
  y,
  w,
  h,
  at = 0,
  rot = 0,
  fit = 'cover',
  label,
  style,
  pos,
}) => {
  const f = useF();
  if (f < at) return null;
  const s = spr(f, at, {damping: 12, stiffness: 190});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        ...style,
      }}
    >
      <Img src={src} style={{width: '100%', height: '100%', objectFit: fit, objectPosition: pos}} />
      {label ? (
        <div style={{position: 'absolute', left: 10, top: 10, background: 'rgba(0,0,0,0.7)', color: C.white, fontFamily: F.mono, fontWeight: 700, fontSize: 17, padding: '4px 10px', borderRadius: 6}}>{label}</div>
      ) : null}
    </div>
  );
};

/* 전후 비교 슬라이더 */
export const BeforeAfter: React.FC<{
  before: React.ReactNode;
  after: React.ReactNode;
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  slideAt: number;
  dur?: number;
  beforeLabel?: string;
  afterLabel?: string;
}> = ({before, after, x, y, w, h, at, slideAt, dur = 16, beforeLabel = 'BEFORE', afterLabel = 'AFTER'}) => {
  const f = useF();
  if (f < at) return null;
  const s = spr(f, at, {damping: 13, stiffness: 180});
  const p = prog(f, slideAt, dur, E.inOutExpo);
  const sx = p * w;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%,-50%) scale(${0.9 + s * 0.1})`,
        opacity: Math.min(1, s * 1.6),
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      <AbsoluteFill>{before}</AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 ${w - sx}px 0 0)`}}>{after}</AbsoluteFill>
      <div style={{position: 'absolute', left: 16, top: 16, background: '#FF5A5F', color: C.white, fontFamily: F.mono, fontWeight: 700, fontSize: 20, padding: '5px 12px', borderRadius: 6, opacity: 1 - p}}>{beforeLabel}</div>
      <div style={{position: 'absolute', right: 16, top: 16, background: M.mint, color: C.ink, fontFamily: F.mono, fontWeight: 700, fontSize: 20, padding: '5px 12px', borderRadius: 6, opacity: p}}>{afterLabel}</div>
      {p > 0 && p < 1 && (
        <div style={{position: 'absolute', left: sx - 3, top: 0, bottom: 0, width: 6, background: C.white, boxShadow: '0 0 20px rgba(0,0,0,0.5)'}}>
          <div style={{position: 'absolute', left: -24, top: h / 2 - 27, width: 54, height: 54, borderRadius: '50%', background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.archivo, fontSize: 24, color: C.ink}}>‹›</div>
        </div>
      )}
    </div>
  );
};

/* 필름 스트립 */
export const FilmStrip: React.FC<{y: number; speed?: number; dir?: 1 | -1; h?: number; offset?: number; opacity?: number}> = ({y, speed = 3, dir = 1, h = 170, offset = 0, opacity = 1}) => {
  const f = useF();
  const fw = h * 1.6;
  const n = 22;
  const total = n * (fw + 14);
  const off = (((f * speed + offset) % total) + total) % total;
  const holes = Array.from({length: 60});
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1920, height: h + 60, background: '#0A090C', overflow: 'hidden', opacity}}>
      {[6, h + 36].map((ty, k) => (
        <div key={k} style={{position: 'absolute', top: ty, left: -((f * speed * dir) % 44) - 44, display: 'flex', gap: 22}}>
          {holes.map((_, i) => (
            <div key={i} style={{width: 22, height: 16, borderRadius: 4, background: '#2A2730'}} />
          ))}
        </div>
      ))}
      <div style={{position: 'absolute', top: 30, left: dir === 1 ? -off : off - total, display: 'flex', gap: 14}}>
        {Array.from({length: n * 2}).map((_, i) => (
          <Img key={i} src={mk(`strip/s${String(i % n).padStart(2, '0')}.jpg`)} style={{width: fw, height: h, objectFit: 'cover', borderRadius: 4, filter: 'saturate(0.9)'}} />
        ))}
      </div>
    </div>
  );
};

/* 진행 레인 (병렬 생성) */
export const Lane: React.FC<{x: number; y: number; w: number; at: number; dur: number; name: string; secs: number; fail?: boolean}> = ({x, y, w, at, dur, name, secs, fail}) => {
  const f = useF();
  const p = prog(f, at, dur, E.linear);
  const done = p >= 1;
  const t = Math.round(p * secs);
  const col = fail && done ? '#FF5A5F' : done ? M.mint : C.orange;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, display: 'flex', alignItems: 'center', gap: 18, opacity: lerp(f, [at - 6, at], [0, 1])}}>
      <div style={{width: 300, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: '#D9D4E2'}}>{name}</div>
      <div style={{flex: 1, height: 18, borderRadius: 10, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
        <div style={{width: `${(fail && done ? 0.35 : p) * 100}%`, height: '100%', background: col, borderRadius: 10}} />
      </div>
      <div style={{width: 120, textAlign: 'right', fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: col}}>{fail && done ? 'FAIL' : done ? `✓ ${secs}s` : `${t}s`}</div>
    </div>
  );
};

/* 간단 문법 강조 코드 뷰 */
const KW = /\b(const|let|return|if|export|import|from|new|for|of|null|true|false|type)\b/g;
const tokenize = (line: string) => {
  const out: {t: string; c: string}[] = [];
  const re = /(\/\/.*$|\/\*\*.*$|`[^`]*`|'[^']*'|"[^"]*"|\b\d+(?:\.\d+)?\b|\b(?:const|let|return|if|export|import|from|new|for|of|null|true|false|type)\b|<\/?[A-Za-z]+|[A-Za-z_][A-Za-z0-9_]*(?=\()|[^\s])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({t: line.slice(last, m.index), c: '#D6D2DE'});
    const t = m[0];
    let c = '#D6D2DE';
    if (t.startsWith('//') || t.startsWith('/**')) c = '#6E7A6E';
    else if (t.startsWith('`') || t.startsWith("'") || t.startsWith('"')) c = '#A8D88B';
    else if (/^\d/.test(t)) c = '#F7A86A';
    else if (KW.test(t)) c = '#C792EA';
    else if (t.startsWith('<')) c = '#FF8FA3';
    else if (/^[A-Za-z_]/.test(t)) c = '#82AAFF';
    KW.lastIndex = 0;
    out.push({t, c});
    last = m.index + t.length;
  }
  if (last < line.length) out.push({t: line.slice(last), c: '#D6D2DE'});
  return out;
};

export const CodeView: React.FC<{lines: string[]; at: number; lps?: number; size?: number; startLine?: number; highlight?: number[]}> = ({lines, at, lps = 0.8, size = 22, startLine = 1, highlight = []}) => {
  const f = useF();
  const shown = Math.max(0, Math.min(lines.length, Math.floor((f - at) * lps)));
  return (
    <div style={{padding: '18px 0', fontFamily: F.mono, fontSize: size, lineHeight: 1.5}}>
      {lines.slice(0, shown).map((l, i) => (
        <div key={i} style={{display: 'flex', background: highlight.includes(i) ? 'rgba(255,138,31,0.14)' : undefined}}>
          <div style={{width: 64, textAlign: 'right', paddingRight: 18, color: '#4E4A58'}}>{startLine + i}</div>
          <div style={{whiteSpace: 'pre'}}>
            {tokenize(l).map((tk, k) => (
              <span key={k} style={{color: tk.c}}>
                {tk.t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* 상단 HUD: REC + 실제 작업 시각 */
export const HUD: React.FC<{time: string; prevTime: string; changeAt: number; step: number}> = ({time, prevTime, changeAt, step}) => {
  const f = useF();
  return (
    <>
      <div style={{position: 'absolute', right: 70, top: 46, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 18, color: M.grey, letterSpacing: 2, textAlign: 'right', lineHeight: 1.3}}>
          실제 작업 시각
          <br />
          REAL TIME
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '6px 18px', border: '1px solid rgba(255,255,255,0.1)'}}>
          <div style={{width: 14, height: 14, borderRadius: '50%', background: '#FF3B30', opacity: Math.floor(f / 15) % 2 ? 0.25 : 1, boxShadow: '0 0 12px #FF3B30'}} />
          <Odometer value={time} prevValue={prevTime} changeAt={changeAt} dur={14} digitWidth="0.8em" style={{fontFamily: F.unb, fontWeight: 800, fontSize: 40, color: C.white}} />
        </div>
      </div>
      {/* 하단 스텝 점 */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center'}}>
        {Array.from({length: 8}).map((_, i) => {
          const n = i + 1;
          const on = n === step;
          const past = n < step;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div
                style={{
                  minWidth: on ? 64 : 34,
                  height: 34,
                  borderRadius: 20,
                  background: on ? C.orange : past ? 'rgba(255,138,31,0.35)' : 'rgba(255,255,255,0.08)',
                  color: on ? C.ink : past ? C.cream : M.grey,
                  fontFamily: F.mono,
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {String(n).padStart(2, '0')}
              </div>
              {i < 7 && <div style={{width: 40, height: 2, background: past ? 'rgba(255,138,31,0.5)' : 'rgba(255,255,255,0.1)'}} />}
            </div>
          );
        })}
      </div>
    </>
  );
};

void rnd;
