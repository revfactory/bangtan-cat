import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {Burst, Confetti, Flash, Paw, Ring, Scribble, ScribbleArrow, Sparkle} from '../components/fx';
import {Photo, PhotoCard, Sticker} from '../components/media';
import {KText} from '../components/text';
import {C, E, F, lerp, prog, rnd, shakeAt, spr, sticker} from '../lib/core';
import {Scene, useF} from '../lib/frame';

/** 원형 게이지 */
const Gauge: React.FC<{x: number; y: number; at: number; value: number; label: string; color: string; track: string; text: string}> = ({x, y, at, value, label, color, track, text}) => {
  const f = useF();
  if (f < at) return null;
  const s = spr(f, at, {damping: 12, stiffness: 200});
  const p = prog(f, at + 2, 26, E.outQuart) * (value / 100);
  const r = 58;
  const L = 2 * Math.PI * r;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, width: 150, height: 190}}>
      <svg width={150} height={150} viewBox="-75 -75 150 150">
        <circle r={r} fill="none" stroke={track} strokeWidth={14} />
        <circle r={r} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} transform="rotate(-90)" />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.unb, fontWeight: 900, fontSize: 40, color: text}}>
        {Math.round(p * 100)}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 152, textAlign: 'center', fontFamily: F.pre, fontWeight: 800, fontSize: 30, color: text}}>{label}</div>
    </div>
  );
};

const InfoRow: React.FC<{y: number; x: number; at: number; k: string; v: string; pillBg: string; pillFg: string; fg: string}> = ({y, x, at, k, v, pillBg, pillFg, fg}) => {
  const f = useF();
  if (f < at) return null;
  const p = prog(f, at, 12, E.outExpo);
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 22, opacity: p, transform: `translateX(${(1 - p) * 80}px)`}}>
      <div style={{background: pillBg, color: pillFg, fontFamily: F.pre, fontWeight: 800, fontSize: 28, padding: '6px 20px', borderRadius: 30, minWidth: 70, textAlign: 'center'}}>{k}</div>
      <div style={{fontFamily: F.pre, fontWeight: 800, fontSize: 46, color: fg, letterSpacing: -1}}>{v}</div>
    </div>
  );
};

const hardShadow = (col: string, n = 12) => Array.from({length: n}, (_, i) => `${i + 1}px ${i + 1}px 0 ${col}`).join(',');

/* ─────────── 방이 ─────────── */
const Bangi: React.FC = () => {
  const f = useF();
  const sIn = spr(f, 0, {damping: 13, stiffness: 120});
  const float = Math.sin(f / 14) * 8;
  const W = 900;
  const k = W / 1369;
  const sx = 420;
  const sy = 640 + (1 - sIn) * 700 + float;
  // 회전(180) 후 젤리 위치
  const tl = {x: sx - W / 2, y: sy - (1618 * k) / 2};
  const bean = {x: tl.x + (1369 - 207) * k, y: tl.y + (1618 - 1322) * k};
  const outWipe = prog(f, 108, 12, E.inOutExpo);
  return (
    <AbsoluteFill style={{background: C.orange, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(-58deg, rgba(226,101,10,0) 0 80px, rgba(226,101,10,0.32) 80px 128px)', backgroundPosition: `${f * 1.5}px 0`}} />
      {/* 배경 큰 외곽선 글자 */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 1400 - f * 4,
          fontFamily: F.archivo,
          fontSize: 560,
          color: 'transparent',
          WebkitTextStroke: '4px rgba(255,244,227,0.35)',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        BANG-I BANG-I
      </div>
      {/* 사진 카드 */}
      <PhotoCard name="g05_sunbeam" w={330} h={220} x={1770} y={lerp(prog(f, 18, 18), [0, 1], [-260, 120]) - f * 0.3} rot={8} border={10} />
      <PhotoCard name="g20_bangi_bag" w={330} h={220} x={1720} y={lerp(prog(f, 24, 18), [0, 1], [1360, 990]) + f * 0.2} rot={-7} border={10} />
      <PhotoCard name="g24_bangi_cushion" w={300} h={200} x={lerp(prog(f, 22, 18), [0, 1], [-300, 150])} y={140} rot={-9} border={10} />
      {/* 스티커 (180° 회전) */}
      <Img
        src={sticker('bangi_p3')}
        style={{
          position: 'absolute',
          left: tl.x,
          top: tl.y,
          width: W,
          transform: `rotate(${180 + (1 - sIn) * 14}deg)`,
          filter: 'drop-shadow(0 -18px 30px rgba(60,20,0,0.35))',
        }}
      />
      {/* 젤리 콜아웃 */}
      <Scribble cx={bean.x} cy={bean.y} rx={92} ry={82} at={74} color={C.white} width={8} seed="bean" />
      <ScribbleArrow x1={bean.x + 250} y1={bean.y - 120} x2={bean.x + 100} y2={bean.y - 30} at={78} color={C.white} width={7} bend={0.3} seed="beanA" />
      {f >= 80 && (
        <div style={{position: 'absolute', left: bean.x + 280, top: bean.y - 170, transform: `translate(-10%,-50%) scale(${spr(f, 80)}) rotate(-6deg)`, fontFamily: F.pen, fontSize: 96, color: C.white, textShadow: `0 4px 0 ${C.orangeDeep}`}}>
          젤리 발견!
        </div>
      )}
      <Sparkle x={bean.x - 60} y={bean.y - 90} at={76} size={40} color={C.yellow} />
      <Sparkle x={bean.x + 90} y={bean.y + 70} at={82} size={30} color={C.white} />

      {/* 텍스트 */}
      <div style={{position: 'absolute', left: 1010, top: 196, display: 'flex', alignItems: 'center', gap: 18}}>
        <KText text="CHARACTER 01" start={4} mode="fade" stagger={0.6} style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: C.ink}} />
        <div style={{height: 4, width: 300 * prog(f, 8, 16), background: C.ink}} />
      </div>
      <div style={{position: 'absolute', left: 1000, top: 236}}>
        <KText text="방이" start={6} mode="rise" stagger={4} dur={16} style={{fontFamily: F.bhs, fontSize: 290, lineHeight: 1.05, color: C.cream, textShadow: hardShadow(C.ink, 14)}} />
      </div>
      <div style={{position: 'absolute', left: 1014, top: 560}}>
        <KText text="BANG-I · 치즈태비" start={14} mode="blur" stagger={1} style={{fontFamily: F.unb, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: C.ink}} />
      </div>
      <InfoRow x={1010} y={630} at={24} k="특기" v="대(大)자로 뻗어 자기" pillBg={C.ink} pillFg={C.cream} fg={C.ink} />
      <InfoRow x={1010} y={700} at={30} k="무기" v="말랑 젤리 발바닥" pillBg={C.ink} pillFg={C.cream} fg={C.ink} />
      <InfoRow x={1010} y={770} at={36} k="레이더" v="간식 봉지 소리 감지" pillBg={C.ink} pillFg={C.cream} fg={C.ink} />
      <Gauge x={1090} y={940} at={48} value={100} label="애교" color={C.ink} track="rgba(23,19,29,0.15)" text={C.ink} />
      <Gauge x={1280} y={940} at={53} value={98} label="식탐" color={C.ink} track="rgba(23,19,29,0.15)" text={C.ink} />
      <Gauge x={1470} y={940} at={58} value={100} label="낮잠" color={C.ink} track="rgba(23,19,29,0.15)" text={C.ink} />
      {outWipe > 0 && <AbsoluteFill style={{background: 'rgba(0,0,0,0.25)', opacity: outWipe}} />}
    </AbsoluteFill>
  );
};

/* ─────────── 탄이 ─────────── */
const Tani: React.FC = () => {
  const f = useF();
  // 와이프 인 (프리롤 -12..0)
  const wipe = prog(f, -12, 14, E.inOutExpo);
  const edge = lerp(wipe, [0, 1], [2400, -500]);
  const sIn = spr(f, 2, {damping: 13, stiffness: 120});
  const float = Math.sin(f / 13) * 7;
  const W = 1000;
  const k = W / 1533;
  const cx = 1380 + (1 - sIn) * 700;
  const cy = 700 + float;
  const tl = {x: cx - W / 2, y: cy - (1106 * k) / 2};
  const dot = {x: tl.x + 409 * k, y: tl.y + 673 * k};
  // 돋보기
  const lensAt = 62;
  const lens = {x: 1660, y: 250, r: 150};
  const ls = spr(f, lensAt, {damping: 11, stiffness: 160});
  const Z = 2.3;
  const bowRot = Math.sin(f / 10) * 4;
  return (
    <AbsoluteFill style={{clipPath: `polygon(${edge}px 0, 2400px 0, 2400px 1080px, ${edge - 420}px 1080px)`}}>
      <AbsoluteFill style={{background: C.ink}} />
      {/* 스포트라이트 */}
      <div
        style={{
          position: 'absolute',
          left: 1380,
          top: 600,
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          transform: `translate(-50%,-50%) scale(${prog(f, 0, 20, E.outExpo)})`,
          background: `radial-gradient(circle, ${C.cream} 0 60%, rgba(255,244,227,0) 61%)`,
          backgroundImage: 'radial-gradient(rgba(23,19,29,0.10) 3px, transparent 3.5px)',
          backgroundSize: '34px 34px',
          backgroundColor: C.cream,
        }}
      />
      {/* 거대 나비넥타이 */}
      <svg style={{position: 'absolute', left: 1380 - 520, top: 120, overflow: 'visible', transform: `rotate(${-8 + bowRot}deg) scale(${spr(f, 6, {damping: 10, stiffness: 120})})`, transformOrigin: '520px 160px', opacity: 0.95}} width={1040} height={320} viewBox="-520 -160 1040 320">
        <path d="M-50 0 L-500 -150 Q-540 0 -500 150 Z" fill={C.red} />
        <path d="M50 0 L500 -150 Q540 0 500 150 Z" fill={C.red} />
        <rect x={-90} y={-95} width={180} height={190} rx={50} fill="#B81F2B" />
      </svg>
      <PhotoCard name="g23_rain" w={320} h={213} x={1790} y={lerp(prog(f, 20, 18), [0, 1], [1360, 990])} rot={6} border={10} />
      <Img src={sticker('tani_p1')} style={{position: 'absolute', left: tl.x, top: tl.y, width: W, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.45))'}} />

      {/* 텍스트 */}
      <div style={{position: 'absolute', left: 130, top: 196, display: 'flex', alignItems: 'center', gap: 18}}>
        <KText text="CHARACTER 02" start={6} mode="fade" stagger={0.6} style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: C.cream}} />
        <div style={{height: 4, width: 300 * prog(f, 10, 16), background: C.red}} />
      </div>
      <div style={{position: 'absolute', left: 120, top: 236}}>
        <KText text="탄이" start={8} mode="rise" stagger={4} dur={16} style={{fontFamily: F.bhs, fontSize: 290, lineHeight: 1.05, color: C.white, textShadow: hardShadow(C.red, 14)}} />
      </div>
      <div style={{position: 'absolute', left: 134, top: 560}}>
        <KText text="TAN-I · 턱시도" start={16} mode="blur" stagger={1} style={{fontFamily: F.unb, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: C.cream}} />
      </div>
      <InfoRow x={130} y={630} at={26} k="패션" v="빨간 나비넥타이" pillBg={C.red} pillFg={C.white} fg={C.cream} />
      <InfoRow x={130} y={700} at={32} k="매력" v="턱밑 까만 점" pillBg={C.red} pillFg={C.white} fg={C.cream} />
      <InfoRow x={130} y={770} at={38} k="눈빛" v="시크 그 자체" pillBg={C.red} pillFg={C.white} fg={C.cream} />
      <Gauge x={210} y={940} at={50} value={100} label="시크" color={C.red} track="rgba(255,244,227,0.15)" text={C.cream} />
      <Gauge x={400} y={940} at={55} value={97} label="우아" color={C.red} track="rgba(255,244,227,0.15)" text={C.cream} />
      <Gauge x={590} y={940} at={60} value={99} label="점프" color={C.red} track="rgba(255,244,227,0.15)" text={C.cream} />

      {/* 돋보기 콜아웃 */}
      {f >= lensAt && (
        <>
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1920} height={1080}>
            <line
              x1={dot.x}
              y1={dot.y}
              x2={lerp(prog(f, lensAt, 10), [0, 1], [dot.x, lens.x - lens.r * 0.7])}
              y2={lerp(prog(f, lensAt, 10), [0, 1], [dot.y, lens.y + lens.r * 0.7])}
              stroke={C.yellow}
              strokeWidth={6}
              strokeDasharray="14 10"
            />
            <circle cx={dot.x} cy={dot.y} r={26 * spr(f, lensAt)} fill="none" stroke={C.yellow} strokeWidth={6} />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: lens.x - lens.r,
              top: lens.y - lens.r,
              width: lens.r * 2,
              height: lens.r * 2,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `10px solid ${C.yellow}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
              background: C.cream,
              transform: `scale(${ls})`,
            }}
          >
            <Img
              src={sticker('tani_p1')}
              style={{
                position: 'absolute',
                width: W * Z,
                left: lens.r - 10 - 409 * k * Z,
                top: lens.r - 10 - 673 * k * Z,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: lens.x - 420,
              top: lens.y - 40,
              transform: `translate(-50%,-50%) scale(${spr(f, lensAt + 6)}) rotate(-5deg)`,
              background: C.yellow,
              color: C.ink,
              fontFamily: F.bhs,
              fontSize: 44,
              padding: '8px 24px',
              borderRadius: 14,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 0 rgba(0,0,0,0.3)',
            }}
          >
            ★ 매력 포인트 = 턱밑 점
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

/* ─────────── VS → 단짝 ─────────── */
const Versus: React.FC = () => {
  const f = useF();
  const sh = shakeAt(f, [6, 30], 20, 4);
  const inL = prog(f, 0, 10, E.outExpo);
  const flip = prog(f, 30, 10, E.inOutExpo);
  const love = prog(f, 32, 14, E.inOutExpo);
  const lean = prog(f, 34, 16, E.outBack);
  const vsRot = lerp(f, [30, 35], [0, 90], E.inQuart);
  const heartS = spr(f, 35, {damping: 8, stiffness: 220});
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `translate(${sh.x}px,${sh.y}px)`}}>
      <AbsoluteFill style={{background: C.ink}} />
      <AbsoluteFill style={{background: C.orange, clipPath: `polygon(0 0, ${lerp(inL, [0, 1], [0, 1060])}px 0, ${lerp(inL, [0, 1], [0, 860])}px 1080px, 0 1080px)`}} />
      {/* 단짝 배경 */}
      <AbsoluteFill style={{background: '#FFE3EA', clipPath: `circle(${love * 1300}px at 960px 540px)`}} />
      {love > 0 && (
        <AbsoluteFill
          style={{
            clipPath: `circle(${love * 1300}px at 960px 540px)`,
            backgroundImage: 'radial-gradient(rgba(229,56,59,0.14) 4px, transparent 4.5px)',
            backgroundSize: '44px 44px',
            backgroundPosition: `${f}px ${-f}px`,
          }}
        />
      )}
      <Sticker name="g16_bangi_portrait" w={470} x={lerp(inL, [0, 1], [-400, 520]) + lean * 150} y={600} rot={lean * 9} />
      <Sticker name="g17_tani_portrait" w={540} x={lerp(inL, [0, 1], [2300, 1400]) - lean * 150} y={600} rot={-lean * 9} />
      {/* VS */}
      {f >= 6 && f < 36 && (
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: 540,
            transform: `translate(-50%,-50%) scale(${lerp(prog(f, 6, 8, E.outExpo), [0, 1], [3, 1])}) rotateY(${vsRot}deg) rotate(-8deg)`,
            fontFamily: F.archivo,
            fontSize: 300,
            color: C.yellow,
            WebkitTextStroke: `16px ${C.ink}`,
            paintOrder: 'stroke fill',
            textShadow: `0 16px 0 ${C.ink}`,
            opacity: lerp(f, [6, 8], [0, 1]),
          }}
        >
          VS
        </div>
      )}
      {f >= 35 && (
        <svg style={{position: 'absolute', left: 960 - 170, top: 250 - 160, overflow: 'visible', transform: `scale(${0.82 * heartS * (1 + Math.max(0, Math.sin((f - 35) / 3.5)) * 0.06)})`}} width={340} height={320} viewBox="0 0 340 320">
          <path d="M170 300 C 40 210, 0 140, 20 80 C 45 10, 140 0, 170 70 C 200 0, 295 10, 320 80 C 340 140, 300 210, 170 300 Z" fill={C.red} stroke={C.white} strokeWidth={14} />
        </svg>
      )}
      <Burst at={6} r0={200} r1={620} n={18} color={C.yellow} width={12} seed="vs" />
      <Burst at={35} y={250} r0={160} r1={520} n={12} color={C.red} width={10} seed="hb" />
      <Ring at={35} y={250} r={600} color={C.red} />
      {/* 캡션 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 870, display: 'flex', justifyContent: 'center'}}>
 {f < 40 && <KText text="라이벌?" start={8} mode="pop" stagger={2} exit={30} exitMode="fall" style={{fontFamily: F.bhs, fontSize: 120, color: C.white, textShadow: hardShadow(C.ink, 8)}} />}
        {f >= 34 && <KText text="아니, 단짝!" start={36} mode="pop" stagger={2} style={{fontFamily: F.bhs, fontSize: 120, color: C.red, textShadow: hardShadow(C.white, 8)}} />}
      </div>
      {/* 하트 파티클 */}
      {Array.from({length: 14}).map((_, i) => {
        const at = 38 + i * 1.5;
        if (f < at) return null;
        const t = f - at;
        const x = 960 + (rnd('hx' + i) - 0.5) * 1500;
        const y = 1100 - t * (9 + rnd('hy' + i) * 8);
        return (
          <div key={i} style={{position: 'absolute', left: x + Math.sin(t / 5 + i) * 30, top: y, fontSize: 40 + rnd('hs' + i) * 40, color: i % 2 ? C.red : C.pink, transform: 'translate(-50%,-50%)', opacity: lerp(t, [0, 4, 18, 24], [0, 1, 1, 0])}}>
            ♥
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ─────────── 간식 개그 ─────────── */
const Snack: React.FC = () => {
  const f = useF();
  const pulses = [15, 30, 38, 45, 49, 52];
  let zoom = lerp(prog(f, 0, 7, E.outExpo), [0, 1], [1.3, 1]);
  for (const p of pulses) zoom += 0.055 * prog(f, p, 5, E.outExpo);
  const sh = shakeAt(f, [0, ...pulses], 10, 3);
  const blackout = f >= 52;
  const lines = Math.floor(f / 2);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      {!blackout && (
        <>
          <AbsoluteFill style={{transform: `translate(${sh.x}px,${sh.y}px) scale(${zoom})`, transformOrigin: '50% 45%'}}>
            <Photo name="both_p2" pos="50% 50%" />
          </AbsoluteFill>
          {/* 만화 집중선 */}
          <svg style={{position: 'absolute', left: 0, top: 0}} width={1920} height={1080}>
            {Array.from({length: 70}).map((_, i) => {
              const a = (i / 70) * Math.PI * 2 + rnd('ml' + i + lines) * 0.05;
              const r0 = 520 + rnd('mr' + i + lines) * 260;
              const w = 4 + rnd('mw' + i) * 10;
              const x0 = 960 + Math.cos(a) * r0;
              const y0 = 500 + Math.sin(a) * r0 * 0.75;
              const x1 = 960 + Math.cos(a) * 1500;
              const y1 = 500 + Math.sin(a) * 1500 * 0.75;
              const nx = -Math.sin(a) * w;
              const ny = Math.cos(a) * w;
              return <path key={i} d={`M${x0},${y0} L${x1 + nx},${y1 + ny} L${x1 - nx},${y1 - ny} Z`} fill="rgba(10,8,14,0.85)" />;
            })}
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center'}}>
            <KText text="간식 소리 들었다!" start={3} mode="pop" stagger={1.5} style={{fontFamily: F.bhs, fontSize: 126, color: C.white, WebkitTextStroke: `12px ${C.ink}`, paintOrder: 'stroke fill', textShadow: `0 10px 0 ${C.ink}`}} />
          </div>
          {f >= 15 && (
            <div style={{position: 'absolute', left: 520, top: 360, transform: `translate(-50%,-50%) scale(${spr(f, 15, {damping: 7, stiffness: 260})}) rotate(-12deg)`, fontFamily: F.bagel, fontSize: 170, color: C.yellow, WebkitTextStroke: `12px ${C.ink}`, paintOrder: 'stroke fill'}}>
              !!
            </div>
          )}
          {f >= 22 && (
            <div style={{position: 'absolute', left: 1480, top: 330, transform: `translate(-50%,-50%) scale(${spr(f, 22, {damping: 7, stiffness: 260})}) rotate(12deg)`, fontFamily: F.bagel, fontSize: 170, color: C.yellow, WebkitTextStroke: `12px ${C.ink}`, paintOrder: 'stroke fill'}}>
              !!
            </div>
          )}
          <div style={{position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', justifyContent: 'center'}}>
            <KText text="언제 줘요? 지금 줘요?" start={30} mode="pop" stagger={1.2} style={{fontFamily: F.bagel, fontSize: 92, color: C.yellow, WebkitTextStroke: `10px ${C.ink}`, paintOrder: 'stroke fill'}} />
          </div>
        </>
      )}
      {blackout && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: F.pre, fontWeight: 600, fontSize: 40, color: 'rgba(255,255,255,0.8)', letterSpacing: 6}}>…간식?</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const S4Profiles: React.FC = () => (
  <AbsoluteFill>
    <Scene start={0} end={120}>
      <Bangi />
    </Scene>
    <Scene start={120} end={240} pre={12}>
      <Tani />
    </Scene>
    <Scene start={240} end={300}>
      <Versus />
    </Scene>
    <Scene start={300} end={360}>
      <Snack />
    </Scene>
    <Flash at={0} dur={6} max={0.5} />
    <Flash at={240} dur={5} max={0.7} />
    <Flash at={300} dur={5} max={0.8} />
    <Confetti at={276} x={960} y={540} n={60} power={36} colors={[C.red, C.pink, C.white, C.yellow]} seed="love" />
  </AbsoluteFill>
);

void Paw;
