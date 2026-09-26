const sharp = require('sharp');
const path = require('path');

const SRC = __dirname;
const OUT = path.join(__dirname, '..', 'public', 'media', 'images');

const jobs = [
  // Hero — wide cinematic, true 4K
  { src: 'zW3UB4IK164.jpg', out: 'hero-halo-studio.jpg', w: 3840, h: 2160 },
  { src: 'fkXGSAwHEEI.jpg', out: 'hero-nomad-one.jpg', w: 3840, h: 2160 },
  { src: 'D9xbVoT6tVg.jpg', out: 'hero-beam-pro.jpg', w: 3840, h: 2160 },

  // Feature grid cards
  { src: 'v8hbG6o465Q.jpg', out: 'feature-halo-studio.jpg', w: 1600, h: 1200 },
  { src: 'E5_UeVZg-FA.jpg', out: 'feature-nomad-one.jpg', w: 1600, h: 1200 },
  { src: '0W7ETrtDhFk.jpg', out: 'feature-beam-pro.jpg', w: 1600, h: 1200 },
  { src: 'j4vnbUJWkwo.jpg', out: 'feature-nomad-air.jpg', w: 1600, h: 1200 },

  // Tech specs — clean product shot, square
  { src: '581yTDyi5C0.jpg', out: 'tech-internals.jpg', w: 1600, h: 1600 },

  // Gallery — portrait crops, thematically matched to hero/feature source
  { src: 'D9xbVoT6tVg.jpg', out: 'gallery-living-room.jpg', w: 1200, h: 1500 },
  { src: 'fkXGSAwHEEI.jpg', out: 'gallery-backyard.jpg', w: 1200, h: 1500 },
  { src: 'zW3UB4IK164.jpg', out: 'gallery-studio.jpg', w: 1200, h: 1500 },
  { src: 'E5_UeVZg-FA.jpg', out: 'gallery-bedroom.jpg', w: 1200, h: 1500 },
  { src: 'j4vnbUJWkwo.jpg', out: 'gallery-office.jpg', w: 1200, h: 1500 },
];

(async () => {
  for (const job of jobs) {
    const inputPath = path.join(SRC, job.src);
    const outputPath = path.join(OUT, job.out);
    await sharp(inputPath)
      .resize(job.w, job.h, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(outputPath);
    console.log('wrote', job.out, `${job.w}x${job.h}`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
