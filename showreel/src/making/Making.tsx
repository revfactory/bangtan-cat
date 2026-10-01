import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, useF} from '../lib/frame';
import {M0Cold, M1Title, M2Step1, M3Step2, M4Step3} from './scenesA';
import {M5Step4, M6Step5, M7Step6, M8Step7, M9Step8} from './scenesB';
import {M10Trans, M11Finale, M12Credits} from './scenesC';
import {HUD, Overlay} from './ui';

const CLOCK: [number, string][] = [
  [320, '22:23'],
  [480, '22:28'],
  [880, '22:32'],
  [1040, '22:35'],
  [1280, '22:40'],
  [1440, '22:34'],
  [1680, '22:44'],
  [2000, '23:07'],
  [2222, '23:11'],
];
const STEPS = [320, 480, 880, 1040, 1280, 1440, 1680, 2000];

const MakingHUD: React.FC = () => {
  const f = useF();
  if (f < 320) return null;
  let i = 0;
  for (let k = 0; k < CLOCK.length; k++) if (f >= CLOCK[k][0]) i = k;
  let step = 1;
  for (let k = 0; k < STEPS.length; k++) if (f >= STEPS[k]) step = k + 1;
  return <HUD time={CLOCK[i][1]} prevTime={CLOCK[Math.max(0, i - 1)][1]} changeAt={CLOCK[i][0]} step={step} />;
};

export const Making: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Scene start={0} end={160}>
      <M0Cold />
    </Scene>
    <Scene start={160} end={320}>
      <M1Title />
    </Scene>
    <Scene start={320} end={480}>
      <M2Step1 />
    </Scene>
    <Scene start={480} end={880}>
      <M3Step2 />
    </Scene>
    <Scene start={880} end={1040}>
      <M4Step3 />
    </Scene>
    <Scene start={1040} end={1280}>
      <M5Step4 />
    </Scene>
    <Scene start={1280} end={1440}>
      <M6Step5 />
    </Scene>
    <Scene start={1440} end={1680}>
      <M7Step6 />
    </Scene>
    <Scene start={1680} end={2000}>
      <M8Step7 />
    </Scene>
    <Scene start={2000} end={2240}>
      <M9Step8 />
    </Scene>
    <Scene start={0} end={2240}>
      <MakingHUD />
    </Scene>
    <Scene start={2240} end={2320}>
      <M10Trans />
    </Scene>
    <Scene start={2320} end={2800}>
      <M11Finale />
    </Scene>
    <Scene start={2800} end={2960}>
      <M12Credits />
    </Scene>
    <Overlay />
  </AbsoluteFill>
);
