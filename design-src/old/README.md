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

## Boards with the old render baked in — WITHDRAWN, THEN PUT BACK

Two shipped boards contain the retired white unit, composited into the
artwork and not separable from it:

| File | Where it is used | Shows the old unit |
|---|---|---|
| `09-screen-size.png` | `MEDIA.detail.screenSize`. The "Screen size" gallery slide on /shop/iriz and the third tile of the "What You Get" board on the homepage. | bottom left |
| `08-keystone.png` | `MEDIA.detail.keystone`. The "Auto keystone" gallery slide and the fourth "What You Get" tile. | bottom left |

They were withdrawn to this folder because re-rendering them means re-doing
the artwork rather than swapping a layer. **They have since been restored, by
request, unchanged** — so neither file is here any more; both are back in
`public/media/iriz/detail/` and both are live.

**The reason they were pulled has not gone away.** Each still pictures a unit
with no black front panel, no lens bezel ring and no `bluneuron IRIZ`
wordmark — not the product the site sells, and not the product in the
photography beside them. That is what new artwork has to fix.

`09-screen-size.png` also disagrees with itself and with the carton on the
numbers it prints — see **Printed claims on 09-screen-size.png** below.

### If they are withdrawn again

Four places, and they must move together — this is the list that was used to
put them back, run in reverse:

1. `MEDIA.detail` in `lib/iriz.js` — the `screenSize` and `keystone` keys,
   pointing at `public/media/iriz/detail/`.
2. `GALLERY` in `lib/iriz.js` — the "Screen size" and "Auto keystone"
   entries. `plate` matches the artwork: `false` for a board that carries its
   own dark ground, as both of these do.
3. `HIGHLIGHT_BOARDS` in `lib/iriz.js` — both entries, with their real
   `width`/`height` (750x1065 and 750x967).
4. `components/Highlights.jsx` — the two `TILE` entries (the array is
   index-aligned with `HIGHLIGHT_BOARDS`), the grid at `lg:grid-cols-4` with
   no width cap, and `sizes` at `(min-width: 1024px) 25vw, ...`. At two
   boards it was `lg:grid-cols-2` inside `lg:max-w-[720px] lg:mx-auto` with
   `sizes` at `352px`.

The two `.img-field-*` gradients in `app/globals.css` travel with the files:
a field gradient is sampled from its own image's edge colours and means
nothing without the file it was measured from. Re-sample from any new
artwork — the method is documented on `.img-field-apps`. Those rules must be
referenced from a file under `./app` or `./components` or Tailwind
tree-shakes them; that is why `TILE` holds the class names rather than
`lib/iriz.js`.

## Printed claims on `09-screen-size.png`

Recorded here because the board is live again and these are claims a visitor
reads off the ARTWORK, not off alt text. **Nothing was changed to match** —
this is a record, not a reconciliation.

| What the board prints | What else says | Status |
|---|---|---|
| Minimum screen **35"** | `FULL_SPEC_SHEET` says `35" – 200"`; the **printed carton says `40 - 200.00 inches`** | board agrees with the site; both disagree with the box |
| Headline **"1.4–5 meters optimal projection distance"** | the board's OWN distance scale beneath it reads `0.9m, 1.5m, 2.5m, 5m`, and `FULL_SPEC_SHEET` says `0.9m – 5m` | the board contradicts itself |
| Throw ratio **1:1** | `FULL_SPEC_SHEET` > Throw Ratio | match |

The `75'` label on the third screen uses a single prime (feet) where the
other three use a double prime (inches). A typo in the artwork.
