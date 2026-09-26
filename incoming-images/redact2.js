const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'media', 'images');

// Panel-text logos (flat surface, safe to blur in place)
const BLUR_REDACTIONS = {
  'hero-halo-studio.jpg': [{ left: 1730, top: 1155, width: 130, height: 60 }],
  'feature-beam-pro.jpg': [{ left: 1395, top: 1155, width: 70, height: 30 }],
  'gallery-studio.jpg': [{ left: 270, top: 680, width: 85, height: 30 }],
};

// Lens-badge logos (sit against near-black bezel, inside a circular badge).
// center = text center point; rx/ry = ellipse radius that must stay clear of
// the badge's own circular edge (radial gradient fades to transparent, so no
// hard rectangle can spill onto the surrounding white panel).
const FILL_REDACTIONS = {
  'hero-nomad-one.jpg': { cx: 2134, cy: 942, rx: 48, ry: 20 },
  'feature-nomad-one.jpg': { cx: 1248, cy: 1018, rx: 46, ry: 28 },
  'feature-nomad-air.jpg': { cx: 1062, cy: 528, rx: 78, ry: 46 },
  'gallery-bedroom.jpg': { cx: 940, cy: 877, rx: 38, ry: 22 },
  'gallery-office.jpg': { cx: 713, cy: 981, rx: 32, ry: 18 },
};

async function blurRedact(filePath, regions) {
  const overlays = await Promise.all(
    regions.map(async (r) => ({
      input: await sharp(filePath).extract(r).blur(20).toBuffer(),
      left: r.left,
      top: r.top,
    }))
  );
  const buf = await sharp(filePath).composite(overlays).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, filePath);
}

async function fillRedact(filePath, r) {
  const w = r.rx * 2;
  const h = r.ry * 2;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="55%" stop-color="black" stop-opacity="1"/>
        <stop offset="100%" stop-color="black" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${r.rx}" cy="${r.ry}" rx="${r.rx}" ry="${r.ry}" fill="url(#g)"/>
  </svg>`;
  const fill = await sharp(Buffer.from(svg)).png().toBuffer();

  const buf = await sharp(filePath)
    .composite([{ input: fill, left: Math.round(r.cx - r.rx), top: Math.round(r.cy - r.ry) }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, filePath);
}

(async () => {
  for (const [file, regions] of Object.entries(BLUR_REDACTIONS)) {
    await blurRedact(path.join(OUT, file), regions);
    console.log('blur-redacted', file);
  }
  for (const [file, region] of Object.entries(FILL_REDACTIONS)) {
    await fillRedact(path.join(OUT, file), region);
    console.log('fill-redacted', file);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
