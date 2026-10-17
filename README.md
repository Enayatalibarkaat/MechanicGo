# MechanicGo

Customer and mechanic-partner web app built with Next.js.

## Current features

- Six-digit email OTP sign-in and registration through Gmail SMTP; codes expire after five minutes, are limited to five verification attempts, and use an HTTP-only signed challenge cookie.
- 30-second resend cooldown in the browser's signed OTP challenge cookie.
- MongoDB-backed customer/mechanic profile persistence, age 18+ validation, and Terms & Conditions consent.
- Mechanic verification workflow: new mechanics start as `PENDING_VERIFICATION`; they cannot go online until an owner approves them.
- MongoDB-backed repair requests, booking history, saved vehicles, and mechanic duty/accept/start/complete workflows.
- Telegram-backed profile/booking alerts and private file uploads; the channel ID must point to the intended private channel and the bot must be an administrator allowed to post.
- Optional Gemini support assistant.

## Required Production environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for Production:

- `MONGODB_URI` — MongoDB Atlas connection string.
- `GMAIL_USER` — Gmail account that sends the OTP emails.
- `GMAIL_APP_PASSWORD` — Google App Password for the sender account, not the normal Gmail password.
- `OTP_SECRET` — a long, random server-only secret used to sign OTP challenges and login sessions.
- `TELEGRAM_BOT_TOKEN` — private bot token.
- `TELEGRAM_CHANNEL_ID` — the target chat ID for the private channel (commonly `-100…`); this is not the owner's personal Telegram ID.

Optional:
- `GEMINI_API_KEY` — enables AI support. Without it, the support endpoint returns a fallback response.
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash-lite`.

Production database/Gmail/Telegram credentials are intentionally not copied into Preview. For Preview end-to-end testing, configure a separate staging MongoDB database, Gmail sender/app password, private test Telegram bot/channel, and a separate OTP secret. After changing environment variables, create a fresh deployment. Never commit real environment values to GitHub or share them in screenshots.

## Security notes

- Database connection strings, Gmail App Password, Telegram bot token, and OTP signing secret should use Vercel's **Sensitive / Secret** visibility.
- Owner/admin dashboard endpoints and the old default username/password login are not included in this customer/mechanic app. The separate owner portal is a separate follow-up project.
- Mechanic approval, blocks, and terminations will be managed by that separate owner portal. Until then, new mechanic registrations remain pending and cannot go online.

## Integration boundaries

- Online payment processing is not implemented. The app must not report that a card/UPI payment was charged.
- Live GPS tracking, customer–mechanic chat, persisted reviews, phone support, dynamic prices, and ETAs are not implemented yet. The current screens disclose these limits rather than using fake confirmation data.
- Service prices, distance, ratings and live ETA should only be shown after they come from actual backend data.

## Local setup

```bash
npm install
npm run dev
```
