import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const RES_DIR = path.resolve('android/app/src/main/res');

// We use the high-res 2000x2000 'raya coffe.png' or cropped 'raya-coffe-logo.png'
const logoBase64 = fs.existsSync('raya-coffe-logo.png')
  ? `data:image/png;base64,${fs.readFileSync('raya-coffe-logo.png').toString('base64')}`
  : `data:image/png;base64,${fs.readFileSync('raya coffe.png').toString('base64')}`;

const densities = [
  { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 }
];

const splashScreens = [
  { dir: 'drawable', file: 'splash.png', width: 480, height: 320 },
  { dir: 'drawable-land-mdpi', file: 'splash.png', width: 480, height: 320 },
  { dir: 'drawable-land-hdpi', file: 'splash.png', width: 800, height: 480 },
  { dir: 'drawable-land-xhdpi', file: 'splash.png', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', file: 'splash.png', width: 1600, height: 960 },
  { dir: 'drawable-land-xxxhdpi', file: 'splash.png', width: 1920, height: 1280 },
  { dir: 'drawable-port-mdpi', file: 'splash.png', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', file: 'splash.png', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', file: 'splash.png', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', file: 'splash.png', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', file: 'splash.png', width: 1280, height: 1920 }
];

async function generateIcons() {
  console.log('Launching browser to generate Android launcher icons & splash screens...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Generate Mipmap Icons
  for (const d of densities) {
    const targetDir = path.join(RES_DIR, d.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // A. ic_launcher.png (Squircle / Rounded Box on #073C64)
    await page.setViewport({ width: d.iconSize, height: d.iconSize, deviceScaleFactor: 1 });
    await page.setContent(`<!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:transparent; overflow:hidden;">
        <div style="
          width:${d.iconSize}px;
          height:${d.iconSize}px;
          border-radius:${Math.round(d.iconSize * 0.22)}px;
          background: linear-gradient(145deg, #094775 0%, #073C64 100%);
          display:flex;
          align-items:center;
          justify-content:center;
          box-sizing:border-box;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        ">
          <img src="${logoBase64}" style="
            width: ${Math.round(d.iconSize * 0.78)}px;
            height: ${Math.round(d.iconSize * 0.78)}px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          " />
        </div>
      </body>
      </html>`);
    await page.screenshot({
      path: path.join(targetDir, 'ic_launcher.png'),
      omitBackground: true
    });

    // B. ic_launcher_round.png (Circle on #073C64)
    await page.setContent(`<!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:transparent; overflow:hidden;">
        <div style="
          width:${d.iconSize}px;
          height:${d.iconSize}px;
          border-radius:50%;
          background: linear-gradient(145deg, #094775 0%, #073C64 100%);
          display:flex;
          align-items:center;
          justify-content:center;
          box-sizing:border-box;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        ">
          <img src="${logoBase64}" style="
            width: ${Math.round(d.iconSize * 0.72)}px;
            height: ${Math.round(d.iconSize * 0.72)}px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          " />
        </div>
      </body>
      </html>`);
    await page.screenshot({
      path: path.join(targetDir, 'ic_launcher_round.png'),
      omitBackground: true
    });

    // C. ic_launcher_foreground.png (Transparent background, centered emblem for Adaptive Icon)
    await page.setViewport({ width: d.fgSize, height: d.fgSize, deviceScaleFactor: 1 });
    await page.setContent(`<!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:transparent; overflow:hidden;">
        <div style="
          width:${d.fgSize}px;
          height:${d.fgSize}px;
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <img src="${logoBase64}" style="
            width: ${Math.round(d.fgSize * 0.60)}px;
            height: ${Math.round(d.fgSize * 0.60)}px;
            object-fit: contain;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
          " />
        </div>
      </body>
      </html>`);
    await page.screenshot({
      path: path.join(targetDir, 'ic_launcher_foreground.png'),
      omitBackground: true
    });

    console.log(`✓ Generated icons for ${d.dir} (${d.iconSize}px & fg ${d.fgSize}px)`);
  }

  // 2. Generate Splash Screens
  for (const s of splashScreens) {
    const targetDir = path.join(RES_DIR, s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 1 });
    const logoMaxW = Math.min(Math.round(s.width * 0.45), 450);
    const logoMaxH = Math.min(Math.round(s.height * 0.35), 250);

    await page.setContent(`<!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:#073C64; overflow:hidden; font-family:sans-serif;">
        <div style="
          width:${s.width}px;
          height:${s.height}px;
          background: linear-gradient(135deg, #094775 0%, #073C64 50%, #04253F 100%);
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:16px;
        ">
          <img src="${logoBase64}" style="
            max-width: ${logoMaxW}px;
            max-height: ${logoMaxH}px;
            object-fit: contain;
            filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
          " />
          <div style="
            color: rgba(255,255,255,0.7);
            font-size: ${Math.max(Math.round(s.height * 0.025), 11)}px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
          ">POS & OPERATIONAL TABLET</div>
        </div>
      </body>
      </html>`);

    await page.screenshot({
      path: path.join(targetDir, s.file)
    });
    console.log(`✓ Generated splash screen for ${s.dir}/${s.file} (${s.width}x${s.height})`);
  }

  await browser.close();
  console.log('ALL ANDROID LAUNCHER ICONS AND SPLASH SCREENS GENERATED SUCCESSFULLY!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
