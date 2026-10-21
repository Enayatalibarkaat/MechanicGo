# MechanicGo coupon integration (external issuer)

MechanicGo intentionally has **no coupon creation screen**. Your separate website can issue and manage codes through this server-to-server API. Customers claim codes in MechanicGo at `/coupons`, then apply a claimed code on the booking payment step.

## One-time setup

1. In Vercel, open the MechanicGo project settings and add the environment variable `COUPON_INTEGRATION_SECRET` with a long random secret.
2. Add the same secret only to your other website's **server-side** environment. Never put it in browser JavaScript or a `NEXT_PUBLIC_*` variable.
3. Redeploy MechanicGo after adding the environment variable.

Base URL: `https://mechanicg8.vercel.app/api/integrations/coupons`

Every request must be a server-to-server `POST` with JSON content type and header `Authorization: Bearer YOUR_SECRET`.

## Issue a coupon

```json
{
  "action": "issue",
  "code": "MG7K2P9X4B6Q",
  "amount": 250,
  "startsAt": "2026-10-21T00:00:00.000Z",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "externalReference": "campaign-2026-001"
}
```

- `code`: exactly 12 uppercase letters/numbers. Codes are unique.
- `amount`: the coupon value in INR, from ₹1 to ₹100,000.
- `startsAt` and `expiresAt`: optional ISO-8601 timestamps.
- `externalReference`: optional identifier from your other website.

## Disable a coupon immediately

```json
{ "action": "deactivate", "code": "MG7K2P9X4B6Q" }
```

A deactivated code cannot be newly claimed or applied, even if a customer previously claimed it. To re-enable it, use `{ "action": "activate", "code": "MG7K2P9X4B6Q" }`.

## Update an issued coupon

```json
{ "action": "update", "code": "MG7K2P9X4B6Q", "amount": 300, "expiresAt": "2026-12-31T23:59:59.000Z" }
```

Send `amount`, `expiresAt`, or both. To remove an expiry date, send `"expiresAt": null`.

## Customer flow

1. Customer enters the 12-character code in Coupons & Offers and claims it. One coupon can be claimed by only one account.
2. Customer applies their claimed code on the booking payment step. The API checks current status and current value.
3. When the booking is created, the coupon is atomically redeemed once and its code/value are stored on that booking. Reuse is blocked.
4. The issuer may deactivate the code at any time through the same integration API.

## Important payment note

MechanicGo currently stores the coupon's INR value with the booking, but does not charge online or calculate a final payable total because a live service-price quote/payment gateway is not configured in this app. The mechanic must confirm the service price; the coupon value is recorded for the booking workflow. Do not advertise it as a completed online payment.

## Response/error behavior

- `201`: coupon issued
- `200`: coupon updated/activated/deactivated
- `400`: invalid code, amount, date or action
- `401`: missing/incorrect integration secret
- `404`: code not found for update/deactivation
- `409`: duplicate code or coupon is unavailable for claim/redemption
- `410`: coupon is inactive or outside its validity window on customer claim

Keep the integration secret private and rotate it immediately if it is exposed.
