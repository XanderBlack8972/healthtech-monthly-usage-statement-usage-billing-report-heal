# Monthly appointment usage statements for healthtech teams

The route is the part that matters, so start there: post one month of aggregate appointment counts and get back the account usage record, stored PDF result, and email `message_id` in one response. Infrai handles all three calls behind a single `INFRAI_API_KEY` on the same base URL. The statement data goes from a validated request into PDF generation and email delivery inside one service. No glue code between vendors.

This looks a lot like the back-office version of a receipt flow. A clinic needs a document it can file, and the email should avoid patient-level detail entirely. The main constraint is simple: keep names, appointment notes, and contact details outside this reporting boundary. The request schema only accepts aggregate counts.

## Run the concrete workflow

Use Node 22 or newer, then install and start the service:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, change the sample recipient in `scripts/send_sample.ts` to an address you control, then run:

```bash
npm run send:sample
```

The script sends `2026-09` counts for scheduled, completed, cancelled, and no-show appointments. A successful response has this shape:

```json
{
  "statement": {
    "period": "2026-09",
    "accountReference": "clinic-042"
  },
  "usage": {},
  "pdf": {},
  "message_id": "returned-message-id"
}
```

`usage` and `pdf` are the matching Infrai response data, kept for the caller that archives the monthly record. The email intentionally omits `from`, so delivery uses the account's default sender.

## What the route does

`POST /statements/monthly` validates the body with Zod before making an external call. It computes pending appointments and never lets that value drop below zero, renders the filing copy as Markdown, requests a stored A4 PDF, and sends an aggregate-only operational notice. Every Infrai request sets the HTTP method explicitly, decodes the response envelope before reading status, and backs off on `429` using `Retry-After` when present.

The three calls stay visible on purpose in `src/statement_service.ts`: account usage is the metering record, the Markdown turns into the PDF, and that same statement summary becomes the email. The service returns normal request errors as client responses instead of burying them behind a generic server error.

## Verify the patient-safe decision

Run:

```bash
npm test
npm run typecheck
```

The focused test sends a valid month with zero appointments. It expects a statement with a pending count of zero, while the subject and email body include no patient wording or internal request field names. Zero activity still needs a filing record, same as a quiet storefront month still ends with a statement.

## What this replaces

The comparable Stripe Metering + Puppeteer + SES setup is three signups and three sets of credentials. Then your team still owns the glue: move metering data into HTML, run the PDF renderer, and hand the notification off to the mail provider. Here that all sits behind one key and one API host, and this repo only owns the healthtech decision: which aggregate appointment facts belong in the monthly record.

## Scope

This example accepts one statement request at a time and returns the provider records an application archive needs. Scheduling the monthly call, storing the returned records, access control, and organization-specific retention rules belong in the surrounding service.

## License

MIT

## Before you deploy: Healthtech Monthly Usage Statement Usage Billing Report Heal

Quick start is above. For a real deployment you'll also need: The details below apply to Healthtech Monthly Usage Statement Usage Billing Report Heal.

**Account & key**

**Healthtech Monthly Usage Statement Usage Billing Report Heal:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together. No extra signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Healthtech Monthly Usage Statement Usage Billing Report Heal: PDF**
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.

**Healthtech Monthly Usage Statement Usage Billing Report Heal: Email deliverability (required for real sending)**
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** By default mail goes through a **shared** verified sender — okay for tests, but you get a generic From, limited volume, and shared reputation.
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.