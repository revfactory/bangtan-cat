import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {KText, Odometer} from '../components/text';
import {C, E, F, lerp, prog, spr} from '../lib/core';
import {useF} from '../lib/frame';
import track from '../lib/kittenTrack.json';
import data from './data.json';
import {BeforeAfter, Card, Chip, CodeView, M, MakingBg, mk, Note, Stamp, StepHeader, Win} from './ui';

const SHOWREEL = staticFile('making/showreel.mp4');

/* ───────── M5 STEP 04 아기 시절 영상 (1040–1280) ───────── */
const SEGS = [
  {s: 0.3, e: 2.3, label: '누르기', c: C.red},
  {s: 3.2, e: 5.2, label: '깔림', c: C.ink},
  {s: 5.6, e: 7.6, label: '뒷발', c: C.orangeDeep},
  {s: 9.7, e: 11.3, label: '냥펀치', c: C.red},
];

const TrackGraph: React.FC<{x: number; y: number; w: number; h: number; at: number}> = ({x, y, w, h, at}) => {
  const f = useF();
  const fr = (track as {frames: {bang: number[]; tan: number[]}[]}).frames;
  const p = prog(f, at, 50, E.inOut);
  const n = Math.max(2, Math.floor(p * fr.length));
  const path = (k: 'bang' | 'tan', idx: 0 | 1, lo: number, hi: number) =>
    fr
      .slice(0, n)
      .map((d, i) => `${i === 0 ? 'M' : 'L'}${(x + (i / (fr.length - 1)) * w).toFixed(1)},${(y + h - ((d[k][idx] - lo) / (hi - lo)) * h).toFixed(1)}`)
      .join(' ');
  if (f < at) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1920} height={1080}>
      <rect x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" />
      {[60, 120, 180].map((c) => (
        <line key={c} x1={x + (c / 239) * w} x2={x + (c / 239) * w} y1={y} y2={y + h} stroke="rgba(255,255,255,0.15)" strokeDasharray="6 6" />
      ))}
      <path d={path('bang', 0, 250, 900)} fill="none" stroke={C.orange} strokeWidth={5} strokeLinejoin="round" />
      <path d={path('tan', 0, 250, 900)} fill="none" stroke={C.white} strokeWidth={5} strokeLinejoin="round" />
      <text x={x} y={y - 14} fill={M.grey} fontFamily={F.mono} fontSize={18} fontWeight={700}>
        X 좌표 · 240프레임
      </text>
      <text x={x + w} y={y - 14} fill={C.orange} fontFamily={F.pre} fontSize={22} fontWeight={800} textAnchor="end">
        ● 방이 <tspan fill={C.white}>● 탄이</tspan>
      </text>
    </svg>
  );
};

export const M5Step4: React.FC = () => {
  const f = useF();
  const aOut = prog(f, 92, 8, E.inExpo);
  const bOut = prog(f, 172, 8, E.inExpo);
  const thumbW = 126;
  const tx0 = 204;
  const secX = (s: number) => tx0 + (s / 12) * thumbW * 12;
  return (
    <AbsoluteFill>
      <MakingBg />
      {/* a: 편집 */}
      {f < 100 && (
        <AbsoluteFill style={{opacity: 1 - aOut}}>
          <div style={{position: 'absolute', left: tx0, top: 240, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: M.grey, letterSpacing: 3}}>SOURCE · 12.0초</div>
          <div style={{position: 'absolute', left: tx0, top: 280, display: 'flex'}}>
            {Array.from({length: 12}).map((_, i) => (
              <Img key={i} src={mk(`vf/vf_${String(i * 2 + 1).padStart(2, '0')}.png`)} style={{width: thumbW, height: 105, objectFit: 'cover', opacity: lerp(f, [28 + i, 32 + i], [0, 1]), borderRight: '2px solid #000'}} />
            ))}
          </div>
          {SEGS.map((s, i) => {
            const at = 40 + i * 5;
            if (f < at) return null;
            const p = prog(f, at, 8, E.outExpo);
            const drop = prog(f, 62 + i * 3, 14, E.inOutExpo);
            const x0 = secX(s.s);
            const w0 = secX(s.e) - x0;
            const x1 = 360 + i * 300;
            const x = lerp(drop, [0, 1], [x0, x1]);
            const w = lerp(drop, [0, 1], [w0, 300]);
            const y = lerp(drop, [0, 1], [272, 560]);
            return (
              <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: 121, border: `5px solid ${C.orange}`, borderRadius: 8, background: drop > 0 ? s.c : 'rgba(255,138,31,0.18)', transform: `scaleY(${p})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{fontFamily: F.bhs, fontSize: 36, color: C.white, opacity: drop}}>{s.label}</div>
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 360, top: 700, width: 1200, display: 'flex', opacity: prog(f, 74, 10)}}>
            {Array.from({length: 17}).map((_, i) => (
              <div key={i} style={{position: 'absolute', left: i * 75, width: 2, height: i % 4 === 0 ? 30 : 16, background: i % 4 === 0 ? C.orange : 'rgba(255,255,255,0.4)'}} />
            ))}
          </div>
          <Chip x={960} y={800} at={80} text="2초씩 4컷 = 박자에 딱 맞춤 (1박 = 15프레임)" bg={C.cream} size={30} />
        </AbsoluteFill>
      )}
      {/* b: 트래킹 시도 */}
      {f >= 94 && f < 180 && (
        <AbsoluteFill style={{opacity: (1 - bOut) * prog(f, 94, 6)}}>
          <div style={{position: 'absolute', left: 110, top: 220, fontFamily: F.bhs, fontSize: 52, color: C.white}}>
            {f < 128 ? '1차 시도 · 색으로 고양이 찾기' : '2차 시도 · 윤곽(Vision) + 털색 중심'}
          </div>
          <div style={{position: 'absolute', left: 110, top: 310, width: 1700, height: 315, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
            <Img src={mk(f < 128 ? 'img/trk_fail.jpg' : f < 146 ? 'img/trk_mask.jpg' : 'img/trk_ok.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          {f < 128 && <Stamp x={1440} y={720} at={106} ok={false} text="그림자·난간까지 잡힘" />}
          {f >= 146 && <Stamp x={1440} y={720} at={150} ok text="두 마리 따로 추적 성공" />}
          {f >= 128 && f < 146 && <Chip x={600} y={720} at={130} text="분홍 = 탄이 · 노랑 = 방이" bg={C.cream} size={30} />}
          {f >= 146 && <Chip x={600} y={720} at={148} text="● 방이  ● 탄이  □ 둘이" bg={C.cream} size={30} />}
        </AbsoluteFill>
      )}
      {/* c: 결과 */}
      {f >= 176 && (
        <AbsoluteFill style={{opacity: prog(f, 176, 6)}}>
          <div style={{position: 'absolute', left: 100, top: 210, width: 1040, height: 585, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
            <Sequence from={1040 + 176} layout="none">
              <OffthreadVideo src={SHOWREEL} muted startFrom={290} style={{width: '100%', height: '100%'}} />
            </Sequence>
          </div>
          <TrackGraph x={1220} y={290} w={600} h={300} at={180} />
          <Chip x={1520} y={700} at={196} text="이름표가 고양이를 따라다님" bg={C.orange} size={30} />
          <Note x={1520} y={880} at={206} rot={-4} w={470} lines={['색으로 찾기 실패 →', '윤곽으로 찾기 성공']} />
        </AbsoluteFill>
      )}
      <StepHeader n={4} title="아기 시절 영상" time="22:35 – 22:37" />
    </AbsoluteFill>
  );
};

/* ───────── M6 STEP 05 스타일 실험 (1280–1440) ───────── */
const STYLES = ['0_original', '1_duotone', '2_halftone', '3_sketch', '4_popart', '5_pixel', '6_riso', '7_ascii'];
const STYLE_KO = ['원본', '듀오톤', '하프톤', '연필 스케치', '팝아트', '픽셀', '리소그래프', '아스키'];

export const M6Step5: React.FC = () => {
  const f = useF();
  const aOut = prog(f, 100, 8, E.inExpo);
  const imgFill = (src: string) => <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  return (
    <AbsoluteFill>
      <MakingBg />
      {f < 108 && (
        <AbsoluteFill style={{opacity: 1 - aOut}}>
          <BeforeAfter x={510} y={520} w={800} h={450} at={32} slideAt={64} before={imgFill(mk('img/halftone_before.jpg'))} after={imgFill(staticFile('style/basket_2_halftone.jpg'))} beforeLabel="첫 시도" afterLabel="보정 후" />
          <BeforeAfter x={1410} y={520} w={800} h={450} at={38} slideAt={70} before={imgFill(mk('img/ascii_before.jpg'))} after={imgFill(staticFile('style/basket_7_ascii.jpg'))} beforeLabel="첫 시도" afterLabel="보정 후" />
          {f >= 44 && f < 70 && (
            <div style={{position: 'absolute', left: 960, top: 820, transform: `translate(-50%,-50%) scale(${spr(f, 44)}) rotate(-3deg)`, fontFamily: F.pen, fontSize: 84, color: '#FF7A7E'}}>너무 어둡다… 고양이가 안 보여</div>
          )}
          <Chip x={510} y={830} at={82} text="점 크기 곡선 다시" bg={M.mint} size={28} />
          <Chip x={1410} y={830} at={86} text="칸마다 원래 색을 깔기" bg={M.mint} size={28} />
        </AbsoluteFill>
      )}
      {f >= 102 && (
        <AbsoluteFill>
          <div style={{position: 'absolute', left: 960 - (4 * 400 + 3 * 16) / 2, top: 230, display: 'grid', gridTemplateColumns: 'repeat(4, 400px)', gap: 16}}>
            {STYLES.map((s, i) => {
              const at = 104 + i * 2;
              const p = prog(f, at, 10, E.outBack);
              const on = Math.floor((f - 120) / 5) % 8 === i && f >= 120;
              return (
                <div key={s} style={{position: 'relative', height: 225, borderRadius: 12, overflow: 'hidden', transform: `perspective(900px) rotateX(${(1 - p) * 90}deg) scale(${on ? 1.04 : 1})`, opacity: f >= at ? 1 : 0, boxShadow: on ? `0 0 0 5px ${C.orange}, 0 16px 30px rgba(0,0,0,0.5)` : '0 12px 26px rgba(0,0,0,0.45)'}}>
                  <Img src={staticFile(`style/basket_${s}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  <div style={{position: 'absolute', left: 10, bottom: 10, background: 'rgba(0,0,0,0.7)', color: C.white, fontFamily: F.pre, fontWeight: 800, fontSize: 22, padding: '3px 12px', borderRadius: 8}}>{STYLE_KO[i]}</div>
                </div>
              );
            })}
          </div>
          <Chip x={960} y={790} at={124} text="8가지 스타일 → 쇼릴에서 한 박자에 하나씩" bg={C.orange} size={32} />
        </AbsoluteFill>
      )}
      <Note x={1620} y={930} at={52} rot={3} w={440} lines={['실패작도 기록해 둔다', '(첫 하프톤)']} out={98} />
      <StepHeader n={5} title="스타일 실험" time="22:40 – 22:42" />
    </AbsoluteFill>
  );
};

/* ───────── M7 STEP 06 음악 (1440–1680) ───────── */
const SECTIONS = [
  {s: 0, e: 2, t: '인트로'},
  {s: 2, e: 4, t: '타이틀'},
  {s: 4, e: 8, t: '아기 시절'},
  {s: 8, e: 14, t: '캐릭터'},
  {s: 14, e: 22, t: '방탄의 하루'},
  {s: 22, e: 26, t: '스타일'},
  {s: 26, e: 30, t: '아웃트로'},
];
const SFX = [
  ['whoosh', '휙'],
  ['impact', '쾅'],
  ['pop', '뽁'],
  ['shutter', '찰칵'],
  ['ding', '띵'],
  ['boop', '톡'],
  ['whistle', '호루라기'],
  ['bell', '땡'],
  ['glitch', '지직'],
  ['type', '타닥'],
  ['riser', '상승음'],
  ['click', '딸깍'],
  ['swoosh_rev', '역심벌'],
  ['crowd', '환호'],
  ['pop_hi', '뽁↑'],
  ['whoosh_short', '휙↓'],
];

export const M7Step6: React.FC = () => {
  const f = useF();
  const reveal = prog(f, 34, 70, E.inOut);
  const SX = 80;
  const SW = 1760;
  const SH = 455;
  const aOut = prog(f, 132, 8, E.inExpo);
  const meter = prog(f, 196, 26, E.outQuart);
  const lufs = lerp(meter, [0, 1], [-40, -13.9]);
  return (
    <AbsoluteFill>
      <MakingBg />
      {f < 140 && (
        <AbsoluteFill style={{opacity: 1 - aOut}}>
          <div style={{position: 'absolute', left: SX, top: 300, width: SW, height: SH, borderRadius: 12, overflow: 'hidden', background: '#000', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
            <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`}}>
              <Img src={mk('img/music_spec.jpg')} style={{width: '100%', height: '100%', objectFit: 'fill'}} />
            </div>
            <div style={{position: 'absolute', top: 0, bottom: 0, left: reveal * SW - 2, width: 4, background: C.white, boxShadow: '0 0 20px white', opacity: reveal > 0 && reveal < 1 ? 1 : 0}} />
          </div>
          {SECTIONS.map((s, i) => {
            const x0 = SX + (s.s / 30) * SW;
            const w = ((s.e - s.s) / 30) * SW;
            const at = 34 + (s.s / 30) * 70;
            return (
              <div key={i} style={{position: 'absolute', left: x0 + 4, top: 772, width: w - 8, opacity: prog(f, at, 8), borderTop: `4px solid ${i % 2 ? C.orange : C.cream}`, paddingTop: 8, textAlign: 'center', fontFamily: F.pre, fontWeight: 800, fontSize: 24, color: C.white, whiteSpace: 'nowrap'}}>
                {s.t}
              </div>
            );
          })}
          <Chip x={290} y={230} at={40} text="120 BPM" bg={C.orange} size={30} />
          <Chip x={560} y={230} at={50} text="30마디 = 60초" bg={C.cream} size={30} />
          <Chip x={880} y={230} at={60} text="1박 = 15프레임" bg={C.cream} size={30} />
          <Chip x={1270} y={230} at={70} text="샘플 0개 · 전부 코드로 합성" bg={M.mint} size={30} />
        </AbsoluteFill>
      )}
      {f >= 134 && (
        <AbsoluteFill style={{opacity: prog(f, 134, 6)}}>
          <div style={{position: 'absolute', left: 140, top: 210, fontFamily: F.bhs, fontSize: 60, color: C.white}}>
            효과음 16종 → <span style={{color: C.orange}}>130번</span> 화면에 맞춰 배치
          </div>
          <div style={{position: 'absolute', left: 140, top: 320, width: 1640, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 16}}>
            {SFX.map(([en, ko], i) => {
              const at = 138 + i * 2;
              const s = f >= at ? spr(f, at, {damping: 10, stiffness: 240}) : 0;
              const bars = Array.from({length: 9}, (_, k) => 0.25 + Math.abs(Math.sin(k * 1.7 + i)) * 0.75 * Math.exp(-k / (3 + (i % 4))));
              return (
                <div key={en} style={{height: 150, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', transform: `scale(${s})`, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'flex-end', gap: 4, height: 50}}>
                    {bars.map((b, k) => (
                      <div key={k} style={{flex: 1, height: `${b * 100}%`, background: i % 3 === 0 ? C.orange : C.cream, borderRadius: 2}} />
                    ))}
                  </div>
                  <div>
                    <div style={{fontFamily: F.bhs, fontSize: 32, color: C.white}}>{ko}</div>
                    <div style={{fontFamily: F.mono, fontSize: 15, color: M.grey}}>{en}.wav</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 라우드니스 미터 */}
          {f >= 192 && (
            <div style={{position: 'absolute', left: 140, top: 720, width: 1640}}>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: M.grey, marginBottom: 10, letterSpacing: 2}}>LOUDNESS (LUFS)</div>
              <div style={{position: 'relative', height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
                <div style={{width: `${((lufs + 40) / 40) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${M.mint}, ${C.yellow} 80%, ${C.orange})`, borderRadius: 18}} />
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 16, color: M.grey, marginTop: 6}}>
                {[-40, -30, -20, -10, 0].map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
              <div style={{position: 'absolute', right: 0, top: -14, fontFamily: F.unb, fontWeight: 900, fontSize: 48, color: C.white}}>{lufs.toFixed(1)}</div>
            </div>
          )}
        </AbsoluteFill>
      )}
      <Note x={1730} y={205} at={96} rot={4} w={380} lines={['모든 컷은 박자 위에', '떨어지게 설계']} out={130} />
      <StepHeader n={6} title="음악 만들기" time="22:34 – 22:46 · 병렬 진행" />
    </AbsoluteFill>
  );
};

/* ───────── M8 STEP 07 코드 (1680–2000) ───────── */
const SCENE_BLOCKS = [
  {s: 0, e: 4, t: '인트로', c: '#6B5B95'},
  {s: 4, e: 8, t: '타이틀', c: C.orange},
  {s: 8, e: 16, t: '아기 시절', c: '#C77D4A'},
  {s: 16, e: 28, t: '캐릭터', c: C.red},
  {s: 28, e: 44, t: '방탄의 하루', c: '#E0A030'},
  {s: 44, e: 52, t: '스타일', c: '#C2366B'},
  {s: 52, e: 60, t: '아웃트로', c: '#4C9F70'},
];

const SlamDemo: React.FC = () => {
  const f = useF();
  const loop = f % 40;
  return (
    <AbsoluteFill style={{background: `linear-gradient(105deg, ${C.orange} 0 50%, ${C.ink} 50% 100%)`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', gap: 60}}>
        {['방', '탄'].map((ch, i) => {
          const at = i * 8;
          const p = prog(loop, at, 9, E.outExpo);
          return (
            <div key={ch} style={{fontFamily: F.bhs, fontSize: 200, lineHeight: 1, color: i ? C.white : C.cream, transform: `scale(${lerp(p, [0, 1], [2.6, 1])})`, opacity: lerp(loop, [at, at + 2], [0, 1]), filter: `blur(${(1 - p) * 12}px)`, textShadow: Array.from({length: 10}, (_, k) => `${k + 1}px ${k + 1}px 0 ${i ? C.red : C.orangeDeep}`).join(',')}}>
              {ch}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', right: 16, top: 12, fontFamily: F.mono, fontSize: 18, color: 'rgba(255,255,255,0.85)'}}>frame {String(loop).padStart(2, '0')} / 40</div>
    </AbsoluteFill>
  );
};

export const M8Step7: React.FC = () => {
  const f = useF();
  const aOut = prog(f, 168, 10, E.inExpo);
  const scrub = prog(f, 196, 100, E.inOut);
  const sec = scrub * 60;
  const TX = 120;
  const TW = 1680;
  return (
    <AbsoluteFill>
      <MakingBg />
      {f < 180 && (
        <AbsoluteFill style={{opacity: 1 - aOut, transform: `translateY(${-aOut * 40}px)`}}>
          <Win x={90} y={170} w={1010} h={800} title="S2Title.tsx — showreel" at={30}>
            <CodeView lines={data.snippet} at={36} lps={1.1} size={21} startLine={10} highlight={f >= 80 ? [2, 3, 18] : []} />
          </Win>
          <Win x={1150} y={170} w={680} h={420} title="Preview · 30fps" at={40}>
            <SlamDemo />
          </Win>
          <Win x={1150} y={630} w={680} h={250} title="core.ts" at={52}>
            <CodeView lines={data.timing} at={56} lps={1} size={19} startLine={5} />
          </Win>
          <Chip x={1490} y={930} at={84} text="프레임 → 보간 → 변형" bg={C.orange} size={28} />
          {f >= 84 && f < 168 && (
            <div style={{position: 'absolute', left: 1180, top: 500, transform: `scale(${spr(f, 90)}) rotate(-3deg)`, transformOrigin: '0 50%', fontFamily: F.pen, fontSize: 52, color: C.yellow, background: 'rgba(15,14,19,0.82)', padding: '2px 18px', borderRadius: 10}}>크기 2.6배 → 1배 · 흐림 12px → 0</div>
          )}
        </AbsoluteFill>
      )}
      {f >= 172 && (
        <AbsoluteFill style={{opacity: prog(f, 172, 8)}}>
          {/* 프리뷰 모니터 */}
          <div style={{position: 'absolute', left: 960 - 400, top: 140, width: 800, height: 450, borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)', background: '#000'}}>
            <Freeze frame={Math.min(1799, Math.round(sec * 30))}>
              <OffthreadVideo src={SHOWREEL} muted style={{width: '100%', height: '100%'}} />
            </Freeze>
            <div style={{position: 'absolute', right: 12, bottom: 10, fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: C.white, background: 'rgba(0,0,0,0.6)', padding: '2px 10px', borderRadius: 6}}>
              {`00:${String(Math.floor(sec)).padStart(2, '0')}:${String(Math.floor((sec % 1) * 30)).padStart(2, '0')}`}
            </div>
          </div>
          {/* 타임라인 */}
          <div style={{position: 'absolute', left: TX, top: 650, width: TW}}>
            <div style={{position: 'relative', height: 26}}>
              {Array.from({length: 121}).map((_, i) => (
                <div key={i} style={{position: 'absolute', left: (i / 120) * TW, bottom: 0, width: 2, height: i % 8 === 0 ? 22 : i % 2 === 0 ? 12 : 6, background: i % 8 === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'}} />
              ))}
            </div>
            <div style={{position: 'relative', height: 96, marginTop: 8}}>
              {SCENE_BLOCKS.map((b, i) => {
                const at = 176 + i * 3;
                const s = f >= at ? spr(f, at, {damping: 13, stiffness: 220}) : 0;
                const active = sec >= b.s && sec < b.e && f >= 196;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: (b.s / 60) * TW + 2,
                      width: ((b.e - b.s) / 60) * TW - 4,
                      top: 0,
                      height: 96,
                      borderRadius: 10,
                      background: b.c,
                      transform: `scaleY(${s})`,
                      boxShadow: active ? `0 0 0 4px ${C.white}` : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '0 14px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 15, color: 'rgba(0,0,0,0.6)'}}>S{i + 1}</div>
                    <div style={{fontFamily: F.bhs, fontSize: 28, color: C.white, whiteSpace: 'nowrap'}}>{b.t}</div>
                  </div>
                );
              })}
              {f >= 196 && <div style={{position: 'absolute', left: (sec / 60) * TW - 2, top: -50, height: 160, width: 4, background: C.white, boxShadow: '0 0 12px white'}} />}
            </div>
          </div>
          <Chip x={560} y={900} at={296} text="장면 7개" bg={C.cream} size={32} />
          <Chip x={960} y={900} at={302} text={`TypeScript ${data.srcLines.toLocaleString()}줄`} bg={C.orange} size={32} />
          <Chip x={1360} y={900} at={308} text="1,800프레임" bg={C.cream} size={32} />
        </AbsoluteFill>
      )}
      <StepHeader n={7} title="코드로 그리는 모션" time="22:44 – 23:06" />
    </AbsoluteFill>
  );
};

/* ───────── M9 STEP 08 검수와 수정 (2000–2240) ───────── */
const GANTT = [
  {t: '소재 확인', s: '22:23', e: '22:28'},
  {t: '사진 생성', s: '22:28', e: '22:48'},
  {t: '누끼', s: '22:32', e: '22:33'},
  {t: '음악 (병렬)', s: '22:34', e: '22:46'},
  {t: '영상 트래킹', s: '22:35', e: '22:38'},
  {t: '스타일', s: '22:40', e: '22:43'},
  {t: '장면 코딩', s: '22:44', e: '23:07'},
  {t: '검수·렌더', s: '23:07', e: '23:11'},
];
const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const M9Step8: React.FC = () => {
  const f = useF();
  const aOut = prog(f, 80, 8, E.inExpo);
  const lensX = lerp(prog(f, 34, 44, E.inOut), [0, 1], [380, 1540]);
  const lensY = 560 + Math.sin(f / 7) * 140;
  const photoFill = (src: string, pos?: string) => <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />;
  const bug = f < 116 ? 0 : f < 150 ? 1 : 2;
  const g0 = mins('22:23');
  const g1 = mins('23:11');
  const gp = prog(f, 186, 30, E.outQuart);
  return (
    <AbsoluteFill>
      <MakingBg />
      {/* a: 콘택트 시트 + 돋보기 */}
      {f < 88 && (
        <AbsoluteFill style={{opacity: 1 - aOut}}>
          <div style={{position: 'absolute', left: 240, top: 170, width: 1440, height: 810, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', opacity: prog(f, 28, 8)}}>
            <Img src={mk('img/draft_1.jpg')} style={{width: 1440, height: 810}} />
          </div>
          {f >= 34 && (
            <div style={{position: 'absolute', left: lensX - 170, top: lensY - 170, width: 340, height: 340, boxSizing: 'border-box', borderRadius: '50%', overflow: 'hidden', border: `10px solid ${C.orange}`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', background: '#000'}}>
              <Img src={mk('img/draft_1.jpg')} style={{position: 'absolute', width: 1440 * 2.6, height: 810 * 2.6, left: 160 - (lensX - 240) * 2.6, top: 160 - (lensY - 170) * 2.6, maxWidth: 'none'}} />
            </div>
          )}
          <Chip x={960} y={960} at={42} text="0.5초마다 한 장씩 뽑아 전부 눈으로 확인" bg={C.cream} size={32} />
        </AbsoluteFill>
      )}
      {/* b: 버그 수정 전후 */}
      {f >= 82 && f < 184 && (
        <AbsoluteFill style={{opacity: prog(f, 82, 6) * (1 - prog(f, 178, 6))}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: F.bhs, fontSize: 56, color: C.white}}>
            {bug === 0 ? '버그 1 · 시계 숫자 0이 잘려 C로 보임' : bug === 1 ? '버그 2 · 하트가 두 얼굴을 가림' : '버그 3 · 패널이 먼저 빠져 검은 화면'}
          </div>
          {bug === 0 && (
            <>
              {[0.66, 0.84].map((dw, i) => (
                <div key={i} style={{position: 'absolute', left: i ? 1060 : 260, top: 400, width: 600, height: 300, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `3px solid ${i ? M.mint : '#FF5A5F'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, transform: `scale(${spr(f, 86 + i * 10)})`}}>
                  <div style={{background: 'rgba(255,253,248,0.94)', borderRadius: 60, padding: '10px 34px'}}>
                    <Odometer value="07:00" changeAt={-100} digitWidth={`${dw}em`} style={{fontFamily: F.unb, fontWeight: 900, fontSize: 84, color: C.ink}} />
                  </div>
                  <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: i ? M.mint : '#FF8A8D'}}>{i ? 'AFTER · 칸 너비 0.84em' : 'BEFORE · 칸 너비 0.66em'}</div>
                </div>
              ))}
              <div style={{position: 'absolute', left: 960, top: 550, transform: 'translate(-50%,-50%)', fontFamily: F.archivo, fontSize: 80, color: C.orange, opacity: prog(f, 94, 6)}}>→</div>
            </>
          )}
          {bug === 1 && <BeforeAfter x={960} y={600} w={1100} h={619} at={116} slideAt={128} before={photoFill(mk('img/heart_before.jpg'), '50% 60%')} after={photoFill(mk('img/heart_after.jpg'))} />}
          {bug === 2 && <BeforeAfter x={960} y={600} w={1100} h={619} at={150} slideAt={160} before={photoFill(mk('img/panels_before.jpg'))} after={photoFill(mk('img/panels_after.jpg'))} />}
        </AbsoluteFill>
      )}
      {/* c: 48분 간트 + 렌더 */}
      {f >= 182 && (
        <AbsoluteFill style={{opacity: prog(f, 182, 6)}}>
          <div style={{position: 'absolute', left: 140, top: 190, fontFamily: F.bhs, fontSize: 60, color: C.white}}>
            48분의 기록 <span style={{fontFamily: F.mono, fontSize: 28, color: M.grey, marginLeft: 16}}>22:23 → 23:11</span>
          </div>
          {GANTT.map((g, i) => {
            const x0 = 470 + ((mins(g.s) - g0) / (g1 - g0)) * 1300;
            const w = Math.max(12, ((mins(g.e) - mins(g.s)) / (g1 - g0)) * 1300);
            const p = prog(f, 186 + i * 2, 16, E.outExpo);
            return (
              <React.Fragment key={i}>
                <div style={{position: 'absolute', left: 140, top: 300 + i * 62, width: 310, textAlign: 'right', fontFamily: F.pre, fontWeight: 800, fontSize: 28, color: C.cream, opacity: p}}>{g.t}</div>
                <div style={{position: 'absolute', left: x0, top: 300 + i * 62, width: w * p, height: 40, borderRadius: 8, background: i === 3 ? '#8E7CC3' : i === 6 ? C.orange : i === 7 ? M.mint : '#C9A27E'}} />
              </React.Fragment>
            );
          })}
          <div style={{position: 'absolute', left: 470 + 1300 * gp - 2, top: 290, width: 4, height: 500, background: 'rgba(255,255,255,0.5)'}} />
          <Chip x={720} y={850} at={206} text="1,800프레임 렌더 53초" bg={C.cream} size={30} />
          <Stamp x={1450} y={850} at={222} ok text="완성 23:11" />
        </AbsoluteFill>
      )}
      <Note x={1600} y={920} at={52} rot={3} w={430} lines={['고친 버그는', '전부 기록']} out={80} />
      <StepHeader n={8} title="검수와 수정" time="23:07 – 23:11" />
    </AbsoluteFill>
  );
};

void Card;
void KText;
