# design-src

Editable sources for things that would otherwise be un-editable baked artwork.

## Why this folder exists

Several product images on this site are **pictures of text** — a headline, a
spec figure and a caption burned into a PNG by whoever supplied the listing
artwork. When one of those figures turns out to be wrong (a 35" screen size
that contradicts the retail box, a Google TV screenshot we have no right to
publish), there is nothing to edit: the only fix is to open a design tool and
redraw it, which is why they stayed wrong.

Everything in `images/` is the HTML that generates one of those PNGs. Change
the markup, re-run the renderer, get a corrected image at the same size and in
the same style. The fix is a diff.

## Layout

```
design-src/
  tokens.css      the site's own colours, type and spacing, copied from
                  tailwind.config.js — NOT a second palette
  render.mjs      HTML -> PNG at 2x, via Playwright
  mocks/          proposed page designs, for review only; never shipped
  images/         sources for real assets in public/media/
```

## Rendering

```bash
# a mock, full height, 1x for review
node design-src/render.mjs design-src/mocks/support.html scratchpad/support.png 1440 full 1

# a replacement asset, fixed canvas, 2x, straight into public/
node design-src/render.mjs design-src/images/apps.html public/media/iriz/detail/11-apps-10000.png 507 776 2
```

The renderer serves the repo over a local HTTP server rather than opening
`file://`, because these documents reference real photographs up in
`public/media/` and Chromium will not load those cross-origin from a file URL.
It waits on `document.fonts.ready` and reports any 404 or page error, so a
missing photo fails loudly instead of rendering a hole.

## Rules

- **Only real photography.** Every product image must come from
  `public/media/`. Nothing here invents a render of the product.
- **Only claims the retail box makes.** 40"–200", 500 ANSI lumens, native
  1080p, Android 14, 1:1 throw, 4Ω 5W, AC 90–240V. If the box does not say it,
  it does not go in an image.
- **No third-party marks.** No Google TV, no Hey Google, no Netflix, Disney+,
  Prime Video, Spotify, YouTube or Play. An Android launcher drawn here uses
  generic tiles.
- **Match the original canvas.** A replacement keeps the file name, the pixel
  dimensions and the visual weight of what it replaces, so no layout
  downstream has to change.
- `tokens.css` is a copy. If it disagrees with `tailwind.config.js`, the
  config is right — re-copy rather than reconcile.
