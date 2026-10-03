import assert from "node:assert/strict";
import test from "node:test";
import { buildStatementContent, monthlyStatementSchema } from "../src/statement_policy.js";

test("a zero-activity month still produces a patient-safe filing statement", () => {
  const input = monthlyStatementSchema.parse({
    customer: {
      organizationName: "Northwind Family Clinic",
      accountReference: "clinic-042",
      billingEmail: "operations@example.com",
    },
    period: "2026-09",
    appointments: { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 },
  });

  const content = buildStatementContent(input);

  assert.match(content.subject, /2026-09 usage statement/);
  assert.match(content.markdown, /\| Pending \| 0 \|/);
  assert.match(content.emailHtml, /aggregate appointment workflow totals only/);
  assert.doesNotMatch(`${content.subject}${content.emailHtml}`, /patient|billingEmail|accountReference/i);
});
