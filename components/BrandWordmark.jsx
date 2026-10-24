import Image from 'next/image';

/**
 * The BluNeuron wordmark — one component, three call sites.
 *
 * The masthead and the footer both print this mark, and before this they each
 * wrote their own `next/image` with their own copy of the intrinsic size. The
 * size is not decorative: 1715x327 is the asset's real pixel ratio, and an
 * <img> takes its aspect ratio from the width/height pair, so a wrong one
 * stretches the logo and is exactly what scripts/ui-audit.mjs flags as a
 * "stretched image". Declaring it in one file means the two surfaces cannot
 * disagree about it.
 *
 * NOT a client component, and it deliberately takes no `motion` props: the
 * masthead wraps its copy in the magnetic/hover anchor itself, and the footer
 * wants a plain mark. Keeping this a server component is what lets the footer
 * stay out of every page's JS bundle.
 *
 * `variant` picks the art, not a filter. The mark is white glyphs plus one
 * brand-blue word (rgb(2,109,254)); `invert()` turns that blue orange and
 * `brightness(0)` throws it away, so there are two files and the blue
 * survives. `ink` is the same art with only the white recoloured to #030303,
 * for the light-hero test — see components/Header.
 */
const SOURCES = {
  white: '/brand/wordmark-white.png',
  ink: '/brand/wordmark-ink.png',
};

export default function BrandWordmark({
  variant = 'white',
  className = '',
  // Defaulted rather than required: every rendering of this mark is the same
  // mark, so the alt text is the same sentence unless a caller is stacking two
  // copies and needs the second one out of the accessibility tree.
  alt = 'BluNeuron',
  priority = false,
  ...rest
}) {
  return (
    <Image
      src={SOURCES[variant]}
      alt={alt}
      width={1715}
      height={327}
      priority={priority}
      className={className}
      {...rest}
    />
  );
}
