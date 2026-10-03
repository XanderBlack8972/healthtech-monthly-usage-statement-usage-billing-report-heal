import { z } from "zod";

const count = z.number().int().nonnegative();

export const monthlyStatementSchema = z.object({
  customer: z.object({
    organizationName: z.string().min(1).max(120),
    accountReference: z.string().min(1).max(80),
    billingEmail: z.string().email(),
  }),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  appointments: z.object({
    scheduled: count,
    completed: count,
    cancelled: count,
    noShow: count,
  }),
});

export type MonthlyStatement = z.infer<typeof monthlyStatementSchema>;

export type StatementContent = {
  subject: string;
  markdown: string;
  emailHtml: string;
};

export function buildStatementContent(input: MonthlyStatement): StatementContent {
  const { customer, period, appointments } = input;
  const totalOutcomes = appointments.completed + appointments.cancelled + appointments.noShow;
  const pending = Math.max(appointments.scheduled - totalOutcomes, 0);
  const rows = [
    ["Scheduled", appointments.scheduled],
    ["Completed", appointments.completed],
    ["Cancelled", appointments.cancelled],
    ["No-show", appointments.noShow],
    ["Pending", pending],
  ] as const;
  const table = rows.map(([label, value]) => `| ${label} | ${value} |`).join("\n");
  const subject = `${period} usage statement - ${customer.organizationName}`;
  const markdown = [
    `# Monthly usage statement`,
    `**Organization:** ${customer.organizationName}`,
    `**Account:** ${customer.accountReference}`,
    `**Period:** ${period}`,
    "",
    "| Appointment workflow | Count |",
    "| --- | ---: |",
    table,
    "",
    "This statement contains aggregate operational counts only.",
  ].join("\n");
  const emailHtml = [
    `<p>Your ${period} usage statement has been generated for filing.</p>`,
    `<p>Scheduled: <strong>${appointments.scheduled}</strong>; completed: <strong>${appointments.completed}</strong>; cancelled: <strong>${appointments.cancelled}</strong>; no-show: <strong>${appointments.noShow}</strong>; pending: <strong>${pending}</strong>.</p>`,
    "<p>The statement contains aggregate appointment workflow totals only.</p>",
  ].join("");

  return { subject, markdown, emailHtml };
}
