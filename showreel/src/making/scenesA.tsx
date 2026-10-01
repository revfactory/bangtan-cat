import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Flash} from '../components/fx';
import {KText} from '../components/text';
import {C, E, F, img, lerp, prog, spr, sticker} from '../lib/core';
import {useF} from '../lib/frame';
import {Card, Chip, FilmStrip, Lane, M, MakingBg, mk, Note, Stamp, StepHeader, Terminal, Win} from './ui';

/* ───────── M0 콜드 오픈: 요청 입력 (0–160) ───────── */
export const M0Cold: React.FC = () => {
  const f = useF();
  const push = prog(f, 138, 22, E.inExpo);
  return (
    <AbsoluteFill style={{background: '#0B0A0E'}}>
      <AbsoluteFill style={{transform: `scale(${1 + push * 1.6})`, filter: push > 0 ? `blur(${push * 14}px)` : undefined, opacity: 1 - push * 0.6}}>
        <Win x={150} y={250} w={1620} h={540} title="claude — ~/Downloads/bangtan-cat" at={2}>
          <Terminal
            size={40}
            pad={40}
            lines={[
              {text: '우리집 고양이 방이(치즈태비)와 탄이(턱시도) 사진과 영상들로 귀여운 애니메이션 영상 만들어주세요.', at: 12, kind: 'cmd', cps: 1.7},
              {text: '…역동적인 한글버전 1분 모션그래픽 비디오를 만들어 보세요. 이력서용 쇼릴 처럼요. 전력을 다해요.', at: 60, cps: 1.9},
              {text: '', at: 104, kind: 'dim'},
              {text: '폴더에 있는 사진과 영상을 확인하겠습니다.', at: 106, kind: 'claude', cps: 2.4},
              {text: '  ⎿  사진 5장 · 영상 1개 (12초, 1080×1920)', at: 124, kind: 'dim', cps: 3},
            ]}
          />
        </Win>
        <div style={{position: 'absolute', right: 170, top: 814, fontFamily: F.mono, fontSize: 22, color: '#5E5968', letterSpacing: 3, opacity: lerp(f, [6, 14], [0, 1])}}>2026.10.01 · PM 10:23</div>
      </AbsoluteFill>
      <Flash at={158} dur={4} max={0.7} />
    </AbsoluteFill>
  );
};

/* ───────── M1 타이틀 (160–320) ───────── */
export const M1Title: React.FC = () => {
  const f = useF();
  const stripIn = prog(f, 0, 14, E.outExpo);
  const out = prog(f, 142, 16, E.inExpo);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <MakingBg />
      <AbsoluteFill style={{transform: `translateY(${-out * 1100}px)`}}>
        <div style={{transform: `translateX(${(1 - stripIn) * -1920}px)`}}>
          <FilmStrip y={34} speed={4} h={130} />
        </div>
        <div style={{transform: `translateX(${(1 - stripIn) * 1920}px)`}}>
          <FilmStrip y={856} speed={4} dir={-1} h={130} offset={600} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 270, display: 'flex', justifyContent: 'center'}}>
          <KText text="MAKING FILM" start={2} mode="fade" stagger={1} style={{fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 20, color: C.orange}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 320, display: 'flex', justifyContent: 'center'}}>
          <KText text="방탄 쇼릴은" start={6} mode="rise" stagger={2} style={{fontFamily: F.bhs, fontSize: 150, color: C.white}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 490, display: 'flex', justifyContent: 'center'}}>
          <KText text="이렇게 만들어졌다" start={14} mode="rise" stagger={2} style={{fontFamily: F.bhs, fontSize: 150, color: C.orange}} />
        </div>
        <Chip x={640} y={720} at={60} text="원본 사진 3장" icon="🖼" bg={C.cream} />
        <Chip x={960} y={720} at={80} text="영상 12초" icon="🎞" bg={C.cream} />
        <Chip x={1280} y={720} at={100} text="작업 48분" icon="⏱" bg={C.orange} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────── M2 STEP 01 소재 확인 (320–480) ───────── */
const FILES = [
  {name: 'Photo…18 001.jpeg', src: 'tani_p1', md5: '9002c3…', dup: false},
  {name: 'Photo…19 002.jpeg', src: 'both_p2', md5: '2b1662…', dup: false},
  {name: 'Photo…47 001.jpeg', src: 'tani_p1', md5: '9002c3…', dup: true},
  {name: 'Photo…48 002.jpeg', src: 'both_p2', md5: '2b1662…', dup: true},
  {name: 'Photo…49 003.jpeg', src: 'bangi_p3', md5: '723d20…', dup: false},
  {name: 'Video…25.mp4', src: 'video', md5: '12.0s · 세로', dup: false},
];

export const M2Step1: React.FC = () => {
  const f = useF();
  const dupAt = 80;
  const cross = prog(f, dupAt + 8, 10, E.outExpo);
  return (
    <AbsoluteFill>
      <MakingBg />
      <Win x={150} y={190} w={1120} h={700} title="bangtan-cat — 항목 6개" at={28} light>
        <div style={{position: 'absolute', inset: 0, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30}}>
          {FILES.map((d, i) => {
            const at = 32 + i * 3;
            if (f < at) return <div key={i} />;
            const s = spr(f, at, {damping: 11, stiffness: 220});
            const isDup = d.dup && f >= dupAt;
            return (
              <div key={i} style={{transform: `scale(${s})`, opacity: isDup ? 1 - cross * 0.7 : 1, position: 'relative'}}>
                <div style={{height: 196, borderRadius: 10, overflow: 'hidden', background: '#ddd', border: isDup ? '5px solid #FF5A5F' : '5px solid transparent', position: 'relative'}}>
                  {d.src === 'video' ? (
                    <div style={{width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <Img src={mk('vf/vf_07.png')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85}} />
                      <div style={{position: 'absolute', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>▶</div>
                    </div>
                  ) : (
                    <Img src={img(d.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  )}
                  {isDup && (
                    <div style={{position: 'absolute', right: 8, top: 8, background: '#FF5A5F', color: C.white, fontFamily: F.bhs, fontSize: 26, padding: '2px 12px', borderRadius: 8}}>중복</div>
                  )}
                </div>
                <div style={{fontFamily: F.pre, fontWeight: 700, fontSize: 21, color: '#3A3540', marginTop: 8, textAlign: 'center'}}>{d.name}</div>
                <div style={{fontFamily: F.mono, fontSize: 19, color: d.dup && f >= dupAt ? '#E5383B' : '#8C8494', textAlign: 'center', opacity: lerp(f, [52 + i * 3, 58 + i * 3], [0, 1])}}>md5 {d.md5}</div>
                {isDup && <div style={{position: 'absolute', left: -10, right: -10, top: 110, height: 6, background: '#FF5A5F', transform: `rotate(-14deg) scaleX(${cross})`}} />}
              </div>
            );
          })}
        </div>
      </Win>
      {/* 영상 미리보기 */}
      {f >= 56 && (
        <div style={{position: 'absolute', left: 1360, top: 200, width: 360, height: 640, borderRadius: 40, padding: 12, background: '#0A0A0D', boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.12)', transform: `scale(${spr(f, 56, {damping: 13})})`}}>
          <div style={{width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden'}}>
            <Sequence from={320 + 56} layout="none">
              <OffthreadVideo src={staticFile('video/kitten_full.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
          </div>
        </div>
      )}
      <Chip x={1540} y={160} at={66} text="12초 · 고양이는 작게" bg={C.cream} size={28} />
      <Chip x={680} y={950} at={dupAt + 14} text="중복 2장 제거 → 사진 3장 + 영상 1개" bg="#FF5A5F" fg={C.white} size={30} />
      <Note x={1600} y={930} at={112} rot={4} w={430} lines={['1분을 채우기엔', '부족하다. 더 만들자!']} />
      <StepHeader n={1} title="소재 확인" time="22:23" />
    </AbsoluteFill>
  );
};

/* ───────── M3 STEP 02 사진 더 만들기 (480–880) ───────── */
const LANES = [
  {name: 'g01_boop.png', secs: 71},
  {name: 'g02_yawn.png', secs: 71},
  {name: 'g03_breakfast.png', secs: 93},
  {name: 'g04_box.png', secs: 71},
  {name: 'g05_sunbeam.png', secs: 113},
];
const GEN = [
  'g01_boop', 'g02_yawn', 'g03_breakfast', 'g04_box', 'g05_sunbeam', 'g06_window', 'g07_feather', 'g08_groom', 'g09_laptop', 'g10_pounce', 'g11_basket', 'g12_tower',
  'g13_tv', 'g14_night_window', 'g16_bangi_portrait', 'g17_tani_portrait', 'g18_both_sofa', 'g19_tani_loaf', 'g20_bangi_bag', 'g21_tani_blanket', 'g22_noses', 'g23_rain', 'g24_bangi_cushion', 'g25_both_hug',
];

export const M3Step2: React.FC = () => {
  const f = useF();
  const aOut = prog(f, 146, 8, E.inExpo);
  const bOut = prog(f, 214, 8, E.inExpo);
  const cOut = prog(f, 330, 8, E.inExpo);
  const scan = prog(f, 118, 12, E.outQuart);
  return (
    <AbsoluteFill>
      <MakingBg />
      {/* a: 참조 → 첫 테스트 */}
      {f < 156 && (
        <AbsoluteFill style={{opacity: 1 - aOut, transform: `translateY(${-aOut * 60}px)`}}>
          <div style={{position: 'absolute', left: 120, top: 210, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: M.grey, letterSpacing: 3, opacity: lerp(f, [30, 36], [0, 1])}}>REFERENCE · 실제 사진</div>
          <Card src={staticFile('img/bangi_p3.jpg')} x={230} y={420} w={210} h={300} at={32} rot={-5} label="방이" />
          <Card src={staticFile('img/tani_p1.jpg')} x={330} y={600} w={210} h={280} at={36} rot={4} label="탄이" />
          <Card src={staticFile('img/both_p2.jpg')} x={240} y={800} w={210} h={280} at={40} rot={-3} label="둘이" />
          <Win x={500} y={250} w={880} h={420} title="codex exec — 이미지 생성" at={40}>
            <Terminal
              size={23}
              pad={26}
              lines={[
                {text: 'codex exec -i bangi_ref.jpg -i tani_ref.jpg -i both_ref.jpg \\', at: 46, kind: 'cmd', cps: 3},
                {text: '  "첨부 사진 속 털 무늬·얼굴을 그대로 유지한 채', at: 68, cps: 3, kind: 'out'},
                {text: '   장면: 아침 햇살 침대 위, 둘이 붙어 자는 모습"', at: 82, cps: 3, kind: 'out'},
                {text: `⠙ 생성 중… ${Math.min(72, Math.max(0, Math.round((f - 96) * 3.4)))}s`, at: 96, kind: 'dim'},
                {text: '✓ test_sleep.png  1536×1024  72s', at: 118, kind: 'ok', cps: 4},
              ]}
            />
          </Win>
          {f >= 118 && (
            <div style={{position: 'absolute', left: 1430, top: 280, width: 420, height: 280, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', clipPath: `inset(0 0 ${(1 - scan) * 100}% 0)`}}>
              <Img src={img('test_sleep')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          )}
          <Chip x={1640} y={620} at={126} text="✓ 치즈태비 줄무늬" bg={M.mint} size={26} />
          <Chip x={1640} y={690} at={132} text="✓ 턱시도 무늬" bg={M.mint} size={26} />
          <Chip x={1640} y={760} at={138} text="✓ 빨간 뜨개 나비넥타이" bg={M.mint} size={26} />
        </AbsoluteFill>
      )}
      {/* b: photoreal 원칙 */}
      {f >= 150 && f < 224 && (
        <AbsoluteFill style={{opacity: (1 - bOut) * prog(f, 150, 6), transform: `scale(${1 + bOut * 0.08})`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: F.bhs, fontSize: 64, color: C.white}}>
            photoreal 원칙 — <span style={{color: C.orange}}>“덜 완벽하게”</span>
          </div>
          <div style={{position: 'absolute', left: 780, top: 270, width: 360, height: 690, borderRadius: 48, padding: 12, background: '#0A0A0D', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.14)', transform: `scale(${spr(f, 152, {damping: 13})})`}}>
            <div style={{width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden'}}>
              <Img src={img('g12_tower')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          </div>
          <Chip x={470} y={380} at={160} text="광고 사진 ✗ → 폰 스냅 ✓" rot={-4} />
          <Chip x={440} y={540} at={166} text="그 자리의 자연광만" rot={3} />
          <Chip x={500} y={700} at={172} text="수평 1~2° 기울기" rot={-2} />
          <Chip x={1460} y={400} at={178} text="털 결 · 수염 자연스럽게" rot={4} />
          <Chip x={1490} y={560} at={184} text="발가락 개수까지 확인" rot={-3} />
          <Chip x={1450} y={720} at={190} text="글자 있는 소품 금지" rot={2} bg="#FF5A5F" fg={C.white} />
        </AbsoluteFill>
      )}
      {/* c: 5장 동시 생성 */}
      {f >= 218 && f < 340 && (
        <AbsoluteFill style={{opacity: (1 - cOut) * prog(f, 218, 6)}}>
          <div style={{position: 'absolute', left: 150, top: 200, display: 'flex', alignItems: 'center', gap: 24}}>
            <div style={{fontFamily: F.bhs, fontSize: 70, color: C.white}}>5장씩 동시에 생성</div>
            <div style={{background: C.orange, color: C.ink, fontFamily: F.unb, fontWeight: 900, fontSize: 44, padding: '2px 22px', borderRadius: 12, transform: `scale(${spr(f, 226)})`}}>×5</div>
          </div>
          {LANES.map((l, i) => (
            <Lane key={i} x={150} y={340 + i * 78} w={1060} at={226 + i * 2} dur={Math.round(l.secs * 0.5)} name={l.name} secs={l.secs} />
          ))}
          {/* 썸네일 그리드 */}
          <div style={{position: 'absolute', left: 1290, top: 300, width: 520, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
            {GEN.map((g, i) => {
              const at = i < 5 ? 226 + i * 2 + Math.round(LANES[i].secs * 0.5) : 290 + (i - 5) * 1.6;
              const failCell = g === 'g18_both_sofa';
              const show = f >= at;
              const s = show ? spr(f, at, {damping: 12, stiffness: 240}) : 0;
              return (
                <div key={g} style={{height: 84, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', position: 'relative'}}>
                  {show && (
                    <Img
                      src={img(g)}
                      style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, filter: failCell && f < 322 ? 'grayscale(1) brightness(0.3)' : undefined}}
                    />
                  )}
                  {failCell && show && f < 322 && <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5A5F', fontFamily: F.archivo, fontSize: 34}}>✗</div>}
                </div>
              );
            })}
          </div>
          {/* 실패 카드 */}
          {f >= 300 && (
            <div
              style={{
                position: 'absolute',
                left: 150,
                top: 760,
                width: 1060,
                padding: '18px 26px',
                borderRadius: 14,
                background: 'rgba(255,90,95,0.14)',
                border: '2px solid #FF5A5F',
                fontFamily: F.mono,
                fontSize: 23,
                color: '#FFB3B5',
                transform: `translateX(${f < 310 ? Math.sin(f * 2.4) * (310 - f) * 1.6 : 0}px)`,
              }}
            >
              <div>✗ g18_both_sofa.png — ERROR: Selected model is at capacity.</div>
              {f >= 318 && <div style={{color: M.mint, marginTop: 6}}>↻ 재시도 → ✓ g18_both_sofa.png 295s (22:48)</div>}
            </div>
          )}
        </AbsoluteFill>
      )}
      {/* d: 모자이크 */}
      {f >= 332 && (
        <AbsoluteFill>
          <div style={{position: 'absolute', left: 1920 / 2 - (6 * 300 + 5 * 12) / 2, top: 150, display: 'grid', gridTemplateColumns: 'repeat(6, 300px)', gap: 12}}>
            {GEN.map((g, i) => {
              const at = 334 + i * 1.2;
              const p = prog(f, at, 10, E.outBack);
              return (
                <div key={g} style={{height: 196, borderRadius: 10, overflow: 'hidden', transform: `perspective(900px) rotateY(${(1 - p) * 90}deg)`, opacity: f >= at ? 1 : 0, boxShadow: '0 10px 24px rgba(0,0,0,0.4)'}}>
                  <Img src={img(g)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </div>
              );
            })}
          </div>
          <AbsoluteFill style={{background: `rgba(10,9,13,${0.55 * prog(f, 362, 8)})`}} />
          {f >= 362 && (
            <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 20, transform: `scale(${spr(f, 362, {damping: 9, stiffness: 200})})`}}>
                <span style={{fontFamily: F.unb, fontWeight: 900, fontSize: 220, color: C.orange}}>25</span>
                <span style={{fontFamily: F.bhs, fontSize: 110, color: C.white}}>장 생성</span>
              </div>
            </AbsoluteFill>
          )}
          <Note x={1530} y={860} at={370} rot={-3} w={500} lines={['실제 사진을 참조로 넣으니', '털 무늬가 그대로!']} />
        </AbsoluteFill>
      )}
      <StepHeader n={2} title="사진 더 만들기" time="22:28 – 22:48" />
    </AbsoluteFill>
  );
};

/* ───────── M4 STEP 03 누끼 (880–1040) ───────── */
export const M4Step3: React.FC = () => {
  const f = useF();
  const panels = [
    {at: 32, label: '원본 사진', node: <Img src={staticFile('img/bangi_p3.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />, bg: '#000'},
    {
      at: 50,
      label: '피사체 분리',
      node: <Img src={staticFile('cut/bangi_p3.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />,
      bg: 'repeating-conic-gradient(#3A3642 0% 25%, #2A2730 0% 50%) 50% / 40px 40px',
    },
    {at: 68, label: '흰 테두리 스티커', node: <Img src={sticker('bangi_p3')} style={{width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.35))'}} />, bg: C.orange},
  ];
  return (
    <AbsoluteFill>
      <MakingBg />
      {panels.map((p, i) => {
        if (f < p.at) return null;
        const s = spr(f, p.at, {damping: 12, stiffness: 190});
        const x = 310 + i * 490;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - 210, top: 210, width: 420, height: 520, borderRadius: 18, overflow: 'hidden', background: p.bg, transform: `scale(${s})`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', padding: i === 0 ? 0 : 24}}>
              {p.node}
            </div>
            <div style={{position: 'absolute', left: x - 210, width: 420, top: 750, textAlign: 'center', fontFamily: F.bhs, fontSize: 44, color: C.white, opacity: prog(f, p.at + 4, 8)}}>{p.label}</div>
          </React.Fragment>
        );
      })}
      {[
        {x: 555, at: 46, t: 'macOS Vision'},
        {x: 1045, at: 64, t: '외곽선 18px'},
      ].map((a, i) =>
        f >= a.at ? (
          <div key={i} style={{position: 'absolute', left: a.x, top: 470, transform: `translate(-50%,-50%) scale(${spr(f, a.at)})`, textAlign: 'center'}}>
            <div style={{fontFamily: F.archivo, fontSize: 70, color: C.orange, lineHeight: 1}}>→</div>
            <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 18, color: C.cream, background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: 6}}>{a.t}</div>
          </div>
        ) : null,
      )}
      {/* 스티커 행렬 */}
      {['bangi_p3', 'both_p2', 'g11_basket', 'g16_bangi_portrait', 'g17_tani_portrait', 'g22_noses', 'tani_p1'].map((n, i) => {
        const at = 92 + i * 4;
        if (f < at) return null;
        const s = spr(f, at, {damping: 9, stiffness: 220});
        return (
          <Img
            key={n}
            src={sticker(n)}
            style={{position: 'absolute', left: 300 + i * 220, top: 920, height: 120, transform: `translate(-50%,-50%) scale(${s}) rotate(${(i % 2 ? 1 : -1) * 6}deg)`, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))'}}
          />
        );
      })}
      <Chip x={1720} y={920} at={122} text="스티커 7종" bg={C.orange} size={30} />
      <Note x={1710} y={460} at={110} rot={5} w={390} lines={['잘린 가장자리는', '화면 밖으로 숨긴다']} />
      <StepHeader n={3} title="누끼 따기" time="22:32" />
    </AbsoluteFill>
  );
};

void Stamp;
