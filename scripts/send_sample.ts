async function main(): Promise<void> {
  const response = await fetch("http://localhost:3000/statements/monthly", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      customer: {
        organizationName: "Northwind Family Clinic",
        accountReference: "clinic-042",
        billingEmail: "chenhua@changba.com",
      },
      period: "2026-09",
      appointments: { scheduled: 184, completed: 151, cancelled: 21, noShow: 8 },
    }),
  });

  const result: unknown = await response.json();
  console.log(JSON.stringify(result, null, 2));
  if (!response.ok) process.exitCode = 1;
}

void main();
