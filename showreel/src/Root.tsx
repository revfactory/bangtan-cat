import React from 'react';
import {Composition} from 'remotion';
import {Showreel} from './Showreel';
import {Making} from './making/Making';
import {ensureFonts} from './lib/core';

ensureFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Showreel" component={Showreel} durationInFrames={1800} fps={30} width={1920} height={1080} />
    <Composition id="Making" component={Making} durationInFrames={2960} fps={30} width={1920} height={1080} />
  </>
);
