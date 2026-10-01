import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Flash, Grain, ScribbleArrow, Vignette} from '../components/fx';
import {Brackets} from '../components/media';
import {KText, Odometer} from '../components/text';
import {C, E, F, lerp, prog, rnd, spr} from '../lib/core';
import {useF} from '../lib/frame';
import track from '../lib/kittenTrack.json';

const START = 240; // 전역 시작 프레임
const FREEZE = 204; // 로컬 프레임: 정지 + 폴라로이드

type TF = {pair: number[]; bang: number[]; tan: number[]};
const frames = (track as {frames: TF[]}).frames;

const tf = (f: number) => frames[Math.max(0, Math.min(frames.length - 1, Math.round(f)))];

/** 세그먼트 안에서만 평균 (컷 경계 넘지 않음) */
const smoothPair = (f: number) => {
  const seg = Math.floor(Math.min(f, 239) / 60) * 60;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let k = -10; k <= 10; k++) {
    const i = Math.max(seg, Math.min(seg + 59, Math.round(f) + k));
    const p = frames[i].pair;
    sx += (p[0] + p[2]) / 2;
    sy += (p[1] + p[3]) / 2;
    n++;
  }
  return {cx: sx / n, cy: sy / n};
};

const camera = (fRaw: number) => {
  const f = Math.min(fRaw, FREEZE);
  const seg = Math.floor(Math.min(f, 239) / 60) * 60;
  let s = 2.1 + 0.22 * prog(f, seg, 60, E.outQuart);
  if (f < 36) s = lerp(f, [0, 36], [1.7, 2.1], E.inOut) + 0.22 * prog(f, 0, 60, E.outQuart) * (f / 36);
  let {cx, cy} = smoothPair(f);
  cy -= 20; // 살짝 위 여백
  const hw = 960 / s;
  const hh = 540 / s;
  cx = Math.max(hw, Math.min(1080 - hw, cx));
  cy = Math.max(hh, Math.min(1920 - hh, cy));
  return {s, cx, cy};
};

const toScreen = (cam: {s: number; cx: number; cy: number}, px: number, py: number) => ({
  x: 960 + (px - cam.cx) * cam.s,
  y: 540 + (py - cam.cy) * cam.s,
});

const SEGS = [
  {at: 36, end: 58, text: '탄이의 누르기 공격!', bar: C.red},
  {at: 62, end: 118, text: '방이, 깔렸다!', bar: C.ink},
  {at: 122, end: 178, text: '뒷발 팡팡 반격!', bar: C.orangeDeep},
  {at: 182, end: 260, text: '냥냥펀치 대결!', bar: C.red},
];

const scoreAt = (f: number, events: [number, number][]) => {
  let v = 0;
  let prev = 0;
  let changeAt = -100;
  for (const [t, val] of events) {
    if (f >= t) {
      prev = v;
      v = val;
      changeAt = t;
    }
  }
  return {v, prev, changeAt};
};

const Tag: React.FC<{name: string; color: string; text: string; x: number; y: number; at: number; f: number}> = ({name, color, text, x, y, at, f}) => {
  if (f < at) return null;
  const s = spr(f, at, {damping: 11, stiffness: 220});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${s}) rotate(${-4 + Math.sin(f / 7) * 2}deg)`,
        fontFamily: F.pen,
        fontSize: 116,
        lineHeight: 1,
        color,
        textShadow: `0 0 0 ${text}, 3px 3px 0 ${text}, -3px -3px 0 ${text}, 3px -3px 0 ${text}, -3px 3px 0 ${text}, 0 6px 14px rgba(0,0,0,0.35)`,
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </div>
  );
};

export const S3Kitten: React.FC = () => {
  const f = useF();
  const cam = camera(f);
  const d = tf(Math.min(f, FREEZE));
  const bang = toScreen(cam, d.bang[0], d.bang[1]);
  const tan = toScreen(cam, d.tan[0], d.tan[1]);

  // 폴라로이드
  const pol = prog(f, FREEZE + 2, 16, E.outExpo);
  const polRot = lerp(pol, [0, 1], [0, -4]);
  const polScale = lerp(pol, [0, 1], [1, 0.64]);
  const pad = pol * 30;
  const padB = pol * 150;
  const hudOut = 1 - prog(f, FREEZE - 4, 6, E.linear);

  // 챕터 카드
  const cardIn = prog(f, 0, 9, E.outExpo);
  const cardOut = prog(f, 26, 9, E.inExpo);
  const cardX = lerp(cardIn, [0, 1], [-2600, 0]) + lerp(cardOut, [0, 1], [0, 2600]);

  // 타임코드 (가상의 테이프 카운터)
  const tc = f + 300;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const tcs = `00:00:${pad2(Math.floor(tc / 30) % 60)}:${pad2(tc % 30)}`;

  const bScore = scoreAt(f, [
    [150, 1],
    [199, 2],
  ]);
  const tScore = scoreAt(f, [
    [50, 1],
    [199, 2],
  ]);

  const seg = Math.floor(Math.min(f, 239) / 60);
  const tagAt = seg === 0 ? 40 : seg * 60 + 4;

  // 라벨 위치: 방이는 왼쪽 아래, 탄이는 오른쪽 위
  const bangLabel = {x: Math.max(220, Math.min(1700, bang.x - 330)), y: Math.max(200, Math.min(700, bang.y + 150))};
  const tanLabel = {x: Math.max(220, Math.min(1700, tan.x + 340)), y: Math.max(170, Math.min(700, tan.y - 210))};

  const ono = [
    {t: '콩!', at: 186, x: tan.x + 130, y: tan.y - 120, rot: 12, size: 150},
    {t: '콩!', at: 193, x: bang.x - 210, y: bang.y - 70, rot: -10, size: 130},
    {t: '냥!', at: 199, x: tan.x + 190, y: tan.y + 50, rot: 8, size: 170},
  ];

  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      {/* 폴라로이드 배경: 코르크/종이 */}
      {pol > 0 && (
        <AbsoluteFill
          style={{
            backgroundImage: 'radial-gradient(rgba(23,19,29,0.08) 3px, transparent 3.5px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}
      <AbsoluteFill
        style={{
          transform: `scale(${polScale}) rotate(${polRot}deg)`,
          transformOrigin: '50% 46%',
        }}
      >
        <AbsoluteFill
          style={{
            background: C.white,
            left: -pad,
            right: -pad,
            top: -pad,
            bottom: -padB,
            boxShadow: pol > 0 ? `0 30px 80px rgba(20,10,30,${0.4 * pol})` : undefined,
            borderRadius: 4,
          }}
        />
        <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
          {/* 비디오 + 카메라 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1080,
              height: 1920,
              transformOrigin: '0 0',
              transform: `translate(${960 - cam.cx * cam.s}px, ${540 - cam.cy * cam.s}px) scale(${cam.s})`,
              filter: 'sepia(0.16) saturate(1.25) contrast(1.06) brightness(1.05)',
            }}
          >
            <Sequence from={START} durationInFrames={FREEZE} layout="none">
              <OffthreadVideo src={staticFile('video/kitten_edit.mp4')} muted style={{width: 1080, height: 1920}} />
            </Sequence>
            {f >= FREEZE && <Img src={staticFile('video/kitten_freeze.png')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} />}
          </div>
          {/* 그레이드 */}
          <AbsoluteFill style={{background: 'linear-gradient(135deg, rgba(255,170,90,0.28), rgba(255,110,160,0.10) 60%, rgba(90,140,255,0.08))', mixBlendMode: 'soft-light'}} />
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at ${78 + Math.sin(f / 20) * 8}% ${8 + Math.cos(f / 25) * 6}%, rgba(255,150,60,0.55), rgba(255,120,60,0) 38%)`,
              mixBlendMode: 'screen',
              opacity: 0.7 + Math.sin(f / 9) * 0.15,
            }}
          />
          <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 4px)', opacity: hudOut}} />
          <Vignette strength={0.5} />
          {/* 카드 동안 어둡게 */}
          <AbsoluteFill style={{background: '#000', opacity: (1 - cardOut) * 0.45 * (f < 40 ? 1 : 0)}} />

          {/* 트래킹 이름표 */}
          {f < FREEZE - 2 && f >= 40 && (
            <>
              <ScribbleArrow x1={bangLabel.x + 60} y1={bangLabel.y - 46} x2={bang.x - 30} y2={bang.y + 20} at={tagAt + 3} color={C.orange} width={7} bend={-0.25} seed={'ab' + seg} />
              <ScribbleArrow x1={tanLabel.x - 70} y1={tanLabel.y + 50} x2={tan.x + 30} y2={tan.y - 24} at={tagAt + 5} color={C.white} width={7} bend={0.25} seed={'at' + seg} />
              <Tag name="방이" color={C.orange} text={C.white} x={bangLabel.x} y={bangLabel.y} at={tagAt} f={f} />
              <Tag name="탄이" color={C.ink} text={C.white} x={tanLabel.x} y={tanLabel.y} at={tagAt + 2} f={f} />
              {/* 타깃 링 */}
              {[bang, tan].map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: 46,
                    height: 46,
                    border: `5px solid ${i === 0 ? C.orange : C.white}`,
                    borderRadius: '50%',
                    transform: `translate(-50%,-50%) scale(${spr(f, tagAt + i)})`,
                    boxShadow: '0 0 0 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </>
          )}

          {/* 의성어 */}
          {ono.map((o, i) =>
            f >= o.at && f < FREEZE ? (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: o.x,
                  top: o.y,
                  transform: `translate(-50%,-50%) scale(${spr(f, o.at, {damping: 7, stiffness: 260})}) rotate(${o.rot}deg)`,
                  fontFamily: F.bagel,
                  fontSize: o.size,
                  color: C.yellow,
                  WebkitTextStroke: `10px ${C.ink}`,
                  paintOrder: 'stroke fill',
                  textShadow: `0 10px 0 ${C.ink}`,
                }}
              >
                {o.t}
              </div>
            ) : null,
          )}

          {/* 캠코더 HUD */}
          <AbsoluteFill style={{opacity: hudOut * lerp(f, [30, 38], [0, 1])}}>
            <Brackets x={56} y={44} w={1808} h={992} len={60} color="rgba(255,255,255,0.85)" width={4} />
            <div style={{position: 'absolute', left: 100, top: 84, display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 26, height: 26, borderRadius: '50%', background: '#FF3B30', opacity: Math.floor(f / 15) % 2 === 0 ? 1 : 0.15, boxShadow: '0 0 16px #FF3B30'}} />
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: C.white, letterSpacing: 4}}>REC</div>
            </div>
            <div style={{position: 'absolute', left: 100, top: 136, fontFamily: F.pre, fontWeight: 700, fontSize: 28, color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.5)'}}>아기 시절 기록 · 바닷가</div>
            <div style={{position: 'absolute', right: 100, top: 84, fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: C.white, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 22}}>
              <span>{tcs}</span>
              <span style={{display: 'inline-flex', alignItems: 'center'}}>
                <span style={{width: 54, height: 26, border: '3px solid white', borderRadius: 4, padding: 3, display: 'inline-flex', gap: 3}}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} style={{flex: 1, background: k < 2 || Math.floor(f / 10) % 2 ? 'white' : 'transparent'}} />
                  ))}
                </span>
                <span style={{width: 5, height: 12, background: 'white', marginLeft: 2}} />
              </span>
            </div>
          </AbsoluteFill>

          {/* 자막 */}
          {SEGS.map((s, i) =>
            f >= s.at && f < Math.min(s.end + 12, FREEZE) ? (
              <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 770, display: 'flex', justifyContent: 'center'}}>
                <div style={{position: 'relative'}}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -30,
                      right: -30,
                      top: 18,
                      bottom: 6,
                      background: s.bar,
                      transform: `skewX(-12deg) scaleX(${prog(f, s.at, 8, E.outExpo) * (1 - prog(f, s.end, 8, E.inExpo))})`,
                      transformOrigin: 'left center',
                    }}
                  />
                  <KText
                    text={s.text}
                    start={s.at + 2}
                    mode="rise"
                    stagger={1.2}
                    exit={s.end}
                    exitMode="up"
                    style={{position: 'relative', fontFamily: F.bhs, fontSize: 88, color: C.white, textShadow: '0 4px 0 rgba(0,0,0,0.25)'}}
                    seed={'sg' + i}
                  />
                </div>
              </div>
            ) : null,
          )}

          {/* 스코어보드 */}
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 958,
              transform: `translate(-50%,-50%) translateY(${(1 - prog(f, 36, 12, E.outExpo)) * 200}px)`,
              display: 'flex',
              alignItems: 'stretch',
              height: 84,
              borderRadius: 42,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              opacity: hudOut,
            }}
          >
            <div style={{background: C.orange, color: C.ink, display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px 0 40px', fontFamily: F.bhs, fontSize: 46}}>
              방이
              <Odometer value={String(bScore.v)} prevValue={String(bScore.prev)} changeAt={bScore.changeAt} digitWidth="0.9em" style={{fontFamily: F.unb, fontWeight: 900, fontSize: 52}} />
            </div>
            <div style={{background: C.ink, color: C.cream, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 34px'}}>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 4, color: C.orange}}>ROUND 1</div>
              <div style={{fontFamily: F.pre, fontWeight: 800, fontSize: 28}}>솜뭉치 레슬링</div>
            </div>
            <div style={{background: C.white, color: C.ink, display: 'flex', alignItems: 'center', gap: 20, padding: '0 40px 0 28px', fontFamily: F.bhs, fontSize: 46}}>
              <Odometer value={String(tScore.v)} prevValue={String(tScore.prev)} changeAt={tScore.changeAt} digitWidth="0.9em" style={{fontFamily: F.unb, fontWeight: 900, fontSize: 52}} />
              탄이
            </div>
          </div>
          {/* 득점 팝 */}
          {[
            {at: 50, x: 1420, text: '탄이 +1', c: C.ink},
            {at: 150, x: 500, text: '방이 +1', c: C.orangeDeep},
            {at: 199, x: 500, text: '방이 +1', c: C.orangeDeep},
            {at: 199, x: 1420, text: '탄이 +1', c: C.ink},
          ].map((p, i) =>
            f >= p.at && f < Math.min(p.at + 26, FREEZE) ? (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: 958 - prog(f, p.at, 26, E.outQuart) * 50,
                  transform: `translate(-50%,-50%) scale(${spr(f, p.at, {damping: 8, stiffness: 260})})`,
                  opacity: 1 - prog(f, p.at + 16, 10, E.linear),
                  background: C.yellow,
                  color: p.c,
                  fontFamily: F.bhs,
                  fontSize: 40,
                  padding: '4px 22px',
                  borderRadius: 30,
                  boxShadow: '0 6px 0 rgba(0,0,0,0.25)',
                }}
              >
                {p.text}
              </div>
            ) : null,
          )}

          <Grain opacity={0.22} />
          {/* 챕터 카드 */}
          {f < 36 && (
            <AbsoluteFill style={{transform: `translateX(${cardX}px)`}}>
              <div
                style={{
                  position: 'absolute',
                  left: -200,
                  right: -200,
                  top: 300,
                  height: 480,
                  background: C.orange,
                  transform: 'skewY(-4deg)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                }}
              />
              <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', transform: 'rotate(-4deg)'}}>
                <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 32, letterSpacing: 12, color: C.ink}}>CHAPTER 01</div>
                <div style={{fontFamily: F.bhs, fontSize: 200, lineHeight: 1.1, color: C.ink}}>아기 시절</div>
                <div style={{fontFamily: F.pen, fontSize: 78, color: C.white, marginTop: -6}}>그땐 이만큼 작았다</div>
              </div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
        {/* 폴라로이드 캡션 */}
        {pol > 0.3 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1080 + 18, display: 'flex', justifyContent: 'center'}}>
            <KText text="그땐 이만큼 작았지 ♥" start={FREEZE + 6} mode="fade" stagger={1.2} dur={8} style={{fontFamily: F.pen, fontSize: 120, color: C.ink}} />
          </div>
        )}
      </AbsoluteFill>
      <Flash at={FREEZE} dur={8} max={0.95} />
    </AbsoluteFill>
  );
};

// 미사용 경고 방지
void rnd;
