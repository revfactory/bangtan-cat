import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Burst, Paw, Ring} from '../components/fx';
import {KText, TypeText} from '../components/text';
import {C, E, F, lerp, prog, shakeAt, spr} from '../lib/core';
import {useF} from '../lib/frame';

const CountShape: React.FC<{kind: 0 | 1 | 2; f: number; at: number; out: number}> = ({kind, f, at, out}) => {
  if (f < at || f > out + 10) return null;
  const s = spr(f, at, {damping: 10, stiffness: 220, mass: 0.6});
  const po = prog(f, out, 7, E.outQuart);
  const scale = s * (1 + po * 1.6);
  const op = 1 - prog(f, out, 5, E.linear);
  const rot = kind === 1 ? 45 + (1 - s) * -90 + po * 30 : (1 - s) * 60;
  const common: React.CSSProperties = {
    position: 'absolute',
    left: 960,
    top: 520,
    transform: `translate(-50%,-50%) scale(${scale}) rotate(${rot}deg)`,
    opacity: op,
  };
  if (kind === 0) return <div style={{...common, width: 520, height: 520, borderRadius: '50%', background: C.orange}} />;
  if (kind === 1) return <div style={{...common, width: 420, height: 420, borderRadius: 70, background: C.cream}} />;
  // 나비넥타이
  return (
    <svg style={{...common, overflow: 'visible'}} width={640} height={360} viewBox="-320 -180 640 360">
      <path d="M-30 0 L-300 -160 Q-330 0 -300 160 Z" fill={C.red} />
      <path d="M30 0 L300 -160 Q330 0 300 160 Z" fill={C.red} />
      <rect x={-62} y={-70} width={124} height={140} rx={36} fill="#B81F2B" />
    </svg>
  );
};

const FLOATERS = [
  {x: 220, y: 230, k: 'circle', c: C.orange, s: 70},
  {x: 1700, y: 200, k: 'plus', c: C.cream, s: 46},
  {x: 1580, y: 860, k: 'tri', c: C.red, s: 64},
  {x: 330, y: 860, k: 'paw', c: C.cream, s: 58},
  {x: 980, y: 140, k: 'dot', c: C.yellow, s: 18},
  {x: 120, y: 560, k: 'plus', c: C.orange, s: 34},
  {x: 1820, y: 560, k: 'circle', c: C.cream, s: 40},
  {x: 760, y: 960, k: 'dot', c: C.orange, s: 22},
  {x: 1260, y: 940, k: 'circle', c: C.yellow, s: 30},
];

const Floater: React.FC<{d: (typeof FLOATERS)[number]; i: number; f: number}> = ({d, i, f}) => {
  const at = 4 + i * 3;
  if (f < at) return null;
  const s = spr(f, at, {damping: 9, stiffness: 160});
  const y = d.y - (f - at) * (0.6 + (i % 3) * 0.25);
  const rot = (f - at) * (i % 2 ? 1.2 : -0.9);
  const hitPulse = [60, 75, 90].reduce((a, h) => a + (f >= h ? Math.exp(-(f - h) / 4) : 0), 0);
  const sc = s * (1 + hitPulse * 0.35);
  const out = prog(f, 100, 8, E.inExpo);
  const common: React.CSSProperties = {position: 'absolute', left: d.x, top: y, transform: `translate(-50%,-50%) scale(${sc * (1 - out)}) rotate(${rot}deg)`, opacity: 0.55};
  if (d.k === 'circle') return <div style={{...common, width: d.s, height: d.s, borderRadius: '50%', border: `6px solid ${d.c}`}} />;
  if (d.k === 'dot') return <div style={{...common, width: d.s, height: d.s, borderRadius: '50%', background: d.c}} />;
  if (d.k === 'plus')
    return (
      <svg style={common} width={d.s} height={d.s} viewBox="-10 -10 20 20">
        <path d="M0 -9 V9 M-9 0 H9" stroke={d.c} strokeWidth={3.4} strokeLinecap="round" />
      </svg>
    );
  if (d.k === 'tri')
    return (
      <svg style={common} width={d.s} height={d.s} viewBox="-12 -12 24 24">
        <path d="M0 -10 L9 7 L-9 7 Z" fill="none" stroke={d.c} strokeWidth={2.6} strokeLinejoin="round" />
      </svg>
    );
  return (
    <div style={common}>
      <Paw size={d.s} color={d.c} />
    </div>
  );
};

export const S1Intro: React.FC = () => {
  const f = useF();
  const hits = [60, 75, 90, 105];
  const sh = shakeAt(f, hits, 16, 4);

  // 오프닝 라인
  const lineW = lerp(f, [0, 22], [0, 1400], E.outExpo);
  const split = prog(f, 22, 14, E.outExpo);
  const linesOut = prog(f, 54, 8, E.inExpo);

  // 배경 그리드
  const gridOff = f * 0.6;

  const nums = [
    {t: '3', at: 60, sub: '준비됐냥?', kind: 0 as const, col: C.ink},
    {t: '2', at: 75, sub: '방이도', kind: 1 as const, col: C.ink},
    {t: '1', at: 90, sub: '탄이도', kind: 2 as const, col: C.white},
  ];

  // 발바닥 도장
  const pawS = f >= 103 ? lerp(f, [103, 107], [3.4, 1], E.outQuart) : 0;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, #2A2236 0%, ${C.ink} 70%)`, overflow: 'hidden'}}>
      {/* 그리드 */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,244,227,0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,244,227,0.05) 2px, transparent 2px)',
          backgroundSize: '120px 120px',
          backgroundPosition: `${gridOff}px ${gridOff * 0.5}px`,
          opacity: lerp(f, [0, 20], [0, 1]),
        }}
      />
      {FLOATERS.map((d, i) => (
        <Floater key={i} d={d} i={i} f={f} />
      ))}
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)`}}>
        {/* 라인 */}
        {f < 64 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 960 - lineW / 2,
                width: lineW,
                top: 538 - split * 175,
                height: 4,
                background: C.orange,
                transform: `scaleX(${1 - linesOut})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 960 - lineW / 2,
                width: lineW,
                top: 538 + split * 175,
                height: 4,
                background: C.orange,
                opacity: split > 0 ? 1 : 0,
                transform: `scaleX(${1 - linesOut})`,
              }}
            />
          </>
        )}
        {/* 상단 모노 텍스트 */}
        {f < 62 && (
          <AbsoluteFill style={{opacity: 1 - linesOut}}>
            <div style={{position: 'absolute', left: 260, top: 312}}>
              <TypeText text="MOTION DESIGN SHOWREEL" start={6} cps={1.2} style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 9, color: C.cream}} cursorColor={C.orange} />
            </div>
            <div style={{position: 'absolute', right: 260, top: 312, fontFamily: F.mono, fontSize: 30, color: C.orange, letterSpacing: 6, opacity: lerp(f, [16, 22], [0, 1])}}>
              VOL.01 / 2026
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 425, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
              <KText text="주연" start={24} mode="fade" style={{fontFamily: F.pre, fontWeight: 600, fontSize: 40, color: 'rgba(255,244,227,0.7)', marginRight: 12}} />
              <KText text="방이" start={28} mode="rise" stagger={3} style={{fontFamily: F.bhs, fontSize: 150, color: C.orange}} />
              <KText text="&" start={33} mode="pop" style={{fontFamily: F.archivo, fontSize: 110, color: C.cream}} />
              <KText text="탄이" start={36} mode="rise" stagger={3} style={{fontFamily: F.bhs, fontSize: 150, color: C.white}} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 628, textAlign: 'center', fontFamily: F.pre, fontWeight: 500, fontSize: 32, color: 'rgba(255,244,227,0.55)', letterSpacing: 4, opacity: lerp(f, [40, 48], [0, 1])}}>
              치즈태비 한 마리 · 턱시도 한 마리 · 그리고 1분
            </div>
          </AbsoluteFill>
        )}

        {/* 카운트다운 */}
        {nums.map((n, i) => (
          <CountShape key={i} kind={n.kind} f={f} at={n.at} out={i === 2 ? 99 : n.at + 15} />
        ))}
        {nums.map((n, i) => {
          if (f < n.at || f > n.at + 25) return null;
          const p = prog(f, n.at, 8, E.outExpo);
          const po = i === 2 ? prog(f, 99, 5, E.inExpo) : prog(f, n.at + 15, 8, E.inExpo);
          return (
            <div
              key={'n' + i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 250,
                textAlign: 'center',
                fontFamily: F.unb,
                fontWeight: 900,
                fontSize: 400,
                lineHeight: 1,
                color: n.col,
                transform: `scale(${lerp(p, [0, 1], [1.9, 1]) * (1 + po * 3)})`,
                opacity: lerp(f, [n.at, n.at + 2], [0, 1]) * (1 - po),
                filter: `blur(${(1 - p) * 10 + po * 16}px)`,
              }}
            >
              {n.t}
            </div>
          );
        })}
        {nums.map((n, i) =>
          f >= n.at && f < (i === 2 ? 101 : n.at + 15) ? (
            <div key={'s' + i} style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center'}}>
              <KText text={n.sub} start={n.at + 2} mode="pop" stagger={1} seed={'cd' + i} style={{fontFamily: F.bhs, fontSize: 64, color: C.cream}} />
            </div>
          ) : null,
        )}
        {nums.map((n, i) => (
          <React.Fragment key={'fx' + i}>
            <Ring at={n.at} y={520} r={560} color={i === 2 ? C.red : C.orange} width={12} />
            <Burst at={n.at} y={520} r0={300} r1={640} n={14} color={C.cream} width={8} seed={'cb' + i} />
          </React.Fragment>
        ))}

        {/* 발바닥 도장 */}
        {f >= 103 && f < 112 && (
          <div style={{position: 'absolute', left: 960, top: 540, transform: `translate(-50%,-50%) scale(${pawS}) rotate(-12deg)`}}>
            <Paw size={300} color={C.orange} />
          </div>
        )}
        <Burst at={106} r0={200} r1={560} n={12} color={C.orange} width={10} seed="pawb" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
