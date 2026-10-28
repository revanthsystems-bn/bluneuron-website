# Retired product imagery

Nothing in this folder is served. It is out of `public/`, so it is not copied
into `.open-next/assets/` and not uploaded — see `scripts/check-media.js`,
which now fails a build that puts anything like this back.

These files are kept rather than deleted because several of them are the
SOURCE for boards that still ship (`design-src/images/*.html` composite
`iriz-cutout.png`), and because the printed-carton photograph is still the
reference for what the box actually says.

## Why they were retired

The first four picture **a different unit from the one this site sells**: an
all-white chassis with no black front panel, no lens bezel ring, and no
`bluneuron IRIZ` wordmark anywhere on it. The current photography
(`public/media/iriz/product/`) shows the product as it ships.

| File | Was | Replaced by |
|---|---|---|
| `hero-clean.png` | 1600x1600 white-on-white render. Was `MEDIA.product.heroClean`; the Open Graph and JSON-LD image. | `iriz-og.jpg` |
| `iriz-cutout.png` | 1475x1038 transparent key of `hero-clean.png`, by `design-src/cutout.mjs`. Was `MEDIA.product.cutout` — the product image on every dark surface. | `iriz-product-shot.jpg` |
| `iriz-cutout.webp` | WebP twin of the above. Never referenced from source. | — |
| `retail-box.jpg` | 1333x801 photograph, unit beside the carton. Was `MEDIA.product.retailBox`. `lib/iriz.js` recorded that it **pictures the OLD carton — not the box that ships**. | `iriz-with-box.jpg` |
| `iriz-box-front.png` | 603x588 photograph of the printed carton, front and left faces. Was `MEDIA.product.boxFront`. | `iriz-with-box.jpg` |

## `iriz-box-front.png` is still the printed-spec reference

Keep this one. `lib/iriz.js` reads the model number (`BNA-510SH`), the
adapter's input range and the `BOX_CONTENTS` list **off this photograph**, and
its side panel carries the full printed table — resolution, brightness,
keystone, screen size, OS, processor, RAM/storage, BIS mark, contrast ratio,
Bluetooth, speaker, power input and the hardware interfaces.

The replacement photograph shows the carton's front and a shorter feature
list, so it is the better picture and the worse document. Check printed
claims against this file, not against `iriz-with-box.jpg`.

## Boards with the old render baked in — now withdrawn

Two shipped boards contained the retired white unit, composited into the
artwork and not separable from it. **Both have been removed from the site**
and now live here:

| File | Was | Showed the old unit |
|---|---|---|
| `09-screen-size.png` | `MEDIA.detail.screenSize`. The "Screen size" gallery slide on /shop/iriz and the third tile of the "What You Get" board on the homepage. | bottom left |
| `08-keystone.png` | `MEDIA.detail.keystone`. The "Auto keystone" gallery slide and the fourth "What You Get" tile. | bottom left |

Re-rendering them means re-doing the artwork, not swapping a layer, so they
were withdrawn rather than patched. New artwork is expected later.

### Putting them back

Four places, and they must move together:

1. `MEDIA.detail` in `lib/iriz.js` — restore the `screenSize` and `keystone`
   keys pointing at the new files in `public/media/iriz/detail/`.
2. `GALLERY` in `lib/iriz.js` — restore the "Screen size" and "Auto keystone"
   entries. Set `plate` to match the artwork: `false` for a board that
   carries its own dark ground, as these did.
3. `HIGHLIGHT_BOARDS` in `lib/iriz.js` — restore both entries with their real
   `width`/`height`.
4. `components/Highlights.jsx` — restore the two `TILE` entries (the array is
   index-aligned with `HIGHLIGHT_BOARDS`), put the grid back to
   `lg:grid-cols-4`, drop the `lg:max-w-[720px] lg:mx-auto` cap, and set
   `sizes` back to `(min-width: 1024px) 25vw, ...`.

Then re-sample the two `.img-field-*` gradients in `app/globals.css` from the
new artwork's own edge colours — the method is documented on
`.img-field-apps`. Those rules must be referenced from a file under `./app` or
`./components` or Tailwind tree-shakes them; that is why `TILE` holds the
class names rather than `lib/iriz.js`.
