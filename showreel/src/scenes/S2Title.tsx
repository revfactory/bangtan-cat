import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Burst, Confetti, Flash, Paw, Ring} from '../components/fx';
import {Sticker, Ticker} from '../components/media';
import {KText} from '../components/text';
import {C, E, F, lerp, prog, shakeAt, spr} from '../lib/core';
import {useF} from '../lib/frame';

/** 거대 글자 슬램 */
const BigChar: React.FC<{ch: string; at: number; x: number; y: number; size: number; color: string; shadow: string; f: number}> = ({ch, at, x, y, size, color, shadow, f}) => {
  if (f < at) return null;
  const p = prog(f, at, 9, E.outExpo);
  const s = lerp(p, [0, 1], [2.6, 1]);
  const op = lerp(f, [at, at + 2], [0, 1]);
  const layers = Array.from({length: 14}, (_, i) => `${i + 1}px ${i + 1}px 0 ${shadow}`).join(',');
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${s})`,
        fontFamily: F.bhs,
        fontSize: size,
        lineHeight: 1,
        color,
        opacity: op,
        filter: `blur(${(1 - p) * 12}px)`,
        textShadow: layers,
      }}
    >
      {ch}
    </div>
  );
};

export const S2Title: React.FC = () => {
  const f = useF();
  const sh = shakeAt(f, [0, 15, 60], 22, 4.5);

  // 4마디(60)에서 글자들이 가운데로 모임
  const join = prog(f, 60, 16, E.inOutExpo);
  const outZoom = prog(f, 104, 16, E.inExpo);

  // 배경 분할선
  const tilt = lerp(f, [-15, 10], [0, 140], E.outExpo) - join * 140;
  const splitX = 960;
  const bgCream = prog(f, 60, 14, E.inOutExpo);

  const bangX = lerp(join, [0, 1], [520, 760]);
  const tanX = lerp(join, [0, 1], [1400, 1160]);
  const charY = lerp(join, [0, 1], [470, 400]);
  const charSize = lerp(join, [0, 1], [500, 360]);

  // 스티커
  const sB = spr(f, 28, {damping: 10, stiffness: 150});
  const sT = spr(f, 33, {damping: 10, stiffness: 150});
  const bob = Math.sin(f / 9) * 6;

  // 이름표
  const tagIn = (at: number) => spr(f, at, {damping: 12, stiffness: 200});

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.ink}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + outZoom * 2.5})`, filter: outZoom > 0 ? `blur(${outZoom * 18}px)` : undefined}}>
        {/* 분할 배경 */}
        <AbsoluteFill
          style={{
            background: C.orange,
            clipPath: `polygon(0 0, ${splitX + tilt}px 0, ${splitX - tilt}px 1080px, 0 1080px)`,
          }}
        />
        {/* 줄무늬 결 (치즈태비) */}
        <AbsoluteFill
          style={{
            clipPath: `polygon(0 0, ${splitX + tilt}px 0, ${splitX - tilt}px 1080px, 0 1080px)`,
            backgroundImage: 'repeating-linear-gradient(-62deg, rgba(226,101,10,0.0) 0 70px, rgba(226,101,10,0.35) 70px 110px)',
            backgroundPosition: `${f * 2}px 0`,
          }}
        />
        {/* 하단 크림 전환 */}
        <AbsoluteFill style={{background: C.cream, clipPath: `circle(${bgCream * 1300}px at 960px 540px)`}} />
        {bgCream > 0 && (
          <AbsoluteFill
            style={{
              clipPath: `circle(${bgCream * 1300}px at 960px 540px)`,
              backgroundImage: 'radial-gradient(rgba(23,19,29,0.09) 3px, transparent 3.5px)',
              backgroundSize: '36px 36px',
              backgroundPosition: `${-f}px ${-f * 0.5}px`,
            }}
          />
        )}

        {/* 티커 */}
        {f >= 62 && (
          <>
            <Ticker text="BANGTAN CATS  ·  방탄  ·  방이 & 탄이" y={lerp(prog(f, 62, 12), [0, 1], [-160, 46])} rot={-4} bg={C.ink} color={C.cream} size={40} h={78} speed={9} />
            <Ticker text="치즈태비 × 턱시도  ·  SHOWREEL 2026" y={lerp(prog(f, 64, 12), [0, 1], [1180, 950])} rot={3} bg={C.orange} color={C.ink} size={40} h={78} speed={7} dir={-1} />
          </>
        )}

        {/* 스티커 (뒤쪽) */}
        <Sticker name="bangi_p3" w={560} x={lerp(join, [0, 1], [300, 250])} y={lerp(sB, [0, 1], [1400, 820]) + bob} rot={-10 + (1 - sB) * -30} />
        <Sticker name="tani_p1" w={620} x={lerp(join, [0, 1], [1610, 1660])} y={lerp(sT, [0, 1], [1400, 860]) - bob} rot={6 + (1 - sT) * 30} />

        {/* 큰 글자 */}
        <BigChar ch="방" at={0} x={bangX} y={charY} size={charSize} color={join > 0.5 ? C.orange : C.cream} shadow={join > 0.5 ? C.ink : C.orangeDeep} f={f} />
        <BigChar ch="탄" at={15} x={tanX} y={charY} size={charSize} color={join > 0.5 ? C.ink : C.white} shadow={C.red} f={f} />

        {/* 이름표 + 더하기 */}
        {f >= 44 && f < 62 && (
          <>
            <div style={{position: 'absolute', left: 520, top: 760, transform: `translate(-50%,-50%) scale(${tagIn(44)})`, background: C.ink, color: C.orange, fontFamily: F.bhs, fontSize: 56, padding: '6px 34px', borderRadius: 60}}>방이</div>
            <div style={{position: 'absolute', left: 1400, top: 760, transform: `translate(-50%,-50%) scale(${tagIn(47)})`, background: C.white, color: C.ink, fontFamily: F.bhs, fontSize: 56, padding: '6px 34px', borderRadius: 60}}>탄이</div>
            <div
              style={{
                position: 'absolute',
                left: 960,
                top: 470,
                width: 130,
                height: 130,
                borderRadius: '50%',
                background: C.yellow,
                color: C.ink,
                fontFamily: F.archivo,
                fontSize: 100,
                lineHeight: '124px',
                textAlign: 'center',
                transform: `translate(-50%,-50%) scale(${tagIn(50)}) rotate(${(1 - tagIn(50)) * 180}deg)`,
                boxShadow: '0 10px 0 rgba(0,0,0,0.25)',
              }}
            >
              +
            </div>
          </>
        )}

        {/* 결합 후 서브타이틀 */}
        {f >= 66 && (
          <>
            <div style={{position: 'absolute', left: 0, right: 0, top: 618, display: 'flex', justifyContent: 'center'}}>
              <KText text="BANGTAN CATS" start={68} mode="rise" stagger={1.5} style={{fontFamily: F.unb, fontWeight: 800, fontSize: 70, letterSpacing: 18, color: C.ink}} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 724, display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center'}}>
              <KText text="방이" start={76} mode="pop" style={{fontFamily: F.pre, fontWeight: 800, fontSize: 46, color: C.orangeDeep}} />
              <KText text="+" start={78} mode="pop" style={{fontFamily: F.pre, fontWeight: 800, fontSize: 46, color: C.ink}} />
              <KText text="탄이" start={80} mode="pop" style={{fontFamily: F.pre, fontWeight: 800, fontSize: 46, color: C.ink}} />
              <KText text="=" start={82} mode="pop" style={{fontFamily: F.pre, fontWeight: 800, fontSize: 46, color: C.ink}} />
              <KText text="방탄" start={84} mode="pop" style={{fontFamily: F.pre, fontWeight: 900, fontSize: 46, color: C.red}} />
            </div>
            {f >= 70 && (
              <div style={{position: 'absolute', left: 960 + 330, top: 250, transform: `translate(-50%,-50%) scale(${spr(f, 72)}) rotate(${-18 + Math.sin(f / 6) * 6}deg)`}}>
                <Paw size={110} color={C.red} />
              </div>
            )}
          </>
        )}

        <Ring at={0} x={520} y={470} r={520} color={C.cream} />
        <Ring at={15} x={1400} y={470} r={520} color={C.red} />
        <Burst at={0} x={520} y={470} r0={260} r1={620} n={14} color={C.cream} width={10} seed="t1" />
        <Burst at={15} x={1400} y={470} r0={260} r1={620} n={14} color={C.white} width={10} seed="t2" />
        <Confetti at={64} x={960} y={420} n={110} power={40} seed="tc" />
      </AbsoluteFill>
      <Flash at={0} dur={6} max={0.85} />
      <Flash at={60} dur={5} max={0.5} />
      <Flash at={118} dur={4} max={1} />
    </AbsoluteFill>
  );
};
