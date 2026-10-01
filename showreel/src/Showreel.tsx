import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {PawMask} from './components/fx';
import {lerp, E} from './lib/core';
import {Scene, useF} from './lib/frame';
import {S1Intro} from './scenes/S1Intro';
import {S2Title} from './scenes/S2Title';
import {S3Kitten} from './scenes/S3Kitten';
import {S4Profiles} from './scenes/S4Profiles';
import {S5Day} from './scenes/S5Day';
import {S6StyleLab} from './scenes/S6StyleLab';
import {S7Outro} from './scenes/S7Outro';

const PawIris: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useF();
  const size = lerp(f, [-12, 0], [300, 9000], E.inExpo);
  if (f >= 0) return <>{children}</>;
  return <PawMask size={size}>{children}</PawMask>;
};

export const Showreel: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Scene start={0} end={120}>
        <S1Intro />
      </Scene>
      <Scene start={120} end={240} pre={12}>
        <PawIris>
          <S2Title />
        </PawIris>
      </Scene>
      <Scene start={240} end={480}>
        <S3Kitten />
      </Scene>
      <Scene start={480} end={840}>
        <S4Profiles />
      </Scene>
      <Scene start={840} end={1320}>
        <S5Day />
      </Scene>
      <Scene start={1320} end={1560}>
        <S6StyleLab />
      </Scene>
      <Scene start={1560} end={1800}>
        <S7Outro />
      </Scene>
      <Audio src={staticFile('audio/music.wav')} />
    </AbsoluteFill>
  );
};
