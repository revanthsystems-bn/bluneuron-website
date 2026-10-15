# Media files referenced in the source that are not in `public/`

Eleven asset paths were named in `lib/iriz.js` with no file behind them. This
is the list, what each was for, and what happened to it.

## Were any of them actually broken on the live site?

**No.** Every one was referenced by data that no page rendered:

- `HIGHLIGHTS` carried six `image` keys, but `components/Highlights` draws
  `HIGHLIGHT_BOARDS` instead and has done since the bento board was replaced.
- `PRODUCT_SHOTS` was never imported — `components/ProductShowcase` renders
  `MEDIA.product.retailBox` directly.
- The three `reel-*.mp4` files were used only by `components/Showroom` and
  `components/VideoPlayer`, neither of which is imported by any page.

This was verified by loading all 16 routes in a real browser and recording
every failed image and media request: **zero**. (An earlier note in this
project claimed the homepage was serving broken images; that was inferred from
the data rather than from the render, and it was wrong.)

They still had to be dealt with. A path in `MEDIA` is an invitation to render
it, `next/image` pointed at a missing local file is **not** a build error, and
two of the three arrays holding them were being brought back into use. The
failure mode is a 404 at request time and a hole in a live page.

`scripts/check-media.js` now fails if any `/media/…` or `/brand/…` path in
`lib/`, `components/` or `app/` has no file in `public/`. It runs as part of
`npm run check:production`.

## The eleven files

| File | Was for | What was done |
|---|---|---|
| `product/turntable-360.png` | `PRODUCT_SHOTS` — "Stepless 0°–180° Stand" | Key removed from `MEDIA`; `PRODUCT_SHOTS` deleted |
| `product/angles-ports-clean.png` | `PRODUCT_SHOTS` — "Full I/O, Nothing Missing" | Key removed; array deleted |
| `product/angle-iso-plain.png` | `PRODUCT_SHOTS` — "Diamond-Cut Shell" | Key removed; array deleted |
| `detail/01-google-tv-hero.png` | unused | Key removed |
| `detail/03-apps.png` | `HIGHLIGHTS` — "10,000+ Official Apps" | Key removed; `HIGHLIGHTS` is now copy-only |
| `detail/04-google-assistant.png` | `HIGHLIGHTS` — "Built-in Google TV" | Key removed; `HIGHLIGHTS` is copy-only |
| `detail/05-lumens-compare.png` | `HIGHLIGHTS` — "True 500 ANSI Lumens" | Key removed; `HIGHLIGHTS` is copy-only |
| `detail/10-angle-adjust.png` | unused | Key removed |
| `video/reel-01.mp4` | `MEDIA.video.hero` | Now aliases `iriz-loop.mp4` |
| `video/reel-02.mp4` | `MEDIA.video.showcase` | Now aliases `iriz-loop.mp4` |
| `video/reel-03.mp4` | `MEDIA.video.ambient` | Now aliases `iriz-loop.mp4` |

### Why `HIGHLIGHTS` lost its images rather than borrowing others

The product page renders `HIGHLIGHTS` as text. Of the three missing images,
none has an honest substitute in `public/`: there is no Google TV photograph
and no lumens comparison, and illustrating "True 500 ANSI Lumens" with the
chipset board would be a caption that lies. Six entries where three have
pictures and three do not is worse than six that have none.

### Why the three videos alias one clip rather than being deleted

`components/VideoPlayer` says in its own header that it is kept for when real
footage exists. Keeping it while its sources 404 means re-enabling it ships a
broken `<video>`. All three keys now point at the real hero loop: switch the
component back on and it plays something — obviously a placeholder, not
broken.

## What to supply, if you want these back

Highest value first.

1. **Three product renders** — the stand at an angle, the rear ports, and the
   shell detail. These restore `PRODUCT_SHOTS` (recoverable intact from git
   history) and give the product-page gallery four more real shots. It
   currently has six, two of which are the same unit from the same angle.
2. **Three highlight boards** — Google TV, the apps grid, and the lumens
   comparison. These put pictures back on the product page's highlights.
3. **Three video reels**, if the footage exists. Otherwise leave the aliases:
   nothing renders them today.

Drop files into `public/media/iriz/{product,detail,video}/` under the original
names, add the keys back to `MEDIA`, and run `npm run check:media`.
