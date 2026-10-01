# MechanicGo

Premium roadside assistance & mechanic booking platform.

## App screens
- Login / Register / OTP
- Home & vehicle categories
- Nearby mechanics
- Booking summary & Indian ₹ pricing
- UPI / card / cash payment selection UI
- Booking confirmation
- Live mechanic tracking
- Realtime-style mechanic chat UI
- Reviews & ratings
- Service history
- Vehicle management
- Profile / edit profile / settings / logout
- Help & Support
- MechanicGo AI customer-support assistant

## AI Support
The server route `/api/assistant` uses the Gemini API. Default model:
`gemini-2.5-flash-lite`

Set these in Vercel Environment Variables:
`GEMINI_API_KEY`
`GEMINI_MODEL=gemini-2.5-flash-lite`

Do not commit the real API key.

## Current integrations still to connect
Firebase Phone OTP • Google Maps • MongoDB • Razorpay/UPI • realtime database/messaging • FCM • Firebase Storage • mechanic dashboard • admin dashboard.

## Local setup
```bash
npm install
npm run dev
```
