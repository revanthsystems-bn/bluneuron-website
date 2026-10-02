import Image from 'next/image';
import Reveal from './Reveal';
import { MEDIA } from '@/lib/iriz';

/**
 * A still, in place of the video player that used to sit here.
 *
 * `components/VideoPlayer.jsx` is intact and unused: there is no real footage
 * of the IRIZ throwing an image yet, and its player was running `reel-02.mp4`
 * behind a big play button — a play affordance that promised content we do
 * not have. Swap VideoPlayer back into app/page.jsx when real footage exists.
 *
 * Deliberately no play button, no controls, no `group` hover chrome: nothing
 * here should read as clickable, because nothing happens if you click it.
 *
 * The heading changed with the media. "The IRIZ, on a real wall." described
 * footage of a projected image; this photograph is the unit on its stand
 * beside its retail box on a studio seamless, which is a different claim.
 * Naming what the picture actually shows is the only honest option — the old
 * title over this image would be a claim the page cannot support.
 */
export default function ProductShowcase() {
  const shot = MEDIA.product.retailBox;

  return (
    <section id="product-shot" className="border-b border-border-subtle bg-black-soft py-20 scroll-mt-20">
      <div className="section-container">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">In The Box</p>
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            The IRIZ, and the box it ships in.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto max-w-4xl">
          {/* `.product-photo-frame` rather than the `.product-fade` mask the
              renders use: this is a photograph with its own lit ground and a
              reflection, and masking its edges would dissolve the box corners
              and leave the unit floating. See app/globals.css. */}
          <div className="product-photo-frame relative aspect-[1333/801] w-full">
            <Image
              src={shot}
              alt="The BluNeuron IRIZ on its stand beside its retail box, which lists 1080p, 500 ANSI lumens, Android 14, auto keystone and up to a 200-inch screen"
              fill
              priority={false}
              sizes="(min-width: 1024px) 896px, 100vw"
              className="product-photo"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
