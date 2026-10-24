import Image from 'next/image';

/**
 * A page opener with a picture behind it.
 *
 * WHY THIS EXISTS. Measured across the site at 390 and 1440: every page
 * except the homepage, /shop, /shop/iriz and /where-to-buy carried exactly
 * THREE images — the masthead wordmark and the two in the footer. /about,
 * /support, /support/faq and all five policy pages opened with a heading on
 * flat black and nothing else. They read as documents, not as pages of a
 * product site.
 *
 * `components/PageHeading` is unchanged and still correct for pages where a
 * picture would be noise (the policy pages keep it). This is for the pages
 * that should feel like part of the product.
 *
 * THE SCRIM IS NOT DECORATION. The photography here is a white studio render
 * or a bright video still, and the type over it is white. Two stacked
 * gradients — a horizontal one weighted to the text side, a vertical one
 * into the section below — are what hold the headline at AA over it. The
 * image itself is also dimmed with `opacity`, deliberately rather than with
 * a `filter`, so the browser composites one layer instead of rasterising a
 * darkened copy of a large source.
 *
 * `priority` because this is the largest element above the fold on every
 * page that uses it, and therefore the LCP candidate. Letting it lazy-load
 * would mean the page's biggest paint waits for a scroll handler it will
 * never receive.
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt = '',
  // Where the interesting part of the picture is. The product renders are
  // centred; the video stills put the unit slightly right of centre.
  imagePosition = '50% 50%',
  // Decorative by default: on most of these pages the picture restates the
  // headline and a screen reader gains nothing from a second description.
  // Pass `imageAlt` when the image is actually carrying information.
  children,
}) {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-black">
      {image && (
        <>
          <div className="absolute inset-0">
            <Image
              src={image}
              alt={imageAlt}
              aria-hidden={imageAlt ? undefined : 'true'}
              fill
              priority
              sizes="100vw"
              style={{ objectPosition: imagePosition }}
              className="object-cover opacity-[0.38]"
            />
          </div>

          {/* Horizontal: darkest under the copy, clearing toward the right so
              the picture is still legible beside it. Vertical: into the
              section below, so there is no seam. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.82)_44%,rgba(0,0,0,0.38)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0)_58%)]"
          />
        </>
      )}

      <div className="section-container relative py-16 sm:py-20 lg:py-24">
        {/* `.rise-in`, NOT <Reveal>. This block is above the fold on every
            page that uses this component, and Reveal is framer-motion with
            `initial={{opacity: 0}}` — which server-renders it invisible and
            waits for hydration. That made a page's largest paint depend on
            its JavaScript. See the note on `.rise-in` in app/globals.css. */}
        {eyebrow && <p className="eyebrow mb-3 rise-in">{eyebrow}</p>}
        <h1
          className="max-w-2xl text-4xl font-bold tracking-tighter text-white rise-in sm:text-5xl"
          style={{ '--rise-delay': '70ms' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-4 max-w-xl text-base leading-relaxed text-white/70 rise-in"
            style={{ '--rise-delay': '140ms' }}
          >
            {subtitle}
          </p>
        )}

        {children && (
          <div className="relative mt-8 rise-in" style={{ '--rise-delay': '210ms' }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
