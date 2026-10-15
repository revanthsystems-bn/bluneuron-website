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

Copy `.env.example` to `.env.local` and fill in the values for the integrations
you use:

```
NEXT_PUBLIC_WEB3FORMS_KEY=
GOOGLE_APPS_SCRIPT_URL=
GOOGLE_APPS_SCRIPT_TOKEN=
NEXT_PUBLIC_META_PIXEL_ID=
```

`NEXT_PUBLIC_WEB3FORMS_KEY` powers launch-list signups, support claims, contact
messages and checkout reservation emails through [Web3Forms](https://web3forms.com/).
Warranty registrations are sent through the server-side
`/api/warranty-registration` route to a deployed Google Apps Script web app.
Set `GOOGLE_APPS_SCRIPT_URL` to the deployed web app URL ending in `/exec`, and
`GOOGLE_APPS_SCRIPT_TOKEN` to the token printed when you run `setup()` in
`Code.gs`. Keep both values server-only: do not add the `NEXT_PUBLIC_` prefix
to either. The form will show an error if the required integration is missing
or the sheet cannot save the registration.

For local development, restart `npm run dev` after changing `.env.local`.
Production deployments must also have these variables configured in the
hosting provider's environment settings.

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
