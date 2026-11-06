# Ye’ Jebena | የጀበና — Website

## Run it
Needs Node.js 22.5 or newer (nodejs.org). No other installs.

```
ADMIN_PASSWORD="choose-a-strong-password" npm start
```
Windows (PowerShell): `$env:ADMIN_PASSWORD="choose-a-strong-password"; npm start`

- Website: http://localhost:3000
- Review moderation: http://localhost:3000/admin  (username `admin`, your ADMIN_PASSWORD)

## Step 1 — Add your real business details
Open **`public/js/config.js`** and fill in (anything left empty is hidden, nothing is invented):
- `phone`, `whatsapp` (digits with country code, e.g. 2519…), `address`
- `mapsEmbedUrl` — Google Maps → Share → Embed a map → copy the `src="…"` link
- `googleReviewUrl` — Google Business Profile → "Get more reviews" → copy the link
- `hours` — your opening hours
- `social` — Instagram, Facebook, Telegram, WhatsApp links (TikTok is pre-filled from your photos' @ye.jebena)

## Step 2 — Add more photos
Put photos in `public/assets/photos/` named: `ceremony.jpg`, `roasting.jpg`, `snacks.jpg`, `seating.jpg`, `outdoor.jpg` (or edit the list in config.js). They appear in the gallery automatically. Use real photos of your shop.
To use a clean logo file, replace `public/assets/logo.png` (and `mark.png` for the small icon).

## Reviews & moderation
- Customers pick 1–5 stars, add name + optional feedback.
- New reviews wait for your approval at `/admin` (set `AUTO_APPROVE=true` to publish instantly).
- Moderate only for spam/abuse/personal data — never by star rating. Low and high ratings go through the identical path.
- The "Leave Us a Google Review" button is shown to everyone, always.
- Protection: validation, honeypot, form-timing token, link blocking, per-IP rate limit, duplicate detection, size limits, password-protected admin.

## Putting it online
Host the whole folder on any Node host (VPS, Render, Railway, Fly.io). Set `ADMIN_PASSWORD`, `TRUST_PROXY=true` (if behind a proxy), serve over HTTPS, and keep the `data/` folder on persistent storage (it holds the reviews database).
