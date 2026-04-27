// Generates responsive image variants (480w, 800w, 1280w) in jpg + webp
// for the large hero / section images. Skips files that already exist
// at the same size, so re-runs are cheap.

import sharp from 'sharp';
import { readdir, mkdir, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'img');
const OUT = path.join(SRC, 'responsive');

// Source files we want responsive variants for. Keys are the source
// filename (jpg/png), values are the slug used in the output filename.
const TARGETS = {
  'HERO SECTION.jpg': 'hero-section',
  'WHY EVPAY.jpg':    'why-evpay',
  'COLLECTION.jpg':   'collection',
  'PAYOUT.jpg':       'payout',
  'CARD.jpg':         'card',
  'FAQ.jpg':          'faq',
  'hero.png':         'dashboard',
  'intro-video.jpg':  'intro-video',
};

const WIDTHS = [480, 800, 1280];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const made = [];

  for (const [file, slug] of Object.entries(TARGETS)) {
    const inPath = path.join(SRC, file);
    if (!(await exists(inPath))) {
      console.warn(`skip (missing source): ${file}`);
      continue;
    }
    const meta = await sharp(inPath).metadata();
    for (const w of WIDTHS) {
      if (meta.width && meta.width < w) continue; // never upscale
      const jpgOut = path.join(OUT, `${slug}-${w}.jpg`);
      const webpOut = path.join(OUT, `${slug}-${w}.webp`);

      if (!(await exists(jpgOut))) {
        await sharp(inPath).resize({ width: w, withoutEnlargement: true })
          .jpeg({ quality: 78, mozjpeg: true })
          .toFile(jpgOut);
        made.push(path.basename(jpgOut));
      }
      if (!(await exists(webpOut))) {
        await sharp(inPath).resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(webpOut);
        made.push(path.basename(webpOut));
      }
    }
  }

  console.log(`generated ${made.length} variants:`);
  for (const f of made) console.log('  ' + f);
}

main().catch(err => { console.error(err); process.exit(1); });
