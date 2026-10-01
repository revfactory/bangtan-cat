import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {Flash, Grain, Ring, Scribble, ScribbleArrow, SliceGlitch, Sparkle} from '../components/fx';
import {Photo} from '../components/media';
import {KText, Odometer, TypeText} from '../components/text';
import {C, E, F, img, lerp, prog, rnd, shakeAt, spr} from '../lib/core';
import {Scene, useF} from '../lib/frame';

type Enter = 'punch' | 'pushR' | 'iris' | 'flip' | 'spin' | 'pushU' | 'panels' | 'window' | 'glitch' | 'diag' | 'whip' | 'fadeDream';
type Exit = 'none' | 'pushL' | 'flip' | 'pushU' | 'whip' | 'tvoff';

type ShotDef = {
  t0: number;
  t1: number;
  time: string;
  hour: number;
  period: string;
  img: string;
  cap: string;
  enter: Enter;
  exit: Exit;
  tint?: string;
  pos?: string;
};

const SHOTS: ShotDef[] = [
  {t0: 0, t1: 45, time: '07:00', hour: 7, period: 'MORNING', img: 'g01_boop', cap: '일어나, 집사야', enter: 'punch', exit: 'pushL'},
  {t0: 45, t1: 75, time: '07:30', hour: 7.5, period: 'MORNING', img: 'g02_yawn', cap: '하아아암~', enter: 'pushR', exit: 'none'},
  {t0: 75, t1: 120, time: '08:00', hour: 8, period: 'MORNING', img: 'g03_breakfast', cap: '아침밥은 나란히', enter: 'iris', exit: 'flip'},
  {t0: 120, t1: 180, time: '10:00', hour: 10, period: 'MORNING', img: 'g04_box', cap: '상자는 일단 들어가고 본다', enter: 'flip', exit: 'none'},
  {t0: 180, t1: 210, time: '12:00', hour: 12, period: 'NOON', img: 'g05_sunbeam', cap: '햇살 충전 중', enter: 'spin', exit: 'pushU'},
  {t0: 210, t1: 240, time: '13:00', hour: 13, period: 'AFTERNOON', img: 'g06_window', cap: '오늘의 새 관찰', enter: 'pushU', exit: 'none'},
  {t0: 240, t1: 300, time: '15:00', hour: 15, period: 'AFTERNOON', img: 'g07_feather', cap: '사냥 본능 ON', enter: 'panels', exit: 'none'},
  {t0: 300, t1: 360, time: '17:00', hour: 17, period: 'EVENING', img: 'g09_laptop', cap: '업무 방해 전문', enter: 'window', exit: 'none', tint: 'rgba(255,140,60,0.18)'},
  {t0: 360, t1: 390, time: '19:00', hour: 19, period: 'EVENING', img: 'g08_groom', cap: '서로서로 그루밍', enter: 'glitch', exit: 'none', tint: 'rgba(255,110,60,0.22)'},
  {t0: 390, t1: 420, time: '20:00', hour: 20, period: 'NIGHT', img: 'g12_tower', cap: '높은 곳은 탄이 차지', enter: 'diag', exit: 'whip', tint: 'rgba(120,90,200,0.18)'},
  {t0: 420, t1: 450, time: '22:00', hour: 22, period: 'NIGHT', img: 'g13_tv', cap: '같이 TV 보기', enter: 'whip', exit: 'tvoff'},
  {t0: 450, t1: 480, time: '23:00', hour: 23, period: 'NIGHT', img: 'test_sleep', cap: '꼭 붙어서 꿀잠', enter: 'fadeDream', exit: 'none', tint: 'rgba(60,70,160,0.28)'},
];

/** 방향 모션블러 필터 */
const MBlur: React.FC<{id: string; x: number; y?: number}> = ({id, x, y = 0}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} />
    </filter>
  </svg>
);

/* 컷별 오버레이 */
const Overlay: React.FC<{i: number}> = ({i}) => {
  const f = useF();
  if (i === 0) {
    // 톡! (발바닥)
    return (
      <>
        <Ring at={8} x={200} y={430} r={240} color={C.pink} width={12} />
        {f >= 9 && (
          <div style={{position: 'absolute', left: 380, top: 180, transform: `translate(-50%,-50%) scale(${spr(f, 9, {damping: 7, stiffness: 260})}) rotate(-10deg)`, fontFamily: F.bagel, fontSize: 130, color: C.pink, WebkitTextStroke: `10px ${C.white}`, paintOrder: 'stroke fill'}}>
            톡!
          </div>
        )}
      </>
    );
  }
  if (i === 1) {
    return (
      <div style={{position: 'absolute', left: 820, top: 230}}>
        <KText text="하아아암~" start={4} mode="stretch" stagger={1.5} style={{fontFamily: F.bagel, fontSize: 110, color: C.white, WebkitTextStroke: `9px ${C.ink}`, paintOrder: 'stroke fill', transform: 'rotate(-6deg)'}} />
      </div>
    );
  }
  if (i === 2) {
    return (
      <>
        {[
          {x: 640, y: 700, at: 10, t: '냠'},
          {x: 1240, y: 690, at: 16, t: '냠냠'},
          {x: 900, y: 600, at: 24, t: '오독'},
        ].map((p, k) =>
          f >= p.at ? (
            <div key={k} style={{position: 'absolute', left: p.x, top: p.y - (f - p.at) * 1.2, transform: `translate(-50%,-50%) scale(${spr(f, p.at, {damping: 8, stiffness: 240})}) rotate(${(k - 1) * 10}deg)`, fontFamily: F.bagel, fontSize: 84, color: C.yellow, WebkitTextStroke: `8px ${C.ink}`, paintOrder: 'stroke fill'}}>
              {p.t}
            </div>
          ) : null,
        )}
      </>
    );
  }
  if (i === 3) {
    return (
      <>
        <Scribble cx={590} cy={790} rx={330} ry={200} at={14} color={C.yellow} width={9} seed="box" />
        <ScribbleArrow x1={1180} y1={300} x2={900} y2={620} at={20} color={C.yellow} width={8} bend={-0.2} seed="boxa" />
        {f >= 24 && (
          <div style={{position: 'absolute', left: 1220, top: 230, transform: `translate(-30%,-50%) scale(${spr(f, 24)}) rotate(-5deg)`, fontFamily: F.pen, fontSize: 110, color: C.white, textShadow: `0 0 12px rgba(0,0,0,0.5), 3px 3px 0 ${C.ink}`}}>
            사이즈 미스?
          </div>
        )}
      </>
    );
  }
  if (i === 4) {
    // 충전 아이콘
    const p = prog(f, 6, 22, E.outQuart);
    return (
      <div style={{position: 'absolute', left: 1500, top: 240, transform: `scale(${spr(f, 4)})`, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 190, height: 92, border: `9px solid ${C.white}`, borderRadius: 20, padding: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.3)'}}>
          <div style={{height: '100%', width: `${10 + p * 90}%`, background: p > 0.95 ? '#4CD964' : C.yellow, borderRadius: 8}} />
        </div>
        <div style={{width: 14, height: 36, background: C.white, borderRadius: 4, marginLeft: -12}} />
        <div style={{fontFamily: F.unb, fontWeight: 900, fontSize: 56, color: C.white, textShadow: '0 4px 12px rgba(0,0,0,0.4)'}}>{Math.round(10 + p * 90)}%</div>
      </div>
    );
  }
  if (i === 5) {
    const s = spr(f, 6, {damping: 12, stiffness: 180});
    return (
      <>
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1920} height={1080}>
          <g transform={`translate(1470,110) scale(${s}) rotate(${(1 - s) * 90})`} stroke={C.yellow} strokeWidth={6} fill="none">
            <circle r={90} />
            <path d="M-130 0 L-100 0 M100 0 L130 0 M0 -130 L0 -100 M0 100 L0 130" />
          </g>
        </svg>
        {f >= 10 && (
          <div style={{position: 'absolute', left: 1180, top: 230, fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.yellow, background: 'rgba(0,0,0,0.55)', padding: '6px 16px', borderRadius: 8}}>
            <TypeText text="TARGET: 참새 1마리" start={10} cps={1.3} cursor={false} />
          </div>
        )}
      </>
    );
  }
  if (i === 7) {
    // 업무 방해: 토스트 + 문서창
    const ts = prog(f, 10, 12, E.outExpo);
    return (
      <>
        <div style={{position: 'absolute', right: 70, top: 60 + (1 - ts) * -160, width: 560, background: 'rgba(255,255,255,0.92)', borderRadius: 22, padding: '20px 26px', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', display: 'flex', gap: 18, alignItems: 'center'}}>
          <div style={{width: 64, height: 64, borderRadius: 16, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>🐾</div>
          <div>
            <div style={{fontFamily: F.pre, fontWeight: 800, fontSize: 28, color: C.ink}}>방이님이 키보드를 점령했습니다</div>
            <div style={{fontFamily: F.pre, fontWeight: 500, fontSize: 22, color: '#666'}}>오늘의 업무는 여기까지입니다</div>
          </div>
        </div>
        {f >= 18 && (
          <div style={{position: 'absolute', left: 120, top: 120, width: 640, background: '#FFFDF8', borderRadius: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.35)', overflow: 'hidden', transform: `scale(${spr(f, 18, {damping: 13})})`, transformOrigin: '0 0'}}>
            <div style={{height: 44, background: '#E9E4DA', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px'}}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                <div key={c} style={{width: 16, height: 16, borderRadius: '50%', background: c}} />
              ))}
              <div style={{fontFamily: F.pre, fontWeight: 600, fontSize: 20, color: '#777', marginLeft: 12}}>중요한_보고서_최종.txt</div>
            </div>
            <div style={{padding: '22px 26px', fontFamily: F.mono, fontSize: 34, color: C.ink, lineHeight: 1.35, minHeight: 140}}>
              <TypeText text={'ㅁㄴㅇㄹㅁㄴㅇ;;;;;;\nㅋㅋㅋㅋㅋㅋㅋㅋㅋ ppppppp'} start={22} cps={1.4} cursorColor={C.orange} />
            </div>
          </div>
        )}
      </>
    );
  }
  if (i === 8) {
    return (
      <>
        {Array.from({length: 8}).map((_, k) => {
          const at = 6 + k * 2;
          if (f < at) return null;
          const t = f - at;
          return (
            <div key={k} style={{position: 'absolute', left: 900 + (rnd('gh' + k) - 0.5) * 500, top: 420 - t * 7, fontSize: 50 + rnd('gs' + k) * 30, color: k % 2 ? C.pink : C.red, opacity: lerp(t, [0, 3, 16, 22], [0, 1, 1, 0]), transform: 'translate(-50%,-50%)'}}>
              ♥
            </div>
          );
        })}
      </>
    );
  }
  if (i === 10) {
    // TV 깜빡임
    const fl = 0.12 + rnd('tv' + Math.floor(f / 2)) * 0.18;
    return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 10%, rgba(80,140,255,${fl}), rgba(0,0,0,0) 60%)`, mixBlendMode: 'screen'}} />;
  }
  if (i === 11) {
    return (
      <>
        {['Z', 'z', 'z'].map((z, k) => {
          const at = 6 + k * 5;
          if (f < at) return null;
          const t = f - at;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 1530 + k * 80 + Math.sin(t / 4) * 14,
                top: 250 - k * 75 - t * 2.2,
                fontFamily: F.bagel,
                fontSize: 110 - k * 22,
                color: C.white,
                WebkitTextStroke: `6px ${C.navy}`,
                paintOrder: 'stroke fill',
                opacity: lerp(t, [0, 4, 20, 26], [0, 1, 1, 0.6]),
                transform: `rotate(${-10 + k * 8}deg)`,
              }}
            >
              {z}
            </div>
          );
        })}
        <Sparkle x={300} y={150} at={4} size={34} color={C.white} dur={24} />
        <Sparkle x={1700} y={120} at={10} size={40} color={C.yellow} dur={20} />
        <Sparkle x={520} y={90} at={16} size={26} color={C.white} dur={14} />
      </>
    );
  }
  return null;
};

/* 사냥 3패널 */
const Panels: React.FC = () => {
  const f = useF();
  const panels = [
    {img: 'g07_feather', label: '점프!', at: 0, pos: '45% 40%'},
    {img: 'g10_pounce', label: '조준 중', at: 15, pos: '62% 50%'},
    {img: 'g11_basket', label: '매복 완료', at: 30, pos: '50% 45%'},
  ];
  const merge = 0;
  return (
    <AbsoluteFill>
      {panels.map((p, k) => {
        const pin = prog(f, p.at, 12, E.outExpo);
        const dir = k % 2 === 0 ? -1 : 1;
        const w = 640;
        const x = k * w;
        const s = spr(f, p.at + 3, {damping: 9, stiffness: 230});
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x + 6,
              top: 0,
              width: w - 12,
              height: 1080,
              overflow: 'hidden',
              outline: `12px solid ${C.ink}`,
              transform: `translateY(${dir * (1 - pin) * 1100}px) translateY(${dir * merge * -1100}px)`,
            }}
          >
            <Img src={img(p.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos, transform: `scale(${1.15 - pin * 0.08})`}} />
            {f >= p.at + 3 && (
              <div style={{position: 'absolute', left: '50%', top: 270, transform: `translate(-50%,-50%) scale(${s}) rotate(${dir * 6}deg)`, background: C.yellow, color: C.ink, fontFamily: F.bhs, fontSize: 60, padding: '6px 28px', borderRadius: 12, boxShadow: '0 8px 0 rgba(0,0,0,0.35)', whiteSpace: 'nowrap'}}>
                {p.label}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 한 컷 */
const Shot: React.FC<{d: ShotDef; i: number}> = ({d, i}) => {
  const f = useF();
  const dur = d.t1 - d.t0;
  const kb = lerp(f, [0, dur + 10], [1.03, 1.12]);
  let style: React.CSSProperties = {};
  let wrapStyle: React.CSSProperties = {};
  let filterId: string | null = null;
  let blurX = 0;
  let blurY = 0;
  // ── 입장
  if (d.enter === 'punch') {
    const p = prog(f, 0, 9, E.outExpo);
    style.transform = `scale(${lerp(p, [0, 1], [1.35, 1])})`;
    style.filter = `blur(${(1 - p) * 10}px)`;
  } else if (d.enter === 'pushR') {
    const p = prog(f, 0, 10, E.outExpo);
    const v = prog(f, 0, 10, E.outExpo) - prog(f - 1, 0, 10, E.outExpo);
    style.transform = `translateX(${(1 - p) * 1920}px)`;
    blurX = v * 400;
    style.boxShadow = '-30px 0 60px rgba(0,0,0,0.45)';
  } else if (d.enter === 'iris') {
    const p = prog(f, 0, 12, E.outExpo);
    wrapStyle.clipPath = `circle(${p * 1150}px at 940px 820px)`;
  } else if (d.enter === 'flip') {
    const p = prog(f, 0, 7, E.outQuart);
    wrapStyle.transform = `perspective(1800px) rotateY(${(1 - p) * -90}deg)`;
    if (f < 0) wrapStyle.opacity = 0;
  } else if (d.enter === 'spin') {
    const p = prog(f, 0, 12, E.outExpo);
    style.transform = `rotate(${(1 - p) * 30}deg) scale(${lerp(p, [0, 1], [1.8, 1])})`;
    wrapStyle.opacity = lerp(f, [0, 3], [0, 1]);
    wrapStyle.clipPath = `circle(${lerp(p, [0, 1], [200, 1200])}px at 960px 540px)`;
  } else if (d.enter === 'pushU') {
    const p = prog(f, 0, 10, E.outExpo);
    style.transform = `translateY(${(1 - p) * 1080}px)`;
    blurY = (prog(f, 0, 10, E.outExpo) - prog(f - 1, 0, 10, E.outExpo)) * 300;
  } else if (d.enter === 'window') {
    const p = prog(f, 0, 14, E.outExpo);
    const s = lerp(p, [0, 1], [0.32, 1]);
    wrapStyle.transform = `scale(${s})`;
    wrapStyle.borderRadius = lerp(p, [0, 1], [60, 0]);
    wrapStyle.overflow = 'hidden';
    wrapStyle.boxShadow = '0 40px 120px rgba(0,0,0,0.6)';
  } else if (d.enter === 'diag') {
    const p = prog(f, 0, 11, E.inOutExpo);
    const x = lerp(p, [0, 1], [-700, 2400]);
    wrapStyle.clipPath = `polygon(0 0, ${x + 500}px 0, ${x}px 1080px, 0 1080px)`;
  } else if (d.enter === 'whip') {
    const p = prog(f, 0, 9, E.outExpo);
    style.transform = `translateX(${(p - 1) * 1920}px)`;
    blurX = (prog(f, 0, 9, E.outExpo) - prog(f - 1, 0, 9, E.outExpo)) * 500;
  } else if (d.enter === 'fadeDream') {
    const p = prog(f, 0, 14, E.outQuart);
    wrapStyle.opacity = p;
    style.filter = `blur(${(1 - p) * 20}px) brightness(${0.4 + p * 0.6})`;
  }
  // ── 퇴장
  if (d.exit === 'pushL' && f >= dur) {
    const p = prog(f, dur, 10, E.outExpo);
    style.transform = `${style.transform ?? ''} translateX(${-p * 700}px)`;
    style.filter = `brightness(${1 - p * 0.5})`;
  } else if (d.exit === 'flip') {
    const p = prog(f, dur - 7, 7, E.inQuart);
    if (p > 0) wrapStyle.transform = `perspective(1800px) rotateY(${p * 90}deg)`;
  } else if (d.exit === 'pushU' && f >= dur) {
    const p = prog(f, dur, 10, E.outExpo);
    style.transform = `${style.transform ?? ''} translateY(${-p * 500}px)`;
    style.filter = `brightness(${1 - p * 0.5})`;
  } else if (d.exit === 'whip' && f >= dur) {
    const p = prog(f, dur, 9, E.outExpo);
    style.transform = `${style.transform ?? ''} translateX(${p * 1920}px)`;
    blurX = (prog(f, dur, 9, E.outExpo) - prog(f - 1, dur, 9, E.outExpo)) * 500;
  } else if (d.exit === 'tvoff') {
    const p1 = prog(f, dur - 8, 5, E.inQuart);
    const p2 = prog(f, dur - 3, 3, E.inQuart);
    if (p1 > 0) {
      wrapStyle.transform = `scaleY(${lerp(p1, [0, 1], [1, 0.006])}) scaleX(${1 - p2})`;
      wrapStyle.filter = `brightness(${1 + p1 * 3})`;
    }
  }
  if (blurX > 0.5 || blurY > 0.5) {
    filterId = `mb${i}`;
    style.filter = `${style.filter ?? ''} url(#${filterId})`;
  }
  const tint = d.tint;
  const content =
    d.enter === 'panels' ? (
      <Panels />
    ) : (
      <AbsoluteFill style={{...style, overflow: 'hidden'}}>
        {d.img === 'g12_tower' ? (
          <Photo name={d.img} pos={`50% ${lerp(prog(f, 0, dur, E.inOut), [0, 1], [95, 12])}%`} scale={1.02} />
        ) : (
          <Photo name={d.img} scale={kb} pos={d.pos} />
        )}
        {tint && <AbsoluteFill style={{background: tint, mixBlendMode: 'multiply'}} />}
        <Overlay i={i} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{...wrapStyle, background: d.enter === 'fadeDream' ? '#000' : undefined}}>
      {filterId && <MBlur id={filterId} x={blurX} y={blurY} />}
      {d.enter === 'glitch' ? (
        <SliceGlitch at={0} dur={6} slices={12} amp={160} seed="dg">
          {content}
        </SliceGlitch>
      ) : (
        content
      )}
    </AbsoluteFill>
  );
};

/* 시계 + 타임라인 */
const DayUI: React.FC = () => {
  const f = useF();
  let idx = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].t0) idx = k;
  const cur = SHOTS[idx];
  const prev = SHOTS[Math.max(0, idx - 1)];
  const hp = prog(f, cur.t0, 12, E.outExpo);
  const hour = lerp(hp, [0, 1], [prev.hour, cur.hour]);
  const x0 = 170;
  const x1 = 1750;
  const hx = (h: number) => x0 + ((h - 6) / 18) * (x1 - x0);
  const uiIn = prog(f, 8, 14, E.outExpo);
  const night = cur.hour >= 20;
  const sunset = cur.hour >= 17 && cur.hour < 20;
  const iconS = spr(f, cur.t0, {damping: 9, stiffness: 220});
  const capKey = idx;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(10,8,16,0.75) 0%, rgba(10,8,16,0.0) 34%)'}} />
      {/* 시계 */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 60,
          transform: `translateX(${(1 - uiIn) * -500}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: 'rgba(255,253,248,0.94)',
          borderRadius: 60,
          padding: '12px 34px 12px 16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
        }}
      >
        <svg width={72} height={72} viewBox="-36 -36 72 72" style={{transform: `scale(${0.6 + iconS * 0.4})`}}>
          {night ? (
            <path d="M8 -26 A26 26 0 1 0 26 8 A20 20 0 1 1 8 -26 Z" fill={C.navy} />
          ) : (
            <g transform={`rotate(${f * 2})`}>
              {Array.from({length: 8}).map((_, k) => (
                <rect key={k} x={-3} y={-34} width={6} height={10} rx={3} fill={sunset ? C.orangeDeep : C.orange} transform={`rotate(${k * 45})`} />
              ))}
              <circle r={18} fill={sunset ? C.orangeDeep : C.yellow} />
            </g>
          )}
        </svg>
        <Odometer value={cur.time} prevValue={prev.time} changeAt={cur.t0} dur={12} digitWidth="0.84em" style={{fontFamily: F.unb, fontWeight: 900, fontSize: 64, color: C.ink}} />
        <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.orangeDeep, letterSpacing: 3, marginLeft: 6, width: 170}}>{cur.period}</div>
      </div>
      {/* 챕터 라벨 (우상단) */}
      <div style={{position: 'absolute', right: 120, top: 900, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: C.white, opacity: lerp(f, [34, 42], [0, 1]) * 0.85, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
          CH.03 방탄의 하루
      </div>
      {/* 캡션 */}
      <div key={capKey} style={{position: 'absolute', left: 120, top: 820}}>
        <div style={{position: 'absolute', left: -20, right: -24, top: 22, bottom: 4, background: C.orange, transform: `skewX(-12deg) scaleX(${prog(f, cur.t0, 8, E.outExpo)})`, transformOrigin: 'left'}} />
        <KText text={cur.cap} start={cur.t0 + 2} mode="rise" stagger={1} dur={10} style={{position: 'relative', fontFamily: F.bhs, fontSize: 84, color: C.white}} />
      </div>
      {/* 타임라인 자 */}
      <svg style={{position: 'absolute', left: 0, top: 0, opacity: uiIn}} width={1920} height={1080}>
        <line x1={x0} y1={985} x2={x1} y2={985} stroke="rgba(255,255,255,0.35)" strokeWidth={4} />
        <line x1={x0} y1={985} x2={hx(hour)} y2={985} stroke={C.orange} strokeWidth={6} />
        {Array.from({length: 19}).map((_, k) => {
          const h = 6 + k;
          const big = h % 3 === 0;
          return (
            <g key={k}>
              <line x1={hx(h)} y1={985 - (big ? 18 : 10)} x2={hx(h)} y2={985} stroke={h <= hour ? C.orange : 'rgba(255,255,255,0.5)'} strokeWidth={3} />
              {big && (
                <text x={hx(h)} y={1025} fill="rgba(255,255,255,0.8)" fontFamily={F.mono} fontSize={20} fontWeight={700} textAnchor="middle">
                  {String(h).padStart(2, '0')}
                </text>
              )}
            </g>
          );
        })}
        <g transform={`translate(${hx(hour)}, 985)`}>
          <circle r={13} fill={C.orange} stroke={C.white} strokeWidth={5} />
          <circle r={24 + Math.sin(f / 3) * 3} fill="none" stroke={C.orange} strokeWidth={3} opacity={0.6} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* 챕터 타이틀 */
const DayTitle: React.FC = () => {
  const f = useF();
  if (f > 44) return null;
  const out = prog(f, 32, 10, E.inExpo);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - out, transform: `scale(${1 + out * 0.6})`}}>
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 14, color: C.white, textShadow: '0 2px 12px rgba(0,0,0,0.6)', marginBottom: 10}}>
        <KText text="CHAPTER 03" start={2} mode="fade" stagger={0.6} />
      </div>
      <KText
        text="방탄의 하루"
        start={0}
        mode="slam"
        stagger={2}
        style={{fontFamily: F.bhs, fontSize: 210, color: C.white, WebkitTextStroke: `14px ${C.ink}`, paintOrder: 'stroke fill', textShadow: `0 14px 0 ${C.ink}`}}
      />
    </AbsoluteFill>
  );
};

export const S5Day: React.FC = () => {
  const f = useF();
  const hits = SHOTS.map((s) => s.t0);
  const sh = shakeAt(f, [0, 240, 255, 270], 12, 4);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px,${sh.y}px)`}}>
        {SHOTS.map((d, i) => {
          const pre = d.enter === 'flip' ? 0 : 0;
          const post = d.exit === 'pushL' || d.exit === 'pushU' || d.exit === 'whip' ? 10 : d.exit === 'none' ? 12 : 0;
          return (
            <Scene key={i} start={d.t0} end={d.t1} pre={pre} post={post}>
              <Shot d={d} i={i} />
            </Scene>
          );
        })}
      </AbsoluteFill>
      <DayUI />
      <DayTitle />
      <Grain opacity={0.12} />
      <Flash at={0} dur={6} max={0.9} />
      {hits.slice(1).map((h) => (
        <Flash key={h} at={h} dur={3} max={0.18} />
      ))}
    </AbsoluteFill>
  );
};
