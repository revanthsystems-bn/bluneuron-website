# BluNeuron: IRIZ launch site

Marketing and pre-launch signup site for the BluNeuron IRIZ projector.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for scroll and reveal animation
- [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling

## Running locally

```bash
npm install
npm run dev
```

The dev server prints the local URL when it starts.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Environment

Copy `.env.example` to `.env.local` and fill in the value:

```
NEXT_PUBLIC_WEB3FORMS_KEY=
```

This key powers the "Notify Me" signup and the contact form, which submit
client-side to [Web3Forms](https://web3forms.com/). Without it the forms render
normally but refuse to submit and log a warning naming the variable, rather
than silently appearing to succeed.

`.env.local` is gitignored. `.env.example` holds variable names only — never a
real key.

## Project layout

```
app/         routes (App Router), global styles
components/  UI components
lib/         product data, pricing, launch flags, form submission
public/      images and video served as-is
```

Product copy, specs, and media paths live in `lib/iriz.js` — a single source of
truth imported everywhere, so a spec or price change is a one-line edit.

Two flags gate what the site shows:

- `COMMERCE_ENABLED` in `lib/launch.js` — pre-launch mode. While `false`, every
  purchase affordance renders the "Notify Me" signup instead.
- `SHOW_PENDING_SPECS` in `lib/iriz.js` — hides the spec cards whose values are
  not confirmed yet (dimensions and weight, box contents, warranty). Flip it to
  `true` once those are final.
