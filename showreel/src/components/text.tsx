import React, {CSSProperties} from 'react';
import {useF} from '../lib/frame';

import {E, lerp, prog, rnd, spr} from '../lib/core';

export type KMode = 'rise' | 'slam' | 'pop' | 'drop' | 'fade' | 'spin' | 'stretch' | 'blur';

type KTextProps = {
  text: string;
  start: number;
  stagger?: number;
  dur?: number;
  mode?: KMode;
  style?: CSSProperties;
  charStyle?: (i: number, ch: string) => CSSProperties;
  exit?: number;
  exitMode?: 'fall' | 'up' | 'fade' | 'shrink';
  exitStagger?: number;
  seed?: string;
  /** 'center' 기준 스태거 (가운데부터) */
  fromCenter?: boolean;
};

/** 글자 단위 키네틱 타이포 */
export const KText: React.FC<KTextProps> = ({
  text,
  start,
  stagger = 2,
  dur = 14,
  mode = 'rise',
  style,
  charStyle,
  exit,
  exitMode = 'up',
  exitStagger = 1,
  seed = 'k',
  fromCenter = false,
}) => {
  const f = useF();
  const chars = Array.from(text);
  const n = chars.length;
  return (
    <div style={{display: 'flex', whiteSpace: 'pre', ...style}}>
      {chars.map((ch, i) => {
        const order = fromCenter ? Math.abs(i - (n - 1) / 2) : i;
        const s = start + order * stagger;
        let t = 'none';
        let op = 1;
        let filter = 'none';
        const p = prog(f, s, dur, E.outExpo);
        if (mode === 'rise') {
          t = `translateY(${(1 - p) * 115}%) rotate(${(1 - p) * 10}deg)`;
          op = f >= s ? 1 : 0;
        } else if (mode === 'slam') {
          const ps = prog(f, s, dur * 0.7, E.outExpo);
          t = `scale(${lerp(ps, [0, 1], [2.8, 1])})`;
          op = lerp(f, [s, s + 3], [0, 1]);
          filter = `blur(${(1 - ps) * 14}px)`;
        } else if (mode === 'pop') {
          const sp = spr(f, s, {damping: 9, stiffness: 200, mass: 0.6});
          const r = (rnd(seed + i) - 0.5) * 40;
          t = `scale(${sp}) rotate(${(1 - sp) * r}deg)`;
          op = f >= s ? 1 : 0;
        } else if (mode === 'drop') {
          const pd = prog(f, s, dur, E.outBack);
          t = `translateY(${(1 - pd) * -140}%)`;
          op = lerp(f, [s, s + 4], [0, 1]);
        } else if (mode === 'fade') {
          op = p;
          t = `translateY(${(1 - p) * 30}px)`;
        } else if (mode === 'spin') {
          const sp = spr(f, s, {damping: 12, stiffness: 140});
          t = `rotateY(${(1 - sp) * 90}deg) scale(${0.6 + sp * 0.4})`;
          op = f >= s ? Math.min(1, sp * 2) : 0;
        } else if (mode === 'stretch') {
          const ps = prog(f, s, dur, E.outExpo);
          t = `scaleY(${lerp(ps, [0, 1], [3, 1])}) scaleX(${lerp(ps, [0, 1], [0.3, 1])})`;
          op = lerp(f, [s, s + 3], [0, 1]);
        } else if (mode === 'blur') {
          t = `translateX(${(1 - p) * 60}px)`;
          op = p;
          filter = `blur(${(1 - p) * 18}px)`;
        }
        if (exit !== undefined && f >= exit) {
          const es = exit + order * exitStagger;
          const pe = prog(f, es, 10, E.inExpo);
          if (exitMode === 'up') t += ` translateY(${-pe * 120}%)`;
          if (exitMode === 'fall') t += ` translateY(${pe * 160}%) rotate(${pe * (rnd(seed + 'r' + i) - 0.5) * 60}deg)`;
          if (exitMode === 'shrink') t += ` scale(${1 - pe})`;
          op *= 1 - (exitMode === 'fade' ? pe : pe * pe);
        }
        const wrapOverflow = mode === 'rise' && (exit === undefined || f < exit) ? 'hidden' : 'visible';
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: wrapOverflow,
              paddingBottom: wrapOverflow === 'hidden' ? '0.06em' : 0,
              marginBottom: wrapOverflow === 'hidden' ? '-0.06em' : 0,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: t,
                opacity: op,
                filter,
                transformOrigin: '50% 60%',
                ...(charStyle ? charStyle(i, ch) : {}),
              }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** 타자기 */
export const TypeText: React.FC<{
  text: string;
  start: number;
  cps?: number; // 프레임당 글자 수
  style?: CSSProperties;
  cursor?: boolean;
  cursorColor?: string;
}> = ({text, start, cps = 1, style, cursor = true, cursorColor}) => {
  const f = useF();
  const chars = Array.from(text);
  const shown = Math.max(0, Math.min(chars.length, Math.floor((f - start) * cps)));
  const blink = Math.floor(f / 8) % 2 === 0;
  const done = shown >= chars.length;
  return (
    <div style={{whiteSpace: 'pre', ...style}}>
      {chars.slice(0, shown).join('')}
      {cursor && f >= start && (!done || blink) ? (
        <span style={{display: 'inline-block', width: '0.55em', height: '1em', background: cursorColor ?? 'currentColor', verticalAlign: '-0.12em', marginLeft: '0.08em'}} />
      ) : null}
    </div>
  );
};

/** 숫자 롤링 (오도미터) */
export const Odometer: React.FC<{
  value: string; // "07:00"
  prevValue?: string;
  changeAt: number;
  dur?: number;
  style?: CSSProperties;
  digitWidth?: string;
}> = ({value, prevValue, changeAt, dur = 12, style, digitWidth = '0.62em'}) => {
  const f = useF();
  const chars = Array.from(value);
  const prev = Array.from(prevValue ?? value);
  return (
    <div style={{display: 'flex', lineHeight: 1, ...style}}>
      {chars.map((ch, i) => {
        if (!/[0-9]/.test(ch)) {
          return (
            <span key={i} style={{display: 'inline-block', width: '0.3em', textAlign: 'center'}}>
              {ch}
            </span>
          );
        }
        const from = /[0-9]/.test(prev[i] ?? '') ? Number(prev[i]) : Number(ch);
        const to = Number(ch);
        const p = prog(f, changeAt + i * 2, dur, E.outExpo);
        // 위로 굴러가며 바뀜 (from → to, 한 바퀴 더 돌려 역동성)
        const steps = (to - from + 10) % 10;
        const pos = from + steps * p;
        return (
          <span key={i} style={{display: 'inline-block', width: digitWidth, height: '1em', overflow: 'hidden', position: 'relative'}}>
            <span style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-pos}em)`, textAlign: 'center'}}>
              {Array.from({length: 40}).map((_, k) => (
                <div key={k} style={{height: '1em'}}>
                  {k % 10}
                </div>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};
