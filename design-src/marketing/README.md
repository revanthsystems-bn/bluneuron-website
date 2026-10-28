# Marketing artwork

Source artwork for campaigns. **Nothing here is served** — it is outside
`public/`, so it is not copied into `.open-next/assets/` and not uploaded.
`scripts/check-media.js` fails a build that puts anything like it back.

## `iriz-vs-budget.png`

The "Not all 500 lumens are the same" comparison poster. It is the DESIGN
REFERENCE for the `#compare` section that `components/ComparisonTable`
renders on the homepage and on /compare — the dark lit ground, the blue IRIZ
panel against the charcoal one, the icon rail, the bare use-case rail and the
ruled "Available on" lockup are all taken from it.

**Its LAYOUT was copied. Its CLAIMS were not.** Every value in the rendered
section comes from `COMPARISON` / `FULL_SPEC_SHEET` in `lib/iriz.js`, and in
five places the poster and the site disagree. The site wins each time:

| Poster says | Site says | What ships |
|---|---|---|
| `Auto Focus — Yes` | no focus row anywhere; the carton states 4-point auto **keystone** only | **row omitted** |
| `Supports 4K Decoding` | `Up to 8K (playback/decode only)` | the site's value |
| typical audio `10W — Thin Sound` | `1–3W, thin sound` | the site's value |
| `Screen Mirroring` use case | not confirmed by box, spec sheet or any manufacturer material | **omitted** — see the standing note at `USE_CASES` in `lib/iriz.js` |
| `Native 1080P Full HD` | `Native 1080P` | the site's value |

`Movies & Gaming` IS kept, and is sourced: `FAQS` answers "Can I connect a
game console or laptop?" with a plain yes on the strength of the HDMI input,
and "Your home cinema awaits" is the product tagline.

**Do not ship this file as a press or download asset** until those claims are
reconciled — publishing it would put the auto-focus and 4K lines back in front
of customers in a form the site deliberately does not state.

The poster also shows an Amazon logo. Amazon is withheld sitewide while
`AMAZON.live` is false (`lib/site-config.js`).
