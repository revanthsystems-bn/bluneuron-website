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

## Boards with the old render baked in

Two shipped boards still contain the retired white unit, composited into the
artwork and not separable from it:

- `public/media/iriz/detail/09-screen-size.png` — bottom left
- `public/media/iriz/detail/08-keystone.png` — bottom left

They were left alone deliberately: re-rendering them means re-doing the
artwork, not swapping a layer. Fixing them needs new boards.
