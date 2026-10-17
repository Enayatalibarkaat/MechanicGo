# MechanicGo

Premium roadside assistance and mechanic booking platform built with Next.js.

## Authentication: real email OTP

Login and registration use a six-digit code sent by Gmail SMTP. No mock or hard-coded OTP is accepted.

Add these environment variables in **Vercel → Project → Settings → Environment Variables** for Production and Preview:

- `GMAIL_USER` — the Gmail address that sends verification email.
- `GMAIL_APP_PASSWORD` — a Google App Password for that Gmail account (enable 2-Step Verification first; do not use your normal Gmail password).
- `OTP_SECRET` — a long, random secret used to sign OTP sessions and hash codes.

Redeploy after setting these variables. If any are missing, the send endpoint intentionally returns a configuration error instead of pretending an email was sent. Never commit these values to GitHub.

Email codes expire after five minutes, are limited to five verification attempts, and are validated server-side. Gmail SMTP uses TLS.

## App screens

- Login / Register / email OTP verification
- Home and vehicle categories
- Nearby mechanics
- Booking summary and Indian ₹ pricing
- UPI / card / cash payment selection UI
- Booking confirmation and mechanic tracking
- Mechanic chat, reviews, service history and vehicle management
- Profile / edit profile / settings / logout
- MechanicGo AI customer-support assistant

## Other integrations

The booking UI still needs production integrations for Google Maps, MongoDB/database persistence, Razorpay/UPI, realtime messaging, FCM, Firebase Storage, and mechanic/admin dashboards. Do not treat these UI screens as completed payment or dispatch integrations.

## AI Support

The server route `/api/assistant` uses the Gemini API. Set:

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash-lite`

Do not commit API keys.

## Local setup

```bash
npm install
npm run dev
```
