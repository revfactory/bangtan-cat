import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

const Offset = createContext(0);

/** 현재 장면 기준 로컬 프레임 (음수 가능: 프리롤) */
export const useF = () => useCurrentFrame() - useContext(Offset);

/** 전역 [start-pre, end+post) 구간에서만 렌더, 자식은 start 기준 로컬 프레임 */
export const Scene: React.FC<{start: number; end: number; pre?: number; post?: number; children: React.ReactNode; z?: number}> = ({
  start,
  end,
  pre = 0,
  post = 0,
  children,
  z,
}) => {
  const parent = useContext(Offset);
  const g = useCurrentFrame() - parent;
  if (g < start - pre || g >= end + post) return null;
  return (
    <Offset.Provider value={parent + start}>
      <AbsoluteFill style={{zIndex: z}}>{children}</AbsoluteFill>
    </Offset.Provider>
  );
};
