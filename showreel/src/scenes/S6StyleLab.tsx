import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Burst, Flash, Grain, Ring, SliceGlitch, Sparkle} from '../components/fx';
import {Sticker} from '../components/media';
import {KText} from '../components/text';
import {C, E, F, lerp, prog, rnd, shakeAt, spr} from '../lib/core';
import {Scene, useF} from '../lib/frame';

const STYLES = [
  {file: 'basket_0_original', ko: '원본', en: 'ORIGINAL', color: C.white},
  {file: 'basket_1_duotone', ko: '듀오톤', en: 'DUOTONE', color: '#C2366B'},
  {file: 'basket_2_halftone', ko: '하프톤', en: 'HALFTONE', color: C.navy},
  {file: 'basket_3_sketch', ko: '연필 스케치', en: 'SKETCH', color: '#555'},
  {file: 'basket_4_popart', ko: '팝아트', en: 'POP ART', color: '#E8336D'},
  {file: 'basket_5_pixel', ko: '픽셀', en: 'PIXEL', color: '#4C9F70'},
  {file: 'basket_6_riso', ko: '리소그래프', en: 'RISO', color: '#FF4FA3'},
  {file: 'basket_7_ascii', ko: '아스키 아트', en: 'ASCII', color: '#1D8F9A'},
];
const st = (file: string) => staticFile(`style/${file}.jpg`);

const RGBFilter: React.FC<{d: number}> = ({d}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id="rgbsplit" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
      <feOffset in="r" dx={d} dy={0} result="r2" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
      <feOffset in="b" dx={-d} dy={0} result="b2" />
      <feBlend in="r2" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b2" mode="screen" />
    </filter>
  </svg>
);

/* 8가지 스타일 순환 */
const Cycle: React.FC = () => {
  const f = useF();
  const idx = Math.max(0, Math.min(7, Math.floor(f / 15)));
  const local = f - idx * 15;
  const prevIdx = Math.max(0, idx - 1);
  const wipe = idx === 0 ? 1 : prog(local, 0, 5, E.outQuart);
  const zoom = lerp(f, [0, 120], [1.02, 1.14]) + Math.exp(-local / 4) * 0.03;
  const rgb = idx > 0 && local < 4 ? (4 - local) * 6 : 0;
  // 툴 패널 커서
  const itemY = (k: number) => 235 + k * 86;
  const nextK = Math.min(7, idx + 1);
  const mv = prog(local, 7, 7, E.inOut);
  const curY = idx === 7 ? itemY(7) : lerp(mv, [0, 1], [itemY(idx), itemY(nextK)]);
  const curX = 1790 + Math.sin(f / 5) * 4;
  const titleOut = prog(f, 22, 10, E.inOutExpo);
  // 음악 스터터 구간: 프레임 반복 + 좌우 튐
  const stut = f >= 105 && f < 120;
  const stX = stut ? (Math.floor(f / 2) % 2 === 0 ? 1 : -1) * 26 : 0;
  const stB = stut && f % 4 < 2 ? 1.35 : 1;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <RGBFilter d={rgb} />
      <AbsoluteFill style={{transform: `translateX(${stX}px) scale(${zoom * (stut ? 1.04 : 1)})`, filter: rgb > 0 ? 'url(#rgbsplit)' : stut ? `brightness(${stB}) contrast(1.15)` : undefined}}>
        <Img src={st(STYLES[prevIdx].file)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
        <AbsoluteFill style={{clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
          <Img src={st(STYLES[idx].file)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      </AbsoluteFill>
      {idx > 0 && wipe < 1 && (
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 10, background: C.white, boxShadow: `0 0 30px 10px ${STYLES[idx].color}`, transform: 'translateX(-50%)'}} />
      )}
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 35%)'}} />

      {/* 툴 패널 */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 150,
          width: 250,
          padding: '16px 14px',
          background: 'rgba(23,19,29,0.86)',
          borderRadius: 22,
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          transform: `translateX(${(1 - prog(f, 6, 14, E.outExpo)) * 400}px)`,
        }}
      >
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: C.orange, letterSpacing: 3, marginBottom: 8, paddingLeft: 6}}>STYLE PRESETS</div>
        {STYLES.map((s, k) => (
          <div
            key={k}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 78,
              marginBottom: 8,
              padding: '0 8px',
              borderRadius: 12,
              background: k === idx ? 'rgba(255,138,31,0.95)' : 'rgba(255,255,255,0.06)',
              transform: k === idx ? `scale(${1 + Math.exp(-local / 3) * 0.06})` : undefined,
            }}
          >
            <Img src={st(s.file)} style={{width: 96, height: 58, objectFit: 'cover', borderRadius: 6}} />
            <div style={{fontFamily: F.pre, fontWeight: 800, fontSize: 21, color: k === idx ? C.ink : 'rgba(255,255,255,0.8)', lineHeight: 1.1}}>{s.ko}</div>
          </div>
        ))}
      </div>
      {/* 커서 */}
      <svg style={{position: 'absolute', left: curX, top: curY, overflow: 'visible', opacity: prog(f, 10, 6)}} width={40} height={50}>
        <path d="M0 0 L0 36 L10 27 L17 43 L24 40 L17 24 L30 24 Z" fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      </svg>
      {idx > 0 && local < 10 && (
        <div style={{position: 'absolute', left: curX, top: itemY(idx), width: 70, height: 70, borderRadius: '50%', border: `4px solid ${C.white}`, transform: `translate(-50%,-50%) scale(${prog(local, 0, 10, E.outQuart) * 1.4})`, opacity: 1 - prog(local, 0, 10)}} />
      )}

      {/* 스타일 태그 */}
      <div key={idx} style={{position: 'absolute', left: 110, top: 840}}>
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: C.white, letterSpacing: 5, marginBottom: 6, opacity: 0.9}}>
          STYLE {String(idx + 1).padStart(2, '0')}/08 · {STYLES[idx].en}
        </div>
        <div style={{display: 'inline-block', background: C.orange, padding: '2px 26px', transform: `skewX(-10deg) scaleX(${prog(local, 0, 6, E.outExpo)})`, transformOrigin: 'left'}}>
          <KText text={STYLES[idx].ko} start={idx * 15 + 1} mode="rise" stagger={1} dur={8} style={{fontFamily: F.bhs, fontSize: 92, color: C.ink, transform: 'skewX(10deg)'}} />
        </div>
      </div>

      {/* 챕터 타이틀 */}
      {f < 40 && (
        <AbsoluteFill style={{background: `rgba(0,0,0,${0.55 * (1 - titleOut)})`}}>
          <SliceGlitch at={0} dur={4} slices={10} amp={140} seed="s6t">
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translate(${-titleOut * 640}px, ${-titleOut * 380}px) scale(${1 - titleOut * 0.6})`, opacity: 1 - prog(f, 30, 6)}}>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 14, color: C.orange}}>CHAPTER 04</div>
              <div style={{fontFamily: F.bhs, fontSize: 190, color: C.white, textShadow: `8px 0 0 rgba(255,0,90,0.8), -8px 0 0 rgba(0,220,255,0.8)`}}>스타일 실험실</div>
              <div style={{fontFamily: F.pre, fontWeight: 700, fontSize: 40, color: C.cream}}>같은 사진, 여덟 가지 감성</div>
            </AbsoluteFill>
          </SliceGlitch>
        </AbsoluteFill>
      )}
      <div style={{position: 'absolute', left: 110, top: 70, fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: C.white, opacity: prog(f, 30, 8), textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>CH.04 스타일 실험실</div>
    </AbsoluteFill>
  );
};

/* 팝아트 3×3 */
const PopGrid: React.FC = () => {
  const f = useF();
  const beat = Math.floor(f / 15);
  const sh = shakeAt(f, [22, 24, 26, 28], 14, 2);
  const out = prog(f, 45, 15, E.inOutExpo);
  const cw = 640;
  const ch = 360;
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px,${sh.y}px) scale(${1 - out * 0.22}) rotate(${-out * 5}deg)`, perspective: 1600}}>
        {Array.from({length: 9}).map((_, k) => {
          const r = Math.floor(k / 3);
          const c = k % 3;
          const at = (r + c) * 2;
          const p = prog(f, at, 10, E.outBack);
          const pal = (k + beat) % 9;
          const flash = f % 15 < 2 && f > 10 ? 1 : 0;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: c * cw + 5,
                top: r * ch + 5,
                width: cw - 10,
                height: ch - 10,
                overflow: 'hidden',
                borderRadius: 6 + out * 20,
                transform: `rotateX(${(1 - p) * 90}deg)`,
                opacity: f >= at ? 1 : 0,
                boxShadow: out > 0 ? '0 20px 40px rgba(0,0,0,0.4)' : undefined,
              }}
            >
              <Img src={staticFile(`style/basket_pop${pal}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', filter: flash ? 'brightness(1.4)' : undefined}} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <KText
          text="POP! POP! POP!"
          start={16}
          mode="pop"
          stagger={1.5}
          seed="pp"
          style={{fontFamily: F.archivo, fontSize: 170, color: C.yellow, WebkitTextStroke: `14px ${C.ink}`, paintOrder: 'stroke fill', textShadow: `0 14px 0 ${C.ink}`, transform: 'rotate(-6deg)'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 스티커 폭풍 */
const STICKERS = [
  {name: 'g16_bangi_portrait', w: 340, x: 300, y: 560, rot: -12},
  {name: 'g17_tani_portrait', w: 380, x: 1640, y: 560, rot: 10},
  {name: 'g11_basket', w: 520, x: 980, y: 760, rot: -4},
  {name: 'bangi_p3', w: 380, x: 640, y: 300, rot: 168},
  {name: 'tani_p1', w: 480, x: 1340, y: 290, rot: -8},
  {name: 'g22_noses', w: 560, x: 600, y: 900, rot: 6},
  {name: 'both_p2', w: 380, x: 1440, y: 880, rot: -10},
];

const Storm: React.FC = () => {
  const f = useF();
  const pulses = [36, 42, 46, 49, 51];
  let zoom = 1;
  for (const p of pulses) zoom += 0.045 * prog(f, p, 4, E.outExpo);
  const black = f >= 52;
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      {!black && (
        <AbsoluteFill style={{transform: `scale(${zoom})`}}>
          <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(23,19,29,0.12) 3px, transparent 3.5px)', backgroundSize: '40px 40px', backgroundPosition: `${f * 2}px ${f}px`}} />
          {/* 낙서 */}
          <svg style={{position: 'absolute', left: 0, top: 0}} width={1920} height={1080}>
            {[
              'M120 160 q40 -60 80 0 t80 0 t80 0',
              'M1600 120 q40 -60 80 0 t80 0',
              'M200 980 l30 -60 l30 60 l30 -60 l30 60',
              'M1700 960 c40 -40 80 40 120 0',
            ].map((d, k) => (
              <path key={k} d={d} fill="none" stroke={[C.orange, C.red, C.ink, C.orange][k]} strokeWidth={10} strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - prog(f, k * 3, 14))} />
            ))}
          </svg>
          {STICKERS.map((s, k) => {
            const at = Math.round(k * 7.5);
            if (f < at) return null;
            const sp = spr(f, at, {damping: 10, stiffness: 180});
            const fromX = s.x < 960 ? -600 : 2500;
            const x = lerp(sp, [0, 1], [fromX, s.x]);
            const y = lerp(sp, [0, 1], [s.y + 400, s.y]);
            return <Sticker key={k} name={s.name} w={s.w} x={x} y={y} rot={s.rot + (1 - sp) * 60 + Math.sin((f + k * 10) / 8) * 2} origin="50% 50%" />;
          })}
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <KText
              text="전부 다 귀엽잖아?!"
              start={30}
              mode="pop"
              stagger={1.5}
              seed="cute"
              style={{fontFamily: F.bhs, fontSize: 150, color: C.white, WebkitTextStroke: `16px ${C.ink}`, paintOrder: 'stroke fill', textShadow: `0 14px 0 ${C.red}`, transform: 'rotate(-4deg)'}}
            />
          </AbsoluteFill>
          {STICKERS.map((s, k) => (
            <Ring key={'r' + k} at={Math.round(k * 7.5) + 6} x={s.x} y={s.y} r={260} color={k % 2 ? C.orange : C.red} width={10} dur={12} />
          ))}
          <Sparkle x={960} y={330} at={32} size={60} color={C.orange} />
          <Sparkle x={1500} y={620} at={38} size={50} color={C.red} />
        </AbsoluteFill>
      )}
      {black && (
        <AbsoluteFill style={{background: C.ink, alignItems: 'center', justifyContent: 'center'}}>
          <svg width={160} height={150} viewBox="0 0 340 320">
            <path
              d="M170 300 C 40 210, 0 140, 20 80 C 45 10, 140 0, 170 70 C 200 0, 295 10, 320 80 C 340 140, 300 210, 170 300 Z"
              fill="none"
              stroke={C.red}
              strokeWidth={16}
              strokeLinejoin="round"
              strokeDasharray={1100}
              strokeDashoffset={1100 * (1 - prog(f, 52, 8, E.outQuart))}
            />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const S6StyleLab: React.FC = () => {
  return (
    <AbsoluteFill>
      <Scene start={0} end={120}>
        <Cycle />
      </Scene>
      <Scene start={120} end={180}>
        <PopGrid />
      </Scene>
      <Scene start={180} end={240}>
        <Storm />
      </Scene>
      <Grain opacity={0.1} />
      <Flash at={0} dur={6} max={0.7} />
      <Flash at={120} dur={4} max={0.6} />
      <Flash at={180} dur={4} max={0.6} />
      <Burst at={180} r0={160} r1={700} n={20} color={C.orange} width={12} seed="st" />
    </AbsoluteFill>
  );
};

void rnd;
