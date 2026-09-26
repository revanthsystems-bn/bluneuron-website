const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const OUT = path.join(__dirname, '..', 'public', 'media', 'images');

const REDACTIONS = {
  'hero-halo-studio.jpg': [{ left: 1730, top: 1155, width: 130, height: 60 }],
  'hero-nomad-one.jpg': [{ left: 2085, top: 920, width: 110, height: 45 }],
  'feature-nomad-one.jpg': [{ left: 1195, top: 985, width: 110, height: 70 }],
  'feature-beam-pro.jpg': [{ left: 1395, top: 1155, width: 70, height: 30 }],
  'feature-nomad-air.jpg': [{ left: 985, top: 510, width: 180, height: 70 }],
  'tech-internals.jpg': [{ left: 720, top: 834, width: 230, height: 105 }],
  'gallery-studio.jpg': [{ left: 270, top: 680, width: 85, height: 30 }],
  'gallery-bedroom.jpg': [{ left: 905, top: 855, width: 80, height: 35 }],
  'gallery-office.jpg': [{ left: 680, top: 965, width: 70, height: 30 }],
};

async function redact(filePath, regions) {
  const overlays = await Promise.all(
    regions.map(async (r) => ({
      input: await sharp(filePath).extract(r).blur(20).toBuffer(),
      left: r.left,
      top: r.top,
    }))
  );
  const buf = await sharp(filePath).composite(overlays).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, buf);
  fs.renameSync(tmpPath, filePath);
}

(async () => {
  // Rebuild tech-internals.jpg from a clean (logo-free-ish) rear/side angle
  // (coords are relative to the already-cropped hero-beam-pro.jpg output, not the raw source)
  await sharp(path.join(OUT, 'hero-beam-pro.jpg'))
    .extract({ left: 1730, top: 1250, width: 700, height: 700 })
    .resize(1600, 1600)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(OUT, 'tech-internals.jpg'));
  console.log('rebuilt tech-internals.jpg');

  // Rebuild feature-nomad-air.jpg centered on the actual device
  await sharp(path.join(SRC, 'j4vnbUJWkwo.jpg'))
    .extract({ left: 1290, top: 3420, width: 2800, height: 2100 })
    .resize(1600, 1200)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(OUT, 'feature-nomad-air.jpg'));
  console.log('rebuilt feature-nomad-air.jpg');

  for (const [file, regions] of Object.entries(REDACTIONS)) {
    const filePath = path.join(OUT, file);
    await redact(filePath, regions);
    console.log('redacted', file);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
