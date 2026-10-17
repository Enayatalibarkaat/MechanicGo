# MechanicGo

Customer and mechanic-partner web app built with Next.js.

## Current features

- Email OTP sign-in and registration using Gmail SMTP; six-digit codes expire after five minutes, are limited to five verification attempts, and use a signed, HTTP-only cookie.
- MongoDB-backed customer/mechanic profile persistence, age 18+ validation, and Terms & Conditions consent.
- Mechanic verification workflow: mechanic registrations start as `PENDING_VERIFICATION`. A separate owner portal is being developed; pending mechanics cannot go online until an owner approves them.
- MongoDB-backed repair bookings, customer booking history, and mechanic availability/acceptance.
- Telegram-backed profile alerts, booking alerts, and private file uploads. A private channel must be configured and the bot must be allowed to post there.
- Optional AI support through Gemini.

## Required Vercel environment variables

Add these under **Vercel → Project → Settings → Environment Variables**. Set Production; also set Preview if you test preview deployments.

- `MONGODB_URI` — MongoDB Atlas connection string for the app database.
- `GMAIL_USER` — Gmail address that sends OTP emails.
- `GMAIL_APP_PASSWORD` — Google App Password for that Gmail account; do not use the normal Gmail login password.
- `OTP_SECRET` — long, random server-only secret used to sign OTP and session tokens.
- `TELEGRAM_BOT_TOKEN` — bot token from BotFather; keep it secret.
- `TELEGRAM_CHANNEL_ID` — private channel chat ID, typically in the `-100…` format. This is a channel ID, not a personal Telegram user ID. Add the bot as a channel administrator with permission to post.

Optional:
- `GEMINI_API_KEY` — enables AI support. Without it, the support endpoint returns a non-AI fallback response.
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash-lite`.

After changing environment variables, create a fresh deployment. Never commit real environment values to GitHub or share them in screenshots.

## Known integration boundaries

- The separate owner/admin portal is not part of this repository. Mechanic approvals, blocks, and terminations must wait for that portal to be created and deployed.
- This app does not currently provide payment processing, live GPS tracking, or real-time customer–mechanic chat. Screens must not imply that a payment was charged or a mechanic is live-tracked.
- Service prices, ETA, distance and ratings should come from real backend data before being presented as facts.

## Local setup

```bash
npm install
npm run dev
```
