# Bluneuron — Official Website

A mobile-first, responsive marketing site for Bluneuron and the Mini Projector,
built from `Bluneuron — Official Website Flow & Content.docx` and the
`bluneuron-website.html` starter.

Static HTML, one shared stylesheet, one small vanilla-JS file. No build step,
no framework, no dependencies. Open `index.html` in a browser, or serve the
folder with any static server.

```
python -m http.server 8000      # then visit http://localhost:8000
```

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Homepage — hero + CTA, trust strip, product intro, roadmap teaser, brand-story teaser, social proof, newsletter |
| `mini-projector.html` | Product page — story-first flow, plain-language performance, collapsible specs, quality & testing, warranty promise, reviews |
| `the-bluneuron-line.html` | Roadmap teaser — four category directions, each with a working "Notify me" form |
| `why-bluneuron.html` | Brand story — origin, three pillars with proof points, sourcing & quality, service commitment, founder note |
| `support.html` | Warranty & service, FAQs (accordion), contact |

Navigation is capped at four items plus the primary CTA, per the content spec.

## File structure

```
bluneuron/
├── index.html
├── mini-projector.html
├── the-bluneuron-line.html
├── why-bluneuron.html
├── support.html
├── assets/
│   ├── css/styles.css      shared styles (dark starfield theme, mobile-first)
│   ├── js/main.js          nav, accordions, scroll reveal, form handling
│   ├── images/
│   │   ├── logo-wordmark-light.png   header + footer logo (blu + white "neuron")
│   │   ├── logo-wordmark-dark.png    same wordmark for light backgrounds
│   │   ├── logo-mark.png             "bn" circle mark
│   │   └── favicon-32/180/512.png    favicons derived from the mark
│   │   └── (drop real photo/video assets here too)
│   └── videos/             (empty — drop real video assets here)
├── logo/                   original supplied logo files (untrimmed)
├── Bluneuron — Official Website Flow & Content.docx
└── bluneuron-website.html  original starter (kept for reference)
```

## Swapping in real photography / video

Every media slot is a `<figure class="media …">` placeholder with a grey frame
and a descriptive label. Directly above each one is an HTML comment showing the
exact markup to drop in. The `media--wide` / `media--square` / `media--hero` /
`media--tall` modifier sets the aspect ratio, so layout stays stable through the
swap.

Replace the whole `<figure>` with either:

```html
<img src="assets/images/hero-lifestyle.jpg"
     alt="Bluneuron Mini Projector on movie night"
     class="media media--hero">
```

```html
<video class="media media--wide"
       poster="assets/images/hero-poster.jpg"
       autoplay muted loop playsinline>
  <source src="assets/videos/hero.mp4" type="video/mp4">
</video>
```

`.media` carries `object-fit: cover`, so an asset of any ratio fills the frame
cleanly. Keep the `alt` text meaningful.

## Forms

The newsletter and "Notify me" forms are front-end only — they validate the
email and show an inline confirmation, but send nothing. To make them live, set
each `<form>`'s `action`/`method` to a real endpoint (e.g. Mailchimp, Formspree,
or your own handler) in the page markup, or extend the submit handler in
`assets/js/main.js`.

## Placeholder content to confirm before launch

Per section 6 of the content doc, these are stand-in values, marked with a note
on-page where they appear:

- **Warranty length** — currently "2 years" (homepage trust strip, product page,
  support page, brand story).
- **Service-center model & claim process** — currently "WhatsApp or email, no
  store visit; 5–7 business days".
- **Contact channel & response time** — currently "WhatsApp, replies within
  24 hours" and `support@bluneuron.com`; the WhatsApp link points to a dummy
  number (`wa.me/910000000000`).
- **QC steps / certifications** — quality sections are written to be expanded
  once finalised.
- **The Bluneuron Line** — all four categories are teased at once; switch to a
  phased reveal by removing cards if that decision changes.
- **Reviews** — pre-launch placeholders; replace with verified buyer content
  post-launch.

## Design notes

- Theme: dark, immersive "starfield" aesthetic — deep space-blue ground
  (`#0A0D16`), a faint fixed starfield layer (`body::before`, slow drift, off
  under `prefers-reduced-motion`), and soft blue/violet glow washes.
- One accent hue: blue `#2F6BFF` / `#5B8BFF`, used for glows, focus, links and
  the primary CTA. High-contrast light text (`#F2F4FA`).
- Glass surfaces: translucent headers, cards, accordions and tables
  (`backdrop-filter: blur`) with hairline borders and blue hover glow.
- Type: Fraunces (display serif) + Manrope (UI/body), loaded from Google Fonts.
- Logo: `assets/images/logo-wordmark-light.png` in header and footer, sized via
  CSS (`.brand__logo`, 22–26px tall) with `width`/`height` attrs to avoid layout
  shift. Favicon uses the "bn" mark.
- Mobile-first CSS with `min-width` breakpoints at 480 / 560 / 640 / 860 / 920 / 1000 px.
- Accessible: skip link, keyboard-operable nav and accordions, `aria-expanded`
  state, visible focus rings that contrast on dark, `prefers-reduced-motion`
  respected.
