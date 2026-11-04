# HOW TO change things on bluneuron.com

This is the plain-English guide. Four jobs, numbered steps, copy and paste.

If you only read one thing, read this:

> **Nothing you do on your computer changes the website.**
> The website only changes when somebody runs the deploy command in step 5
> of each job. Until then you are just making a preview.

---

## Before you start (do this once per session)

Open **Git Bash** in the project folder, then paste these two lines:

```bash
export PATH="/c/Users/MEENA/AppData/Local/node22/node-v22.23.3-win-x64:$PATH"
set -a; . ./.env.production; set +a
```

**What they do**

1. The first line picks the newer Node (version 22). The deploy tool refuses
   to start on the older one and says
   `Wrangler requires at least Node.js v22.0.0`.
2. The second line loads the site's public settings. Without it the build
   stops and complains about `NEXT_PUBLIC_META_PIXEL_ID`.

You have to paste them again every time you open a new terminal window.

**Never edit `.env.local`.** It is a local file with blank values in it. The
second line above is what works around it.

---

## A. Change the hero image

The hero image is the big photo of the projector at the top of the home page.

1. Put the new photo somewhere you can find it. A JPEG or PNG. Ideally
   **1400 pixels wide or more**, product on a plain white background.

2. Run one command. Put the path to your photo in the quotes:

   ```bash
   npm run hero:image -- "C:/Users/MEENA/Desktop/new-projector-photo.jpg"
   ```

3. **Look at the picture it makes for you.** When it finishes it prints a
   line like:

   ```
   preview       screenshots\hero-image\preview.png
   ```

   Open that file. It shows the old hero on the left and the new one on the
   right, with a blue ring drawn where the lens glow will sit.

4. Check three things on that preview:
   - The product is not cut off at any edge.
   - The blue ring is **on the lens glass**. If it is not, go to A-ii below.
   - If it says *"the glow is OFF"*, that is fine — read A-ii.

5. Look at the real page:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> and look at the top of the page.
   Press `Ctrl+C` in the terminal when you are done.

6. Save it:

   ```bash
   git add -A
   git commit -m "New hero photo"
   ```

7. To put it on the live site, follow **E. Shipping it** at the bottom.

### A-i. What the command actually did

It made the four image files the page needs (two sizes, two formats), worked
out the exact pixel size, found the lens, and wrote all of that into one
file: **`lib/hero-image.js`**. That file has a big comment at the top saying
**WHERE TO CHANGE THE HERO IMAGE**. You do not normally open it. Nothing else
in the project needs editing.

### A-ii. If the lens glow is wrong or missing

The glow is the soft blue light on the lens. The command tries to find the
lens by itself. If it is not sure, **it leaves the glow off on purpose** — a
glow in the wrong place looks broken, no glow just looks plain.

- **Ring is in the wrong place, or there is no glow and you want one.**
  Open the preview, work out roughly where the lens is as a percentage —
  across first, then down — and run the command again with `--lens`:

  ```bash
  npm run hero:image -- "C:/path/to/photo.jpg" --lens 34.2%,46.5%
  ```

  `34.2%` means "34.2% of the way across from the left".
  `46.5%` means "46.5% of the way down from the top".

- **You do not want a glow at all:**

  ```bash
  npm run hero:image -- "C:/path/to/photo.jpg" --no-lens
  ```

### A-iii. The other options

| Option | What it does |
| --- | --- |
| `--add-iriz-wordmark` | Paints the `IRIZ` wordmark onto the front of the projector. **Only use this if the photo is missing it.** A real photo of a unit we sell already has it, and adding a second one looks wrong. |
| `--alt "…"` | Changes the description read out by screen readers. If you leave it off, the old description is kept. |
| `--dry-run` | Makes the preview but changes nothing. Good for a quick look first. |
| `--preview <file>` | Put the preview picture somewhere else. |

---

## B. Turn Amazon on

Right now the site says **nothing** about Amazon. Not a button, not a greyed-out
badge, not a sentence. It sells on Flipkart only.

### B-i. Check the listing is really public first

**Do this before touching any code.** Open an **incognito / private window**
and go to:

<https://www.amazon.in/dp/B0HPG9T21G>

- If you can see the product page while **logged out**, carry on.
- If you see "Page Not Found", **stop.** Do not switch it on. The Seller
  Central preview looks fine to you while showing nothing to customers.

### B-ii. The switch

1. Open the file **`lib/site-config.js`**.

2. Search for `export const AMAZON`. It is around line 404. You will see:

   ```js
   export const AMAZON = {
     asin: 'B0HPG9T21G',
     url: 'https://www.amazon.in/dp/B0HPG9T21G',
     live: false,
   };
   ```

3. Change **one word**:

   ```js
     live: true,
   ```

   That is the whole change. Do not edit anything else, anywhere.

   *(If Amazon ever gives you a different listing, change `asin` and `url`
   together — the code after `/dp/` in the URL and the `asin` are the same
   thing and must match.)*

4. Check it worked:

   ```bash
   npm run test:amazon
   ```

   This flips the switch both ways by itself and checks about 30 things:
   the buy buttons, the Buy menu, `/shop`, `/shop/iriz`, `/where-to-buy`,
   `/compare`, the policy pages and the warranty form wording. It must say
   `PASSED`.

5. Look at the real pages:

   ```bash
   npm run dev
   ```

   Then in a **second** terminal (do the "Before you start" lines again):

   ```bash
   npm run test:amazon -- --rendered http://localhost:3000
   ```

   That one fetches all 19 public pages and checks the words on them.

   Look at <http://localhost:3000> and <http://localhost:3000/where-to-buy>
   with your own eyes too. You should see "Buy on Amazon" **first**, then
   "Buy on Flipkart", and sentences reading "Amazon and Flipkart".

6. Save it:

   ```bash
   git add -A
   git commit -m "Amazon listing is live"
   ```

7. Ship it with **E. Shipping it** below.

### B-iii. To turn Amazon off again

Set `live: false` back. Same four checks. Everything disappears again.

### B-iv. One thing that does NOT change

The warranty form at `/support/warranty-registration` has a dropdown asking
"Where you bought it". **Amazon is in that list whether the switch is on or
off, and that is on purpose.** It records where a customer *actually* bought
their unit. Somebody holding a real Amazon invoice must be able to say so,
even on a day when we are not advertising Amazon.

Everything a customer *reads* follows the switch. Only that one dropdown does
not.

---

## C. Change the phone number, the price, or the Flipkart link

All three live in the same file: **`lib/site-config.js`**. Each one is typed
exactly once, and every page reads it from there.

### C-i. The customer care phone number

1. Open `lib/site-config.js` and search for `CUSTOMER_CARE_PHONE`
   (around line 908).

2. Change the number between the quotes. Keep the spacing style:

   ```js
   const CUSTOMER_CARE_PHONE = '+91 91509 94099';
   ```

3. That is the only place. The footer, the support page, the warranty pages
   and the "call us" links all read it from here.

### C-ii. The price

1. Same file, search for `priceInr` (around line 571).

2. Change the number. **No commas, no rupee sign, no decimals** — just the
   digits:

   ```js
   priceInr: 13999,
   ```

3. This is the price the site *quotes*. Flipkart sets what the customer
   actually pays, and the site already says so in a line under the price.
   You do not need to change that line.

### C-iii. The Flipkart listing link

1. Same file, search for `flipkartUrl` (around line 580).

2. Replace the whole web address between the quotes:

   ```js
   flipkartUrl:
     'https://www.flipkart.com/bluneuron-iriz-500-lm-portable-projector/p/itmb78b8e3a32777?pid=PROHS4X3VCGFSGBC',
   ```

3. **Copy the address exactly as Flipkart gives it, including the `?pid=` bit
   at the end.** Do not tidy it up. Without the `pid=` part the link lands on
   a size/colour picker instead of our product; without the `itm…` part it is
   a dead page.

### C-iv. Check any of the three

```bash
npm run check:production
npm run dev
```

Open the pages and read the new value with your own eyes. Then commit and
follow **E. Shipping it**.

---

## D. If something breaks after going live

**Put the old version back first. Work out why afterwards.** Rolling back
takes about ten seconds and does not need a build.

1. See what is actually out there:

   ```bash
   npm run cf:deployments
   ```

   The **last block printed is the one serving the website right now.**

2. Go back to the version before it:

   ```bash
   npx wrangler rollback <the version id you want>
   ```

   It will ask you to confirm. Type `y`.

3. **The two ids you are most likely to need:**

   | Version id | What it is |
   | --- | --- |
   | `094f0de3-6ff3-46a7-9749-c5a14e138649` | The site as it has been since 31 Oct 2026 — Flipkart only, Google Ads tag on, phone number 91509 94099. **This is what to roll back to if anything shipped after it goes wrong.** |
   | `f4adc2df-69e0-412e-b80c-e25e4d386a63` | One step older: before the Google Ads tag, with the old 94000 phone number. Only use this if the Ads tag itself is the problem. |

   So the usual command is:

   ```bash
   npx wrangler rollback 094f0de3-6ff3-46a7-9749-c5a14e138649
   ```

4. Check the site is back:

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://www.bluneuron.com/
   ```

   Then open <https://www.bluneuron.com> and look.

5. **Rolling back does not change any files on your computer**, and it does
   not undo your commits. The code that caused the problem is still sitting
   in the repository waiting to be fixed. Fix it, preview it, ship it again.

### D-i. Things that are NOT fixed by a rollback

- **The warranty registration form rejecting "Authorised dealer / store" and
  "Other seller" with an error.** That is a Google Apps Script, not this
  website. Fix it at
  Apps Script → Deploy → Manage deployments → edit → Version: **New version**.
- **A problem with the Flipkart listing itself** — price, stock, delivery.
  That is Flipkart's side.

---

## E. Shipping it (every job ends here)

**Never run the last command without being told "approve live".**

1. Make sure you are on the deploy branch and it has your work:

   ```bash
   git status
   ```

2. Run the checks:

   ```bash
   npm run check:production
   npm run check:media
   npm run test:amazon
   ```

3. Build and upload a **preview**. This does **not** touch the live site:

   ```bash
   npm run preview:upload
   ```

   It prints a `https://…workers.dev` address. Open it. Click around.

4. Show that preview address to whoever decides. **Wait for them to say
   "approve live" in those words.**

5. Only then:

   ```bash
   npx wrangler versions deploy <the version id from step 3>@100
   ```

   Using `versions deploy` rather than `wrangler deploy` means the exact
   files you just looked at on the preview are the files that go live.
   `wrangler deploy` would build everything again, and nobody would have
   looked at *that* build.

6. Confirm:

   ```bash
   npm run cf:deployments
   curl -s -o /dev/null -w "%{http_code}\n" https://www.bluneuron.com/
   ```

---

## Quick reference

| I want to… | Command |
| --- | --- |
| Swap the hero photo | `npm run hero:image -- "path/to/photo.jpg"` |
| Check the Amazon switch | `npm run test:amazon` |
| Look at the site locally | `npm run dev` |
| Check before shipping | `npm run check:production` |
| Make a preview link | `npm run preview:upload` |
| See what is live | `npm run cf:deployments` |
| Undo a bad deploy | `npx wrangler rollback 094f0de3-6ff3-46a7-9749-c5a14e138649` |

| I want to change… | File | Search for |
| --- | --- | --- |
| The hero photo | *(use the command)* | `lib/hero-image.js` |
| Amazon on/off | `lib/site-config.js` | `export const AMAZON` |
| Phone number | `lib/site-config.js` | `CUSTOMER_CARE_PHONE` |
| Price | `lib/site-config.js` | `priceInr` |
| Flipkart link | `lib/site-config.js` | `flipkartUrl` |
