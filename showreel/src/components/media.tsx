import React, {CSSProperties} from 'react';
import {useF} from '../lib/frame';
import {AbsoluteFill, Img} from 'remotion';
import {C, F, img, sticker} from '../lib/core';

/** 꽉 채우는 사진 + 켄번스 */
export const Photo: React.FC<{
  name: string;
  scale?: number;
  x?: number; // px 이동
  y?: number;
  rot?: number;
  pos?: string; // object-position
  filter?: string;
  style?: CSSProperties;
  src?: string;
}> = ({name, scale = 1, x = 0, y = 0, rot = 0, pos = '50% 50%', filter, style, src}) => (
  <AbsoluteFill style={{overflow: 'hidden', ...style}}>
    <Img
      src={src ?? img(name)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: pos,
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`,
        filter,
      }}
    />
  </AbsoluteFill>
);

/** 누끼 스티커 */
export const Sticker: React.FC<{
  name: string;
  w: number;
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  shadow?: boolean;
  origin?: string;
  style?: CSSProperties;
  flip?: boolean;
}> = ({name, w, x, y, rot = 0, scale = 1, shadow = true, origin = '50% 100%', style, flip}) => (
  <Img
    src={sticker(name)}
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
      transformOrigin: origin,
      filter: shadow ? 'drop-shadow(0 18px 28px rgba(20,10,30,0.35))' : undefined,
      ...style,
    }}
  />
);

/** 폴라로이드/사진 카드 */
export const PhotoCard: React.FC<{
  name: string;
  w: number;
  h: number;
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  border?: number;
  bottom?: number;
  caption?: string;
  captionColor?: string;
  pos?: string;
  style?: CSSProperties;
  imgScale?: number;
  tape?: boolean;
  src?: string;
}> = ({name, w, h, x, y, rot = 0, scale = 1, border = 14, bottom, caption, captionColor = C.ink, pos = '50% 50%', style, imgScale = 1, tape, src}) => {
  const bb = bottom ?? border;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w + border * 2,
        height: h + border + bb,
        background: C.white,
        borderRadius: 6,
        boxShadow: '0 22px 50px rgba(15,8,25,0.35), 0 4px 10px rgba(15,8,25,0.2)',
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
        ...style,
      }}
    >
      <div style={{position: 'absolute', left: border, top: border, width: w, height: h, overflow: 'hidden', borderRadius: 2, background: '#ddd'}}>
        <Img src={src ?? img(name)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${imgScale})`}} />
      </div>
      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: bb * 0.18,
            textAlign: 'center',
            fontFamily: F.pen,
            fontSize: bb * 0.62,
            color: captionColor,
          }}
        >
          {caption}
        </div>
      ) : null}
      {tape ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -18,
            width: 150,
            height: 40,
            background: 'rgba(255,230,170,0.75)',
            transform: 'translateX(-50%) rotate(-3deg)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
      ) : null}
    </div>
  );
};

/** HUD 코너 브래킷 */
export const Brackets: React.FC<{x: number; y: number; w: number; h: number; len?: number; color?: string; width?: number; style?: CSSProperties}> = ({
  x,
  y,
  w,
  h,
  len = 34,
  color = C.white,
  width = 4,
  style,
}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}} width={1920} height={1080}>
    <g stroke={color} strokeWidth={width} fill="none" strokeLinecap="square">
      <path d={`M${x},${y + len} L${x},${y} L${x + len},${y}`} />
      <path d={`M${x + w - len},${y} L${x + w},${y} L${x + w},${y + len}`} />
      <path d={`M${x + w},${y + h - len} L${x + w},${y + h} L${x + w - len},${y + h}`} />
      <path d={`M${x + len},${y + h} L${x},${y + h} L${x},${y + h - len}`} />
    </g>
  </svg>
);

/** 흐르는 띠 (티커) */
export const Ticker: React.FC<{
  text: string;
  y: number;
  rot?: number;
  speed?: number;
  bg?: string;
  color?: string;
  size?: number;
  font?: string;
  h?: number;
  style?: CSSProperties;
  dir?: 1 | -1;
}> = ({text, y, rot = 0, speed = 6, bg = C.ink, color = C.cream, size = 44, font = F.bhs, h = 80, style, dir = 1}) => {
  const f = useF();
  const unit = `${text}  ✦  `;
  const rep = unit.repeat(14);
  const off = ((f * speed) % 2000) * dir;
  return (
    <div
      style={{
        position: 'absolute',
        left: -300,
        width: 2520,
        top: y,
        height: h,
        background: bg,
        transform: `rotate(${rot}deg)`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    >
      <div style={{whiteSpace: 'nowrap', fontFamily: font, fontSize: size, color, transform: `translateX(${-1000 - off}px)`, letterSpacing: 2}}>{rep}</div>
    </div>
  );
};
