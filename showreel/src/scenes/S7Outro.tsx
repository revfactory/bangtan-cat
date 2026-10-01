import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {Burst, Confetti, Flash, Grain, Paw, Ring, Sparkle} from '../components/fx';
import {Sticker} from '../components/media';
import {KText, TypeText} from '../components/text';
import {C, E, F, img, lerp, prog, rnd, shakeAt, spr} from '../lib/core';
import {useF} from '../lib/frame';

const POOL = [
  'g01_boop', 'g02_yawn', 'g03_breakfast', 'g04_box', 'g05_sunbeam', 'g06_window', 'g07_feather', 'g08_groom', 'g09_laptop',
  'g10_pounce', 'g11_basket', 'g12_tower', 'g13_tv', 'g14_night_window', 'g16_bangi_portrait', 'g17_tani_portrait', 'g18_both_sofa',
  'g19_tani_loaf', 'g20_bangi_bag', 'g21_tani_blanket', 'g22_noses', 'g23_rain', 'g24_bangi_cushion', 'g25_both_hug', 'test_sleep',
  'tani_p1', 'both_p2', 'bangi_p3',
];

const PITCH = 58;
const CELL = 52;
// 하트 안쪽 격자 셀 (원 두 개 + 삼각형)
const inHeart = (c: number, r: number) => {
  for (const cx of [-4.3, 4.3]) if (Math.hypot(c - cx, r + 2.4) <= 4.75) return true;
  if (r >= -1.2 && r <= 8.2) return Math.abs(c) <= (8.7 * (8.2 - r)) / 9.4;
  return false;
};
const CELLS: {c: number; r: number; x: number; y: number; d: number}[] = [];
for (let r = -7; r <= 8; r++) {
  for (let c = -10; c <= 10; c++) {
    if (inHeart(c, r)) CELLS.push({c, r, x: 960 + c * PITCH, y: 540 + (r - 0.5) * PITCH, d: Math.hypot(c, r)});
  }
}

export const S7Outro: React.FC = () => {
  const f = useF();
  const HIT = 120;
  const sh = shakeAt(f, [0, HIT], 22, 4.5);
  const pulse = f >= 30 && f < HIT ? Math.exp(-((f - 30) % 15) / 4) : 0;
  const sway = Math.sin(f / 22) * 7;
  const dim = prog(f, 58, 10);
  const cream = prog(f, HIT, 14, E.outExpo);
  const zoomIn = lerp(f, [0, HIT], [0.9, 1.04], E.outQuart);

  // 아이리스 아웃 (탄이 얼굴)
  const irisC = {x: 1505, y: 650};
  const iris = lerp(f, [206, 234], [2000, 0], E.inOutExpo);

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #3A2440 0%, ${C.ink} 65%)`}} />
      <AbsoluteFill style={{transform: `translate(${sh.x}px,${sh.y}px)`}}>
        {/* 하트 모자이크 */}
        {f < HIT + 30 && (
          <AbsoluteFill style={{perspective: 1500, transform: `scale(${zoomIn * (1 + pulse * 0.025)}) rotateY(${sway}deg)`}}>
            {CELLS.map((cell, i) => {
              const at = cell.d * 2.6;
              const p = prog(f, at, 18, E.outExpo);
              const fx = (rnd('ox' + i) - 0.5) * 3000;
              const fy = (rnd('oy' + i) - 0.5) * 2000;
              const rx = (rnd('rx' + i) - 0.5) * 360;
              const ry = (rnd('ry' + i) - 0.5) * 360;
              // 폭발
              const ex = prog(f, HIT, 22, E.outQuart);
              const ang = Math.atan2(cell.y - 520, cell.x - 960) + (rnd('ea' + i) - 0.5) * 0.6;
              const ed = ex * (900 + rnd('ed' + i) * 900);
              const x = cell.x + (1 - p) * fx + Math.cos(ang) * ed;
              const y = cell.y + (1 - p) * fy + Math.sin(ang) * ed;
              const z = (1 - p) * -2600 + ex * 600;
              const name = POOL[(i * 7 + Math.floor(i / 3)) % POOL.length];
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x - CELL / 2,
                    top: y - CELL / 2,
                    width: CELL,
                    height: CELL,
                    borderRadius: 10,
                    overflow: 'hidden',
                    transform: `translateZ(${z}px) rotateX(${(1 - p) * rx + ex * rx}deg) rotateY(${(1 - p) * ry + ex * ry}deg)`,
                    opacity: (f >= at ? lerp(p, [0, 0.2], [0, 1]) : 0) * (1 - prog(f, HIT + 8, 14)),
                    boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
                    outline: `3px solid ${C.white}`,
                  }}
                >
                  <Img src={img(name)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: `brightness(${1 - dim * 0.35})`}} />
                </div>
              );
            })}
          </AbsoluteFill>
        )}
        {/* 하트 위 문구 */}
        {f >= 58 && f < HIT + 4 && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, opacity: 1 - prog(f, HIT, 4)}}>
            <KText text="오늘도, 내일도" start={60} mode="rise" stagger={2} style={{fontFamily: F.bhs, fontSize: 132, color: C.white, WebkitTextStroke: `14px ${C.ink}`, paintOrder: 'stroke fill', textShadow: `0 12px 0 ${C.ink}`}} />
            <KText text="함께라서 더 귀여운" start={90} mode="pop" stagger={1.5} seed="ou" style={{fontFamily: F.bhs, fontSize: 96, color: C.orange, WebkitTextStroke: `12px ${C.ink}`, paintOrder: 'stroke fill', textShadow: `0 10px 0 ${C.ink}`}} />
          </AbsoluteFill>
        )}

        {/* 엔드 카드 */}
        {f >= HIT && (
          <AbsoluteFill style={{clipPath: `circle(${cream * 1300}px at 960px 520px)`, background: C.cream}}>
            <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(23,19,29,0.08) 3px, transparent 3.5px)', backgroundSize: '40px 40px', backgroundPosition: `${f}px ${f * 0.5}px`}} />
            {/* 스티커 (뒤) */}
            <Sticker name="g16_bangi_portrait" w={430} x={300} y={lerp(spr(f, HIT + 8, {damping: 11, stiffness: 120}), [0, 1], [1500, 900])} rot={8 + Math.sin(f / 9) * 2} />
            <Sticker name="g17_tani_portrait" w={480} x={1600} y={lerp(spr(f, HIT + 12, {damping: 11, stiffness: 120}), [0, 1], [1500, 900])} rot={-8 - Math.sin(f / 9) * 2} />
            {/* 로고 */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center'}}>
              <KText
                text="방탄"
                start={HIT + 1}
                mode="slam"
                stagger={4}
                dur={12}
                style={{fontFamily: F.bhs, fontSize: 330, lineHeight: 1, letterSpacing: 10}}
                charStyle={(i) => ({
                  color: i === 0 ? C.orange : C.ink,
                  textShadow: Array.from({length: 14}, (_, k) => `${k + 1}px ${k + 1}px 0 ${i === 0 ? C.ink : C.red}`).join(','),
                })}
              />
            </div>
            {f >= HIT + 10 && (
              <div style={{position: 'absolute', left: 1240, top: 170, transform: `scale(${spr(f, HIT + 10, {damping: 8, stiffness: 220})}) rotate(${18 + Math.sin(f / 6) * 8}deg)`}}>
                <Paw size={120} color={C.red} />
              </div>
            )}
            <div style={{position: 'absolute', left: 0, right: 0, top: 530, display: 'flex', justifyContent: 'center'}}>
              <KText text="BANGTAN CATS" start={HIT + 12} mode="rise" stagger={1.4} style={{fontFamily: F.unb, fontWeight: 800, fontSize: 66, letterSpacing: 22, color: C.ink}} />
            </div>
            <div style={{position: 'absolute', left: 960 - 330, top: 636, width: 660 * prog(f, HIT + 18, 14, E.outExpo), height: 4, background: C.orange}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 664, display: 'flex', justifyContent: 'center'}}>
              <KText text="방이 & 탄이" start={HIT + 20} mode="pop" stagger={1.5} seed="ed" style={{fontFamily: F.pre, fontWeight: 800, fontSize: 52, color: C.orangeDeep}} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 752, display: 'flex', justifyContent: 'center'}}>
              <TypeText text="MOTION DESIGN SHOWREEL 2026" start={HIT + 26} cps={1.5} style={{fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: 9, color: C.ink}} cursorColor={C.orange} />
            </div>
            {/* 말풍선 */}
            {f >= 186 && (
              <div style={{position: 'absolute', left: 1650, top: 440, transform: `translate(-50%,-50%) scale(${spr(f, 186, {damping: 9, stiffness: 220})})`, transformOrigin: '70% 100%'}}>
                <div style={{background: C.white, border: `5px solid ${C.ink}`, borderRadius: 40, padding: '14px 30px', fontFamily: F.gaegu, fontSize: 50, color: C.ink, whiteSpace: 'nowrap', boxShadow: '0 8px 0 rgba(0,0,0,0.15)'}}>간식은 언제 줘요?</div>
                <div style={{position: 'absolute', right: 150, bottom: -26, width: 0, height: 0, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderTop: `30px solid ${C.ink}`}} />
              </div>
            )}
            {f >= 196 && (
              <div style={{position: 'absolute', left: 330, top: 450, transform: `translate(-50%,-50%) scale(${spr(f, 196, {damping: 9, stiffness: 220})})`}}>
                <div style={{background: C.orange, border: `5px solid ${C.ink}`, borderRadius: 40, padding: '10px 30px', fontFamily: F.gaegu, fontSize: 50, color: C.ink, whiteSpace: 'nowrap'}}>나도 나도!</div>
                <div style={{position: 'absolute', left: 60, bottom: -26, width: 0, height: 0, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderTop: `30px solid ${C.ink}`}} />
              </div>
            )}
            <Sparkle x={520} y={210} at={HIT + 14} size={50} color={C.orange} />
            <Sparkle x={1420} y={460} at={HIT + 20} size={40} color={C.red} />
            <Sparkle x={760} y={480} at={HIT + 28} size={30} color={C.orange} />
          </AbsoluteFill>
        )}
        <Ring at={HIT} y={520} r={900} color={C.orange} width={18} dur={22} />
        <Burst at={HIT} y={520} r0={300} r1={900} n={24} color={C.orange} width={14} seed="end" />
        <Confetti at={HIT + 2} x={80} y={1080} angle={-Math.PI / 3} spread={0.9} n={90} power={46} seed="cl" life={90} />
        <Confetti at={HIT + 2} x={1840} y={1080} angle={(-Math.PI * 2) / 3} spread={0.9} n={90} power={46} seed="cr" life={90} />
        <Confetti at={0} x={960} y={520} n={60} power={30} colors={[C.red, C.pink, C.orange, C.white]} seed="ho" life={50} />
      </AbsoluteFill>
      {/* 아이리스 아웃 */}
      {f >= 206 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${irisC.x}px ${irisC.y}px, rgba(0,0,0,0) ${iris}px, ${C.ink} ${iris + 2}px)`,
          }}
        />
      )}
      <Grain opacity={0.08} />
      <Flash at={0} dur={6} max={0.6} />
      <Flash at={HIT} dur={8} max={1} />
    </AbsoluteFill>
  );
};
