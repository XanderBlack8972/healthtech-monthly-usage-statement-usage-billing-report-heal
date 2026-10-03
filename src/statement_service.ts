import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { InfraiClient, InfraiError } from "./infrai_client.js";
import { buildStatementContent, monthlyStatementSchema } from "./statement_policy.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const infrai = new InfraiClient(apiKey);
const port = Number(process.env.PORT ?? 3000);

function reply(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Buffer | string>): Promise<unknown> {
  let raw = "";
  for await (const chunk of request) raw += chunk.toString();
  return JSON.parse(raw);
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/statements/monthly") {
    reply(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const statement = monthlyStatementSchema.parse(await readJson(request));
    const content = buildStatementContent(statement);
    const statementKey = `${statement.customer.accountReference}:${statement.period}`;

    // A single INFRAI_API_KEY and base URL carry metering, PDF generation, and delivery.
    const usage = await infrai.accountUsage();
    const pdf = await infrai.generatePdf(content.markdown, `${statementKey}:pdf`);
    const email = await infrai.sendEmail(
      statement.customer.billingEmail,
      content.subject,
      content.emailHtml,
      `${statementKey}:email`,
    );

    reply(response, 201, {
      statement: { period: statement.period, accountReference: statement.customer.accountReference },
      usage,
      pdf,
      message_id: email.message_id,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      reply(response, 400, { error: "Invalid statement request", issues: error.issues });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      reply(response, status, { error: error.code, message: error.message });
      return;
    }
    reply(response, 500, { error: "Statement request could not be completed" });
  }
});

server.listen(port, () => {
  console.log(`Monthly statement service listening on http://localhost:${port}`);
});
