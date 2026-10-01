// usage: node tools/stills.mjs <outdir> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'Showreel', puppeteerInstance: browser});
const list = frames.map(Number);
const N = 6;
for (let i = 0; i < list.length; i += N) {
  await Promise.all(
    list.slice(i, i + N).map((frame) =>
      renderStill({composition, serveUrl, frame, output: path.join(outDir, `f${String(frame).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser, scale: 0.5}),
    ),
  );
}
await browser.close({silent: true});
console.log('done', list.length);
