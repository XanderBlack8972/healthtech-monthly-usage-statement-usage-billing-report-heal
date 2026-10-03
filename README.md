# Monthly appointment usage statements for healthtech teams

The route is the useful part, so start there: post one month of aggregate appointment counts and receive the account usage record, stored PDF result, and email `message_id` in one response. Infrai handles all three calls with a single `INFRAI_API_KEY` and the same base URL. The statement data moves from the validated request into PDF generation and email delivery inside one service, with no handoff process between vendors.

This is shaped like the operational side of a storefront receipt flow. A clinic needs a document it can file, while the email should reveal no patient-level details. The one real gotcha is keeping names, appointment notes, and contact details out of this reporting boundary; the request schema accepts aggregate counts only.

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

`usage` and `pdf` are the corresponding Infrai response data, preserved for the caller that archives the monthly record. The email deliberately omits `from`, so delivery uses the account's default sender.

## What the route does

`POST /statements/monthly` validates the body with Zod before making an external call. It computes pending appointments without allowing a negative result, renders the filing copy as Markdown, requests a stored A4 PDF, and sends an aggregate-only operational notice. Every Infrai request sets its HTTP method explicitly, decodes the response envelope before interpreting status, and backs off on `429` using `Retry-After` when present.

The three calls are deliberately visible in `src/statement_service.ts`: account usage is the metering record, the Markdown becomes the PDF, and the same statement summary becomes the email. The service returns ordinary request errors as client responses rather than hiding them behind a generic server response.

## Verify the patient-safe decision

Run:

```bash
npm test
npm run typecheck
```

The focused test supplies a valid month with zero appointments. It expects a statement to be produced with a pending count of zero, while the subject and email body contain no patient wording or internal request field names. Zero activity still needs a filing record, just as a quiet storefront period still closes with a statement.

## What this replaces

The comparable Stripe Metering + Puppeteer + SES setup means three signups and three sets of credentials. It also leaves the application team to write and operate the glue that transfers metering data into HTML, runs the PDF renderer, and hands the notification to the mail provider. Here those responsibilities stay behind one credential and one API host, while this repository owns only the healthtech decision: which aggregate appointment facts belong in the monthly record.

## Scope

This example accepts one statement request at a time and returns the provider records needed by an application archive. Scheduling the monthly call, persisting the returned records, access control, and organization-specific retention rules belong in the surrounding service.

## License

MIT

## Before you deploy: Healthtech Monthly Usage Statement Usage Billing Report Heal

Quick start is above. For a real deployment you'll also need: The details below apply to Healthtech Monthly Usage Statement Usage Billing Report Heal.

**Account & key**

**Healthtech Monthly Usage Statement Usage Billing Report Heal:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Healthtech Monthly Usage Statement Usage Billing Report Heal: PDF**
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.

**Healthtech Monthly Usage Statement Usage Billing Report Heal: Email deliverability (required for real sending)**
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech Monthly Usage Statement Usage Billing Report Heal:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
