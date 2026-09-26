const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'media', 'images');

// Each entry: file -> list of {left, top, width, height} regions to blur out (logo removal)
const REDACTIONS = {
  'hero-halo-studio.jpg': [{ left: 1730, top: 1155, width: 130, height: 60 }],
  'feature-nomad-one.jpg': [{ left: 1195, top: 950, width: 170, height: 130 }],
  'feature-beam-pro.jpg': [{ left: 1375, top: 1160, width: 130, height: 50 }],
  'tech-internals.jpg': [{ left: 740, top: 670, width: 260, height: 130 }],
  'gallery-office.jpg': [{ left: 640, top: 930, width: 160, height: 110 }],
  'gallery-studio.jpg': [{ left: 250, top: 655, width: 190, height: 60 }],
  'gallery-bedroom.jpg': [{ left: 850, top: 800, width: 160, height: 110 }],
};

(async () => {
  for (const [file, regions] of Object.entries(REDACTIONS)) {
    const filePath = path.join(DIR, file);
    const img = sharp(filePath);
    const meta = await img.metadata();

    const overlays = await Promise.all(
      regions.map(async (r) => {
        const buf = await sharp(filePath)
          .extract(r)
          .blur(25)
          .toBuffer();
        return { input: buf, left: r.left, top: r.top };
      })
    );

    await sharp(filePath)
      .composite(overlays)
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(filePath + '.tmp.jpg');

    require('fs').renameSync(filePath + '.tmp.jpg', filePath);
    console.log('redacted', file, `(${meta.width}x${meta.height})`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
