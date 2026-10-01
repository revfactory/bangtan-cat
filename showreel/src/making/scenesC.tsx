import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Flash, Paw} from '../components/fx';
import {Sticker} from '../components/media';
import {KText} from '../components/text';
import {C, E, F, lerp, prog, spr} from '../lib/core';
import {useF} from '../lib/frame';
import {M, MakingBg} from './ui';

const SHOWREEL = staticFile('making/showreel.mp4');

/* ───────── M10 전환: 테이프 스톱 (2240–2320) ───────── */
export const M10Trans: React.FC = () => {
  const f = useF();
  // 화면 꺼짐(0~8) → 검정 → 문구 → 플래시
  const off1 = prog(f, 0, 5, E.inQuart);
  const off2 = prog(f, 5, 4, E.inQuart);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {f < 10 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 1920 * (1 - off2), height: Math.max(3, 1080 * (1 - off1)), background: C.white, opacity: 0.85}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6}}>
        <KText text="그리고," start={18} mode="fade" stagger={2} style={{fontFamily: F.pre, fontWeight: 600, fontSize: 64, color: C.cream}} />
        <KText text="완성된 영상" start={34} mode="rise" stagger={3} style={{fontFamily: F.bhs, fontSize: 150, color: C.orange}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: C.white, opacity: lerp(f, [70, 80], [0, 1], E.inQuart)}} />
    </AbsoluteFill>
  );
};

/* ───────── M11 완성본 하이라이트 (2320–2800) ───────── */
const CLIPS = [
  {from: 0, dur: 120, start: 120},
  {from: 120, dur: 120, start: 840},
  {from: 240, dur: 240, start: 1560},
];

export const M11Finale: React.FC = () => {
  const f = useF();
  const expand = prog(f, 0, 22, E.outExpo);
  const sc = lerp(expand, [0, 1], [0.78, 1]);
  const radius = lerp(expand, [0, 1], [22, 0]);
  return (
    <AbsoluteFill style={{background: M.bg}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${sc})`,
          borderRadius: radius,
          overflow: 'hidden',
          boxShadow: expand < 1 ? '0 40px 100px rgba(0,0,0,0.6)' : undefined,
        }}
      >
        {CLIPS.map((c, i) => (
          <Sequence key={i} from={2320 + c.from} durationInFrames={c.dur} layout="none">
            <AbsoluteFill>
              <OffthreadVideo src={SHOWREEL} muted startFrom={c.start} style={{width: '100%', height: '100%'}} />
            </AbsoluteFill>
          </Sequence>
        ))}
      </div>
      {expand < 1 && (
        <div style={{position: 'absolute', left: 960 - 1920 * sc * 0.5, top: 540 - 1080 * sc * 0.5 - 52, display: 'flex', alignItems: 'center', gap: 12, opacity: 1 - expand}}>
          <div style={{background: C.orange, color: C.ink, fontFamily: F.mono, fontWeight: 700, fontSize: 20, padding: '6px 14px', borderRadius: 8}}>FINAL CUT</div>
          <div style={{fontFamily: F.mono, fontSize: 22, color: C.cream}}>방탄_쇼릴_2026.mp4 · 1:00</div>
        </div>
      )}
      <Flash at={120} dur={4} max={0.35} />
      <Flash at={240} dur={4} max={0.35} />
    </AbsoluteFill>
  );
};

/* ───────── M12 크레딧 (2800–2960) ───────── */
const CREDITS = [
  ['주연', '방이 · 탄이'],
  ['원본 사진·영상', '방이·탄이네 집사'],
  ['기획 · 디자인 · 모션', 'Claude'],
  ['음악 · 효과음', 'Claude (코드로 합성)'],
  ['AI 사진', 'codex-image'],
  ['도구', 'Remotion · macOS Vision · numpy'],
  ['작업 시간', '22:23 → 23:11 · 48분'],
];

export const M12Credits: React.FC = () => {
  const f = useF();
  const out = prog(f, 140, 20, E.inQuart);
  const endCard = f >= 92;
  return (
    <AbsoluteFill>
      <MakingBg />
      <AbsoluteFill style={{opacity: 1 - out}}>
        {!endCard && (
          <AbsoluteFill style={{opacity: 1 - prog(f, 84, 8)}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: 16, color: C.orange, opacity: prog(f, 2, 8)}}>CREDITS</div>
            {CREDITS.map(([role, name], i) => {
              const at = 8 + i * 5;
              const p = prog(f, at, 14, E.outExpo);
              return (
                <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 240 + i * 92, display: 'flex', justifyContent: 'center', gap: 40, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
                  <div style={{width: 560, textAlign: 'right', fontFamily: F.pre, fontWeight: 600, fontSize: 36, color: M.grey}}>{role}</div>
                  <div style={{width: 680, textAlign: 'left', fontFamily: F.pre, fontWeight: 800, fontSize: 40, color: C.white}}>{name}</div>
                </div>
              );
            })}
          </AbsoluteFill>
        )}
        {endCard && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10}}>
            <div style={{transform: `scale(${spr(f, 94, {damping: 9, stiffness: 200})}) rotate(-10deg)`}}>
              <Paw size={120} color={C.orange} />
            </div>
            <KText text="방탄 쇼릴 메이킹 필름" start={96} mode="rise" stagger={1.5} style={{fontFamily: F.bhs, fontSize: 96, color: C.white}} />
            <KText text="끝까지 봐 주셔서 고마워요" start={106} mode="fade" stagger={1} style={{fontFamily: F.pen, fontSize: 72, color: C.orange}} />
          </AbsoluteFill>
        )}
        <Sticker name="g16_bangi_portrait" w={300} x={190} y={lerp(spr(f, 98, {damping: 12, stiffness: 120}), [0, 1], [1400, 900])} rot={8} />
        <Sticker name="g17_tani_portrait" w={330} x={1730} y={lerp(spr(f, 102, {damping: 12, stiffness: 120}), [0, 1], [1400, 900])} rot={-8} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
