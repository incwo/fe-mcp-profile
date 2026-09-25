#!/usr/bin/env node
import { CASE_ID } from "../src/profile.js";
import { call, connectReference } from "../src/client.js";
import { language, t } from "../src/i18n.js";

const args = process.argv.slice(2);
const lang = language(args[args.indexOf("--lang") + 1]);
const json = args.includes("--json");
const connections = [];

try {
  for (const system of ["pa", "erp", "accounting"])
    connections.push({ system, ...(await connectReference(system, lang)) });
  const cases = await Promise.all(
    connections.map(async ({ system, client }) => ({
      system,
      case: await call(
        client,
        "fe_get_invoice_case",
        { case_id: CASE_ID },
        lang,
      ),
      check: await call(client, "fe_check_invoice", { case_id: CASE_ID }, lang),
      actions: await call(
        client,
        "fe_get_available_actions",
        { case_id: CASE_ID },
        lang,
      ),
    })),
  );
  const output = {
    case_id: CASE_ID,
    summary: t(lang, "demo_summary"),
    next_step: t(lang, "demo_next"),
    sources: cases.map((x) => ({
      system: x.system,
      facts: x.case.facts,
      findings: x.check.findings,
      actions: x.actions.actions,
    })),
  };
  if (json) console.log(JSON.stringify(output, null, 2));
  else {
    console.log(t(lang, "demo_title"));
    console.log(`${CASE_ID} · ${output.summary}`);
    for (const source of output.sources) {
      console.log(`\n${source.system.toUpperCase()}`);
      for (const finding of source.findings)
        console.log(
          `- ${finding.code}: ${finding.explanation} [${finding.evidence_refs.join(", ")}]`,
        );
    }
    console.log(`\n${output.next_step}`);
  }
} finally {
  await Promise.allSettled(connections.map((x) => x.close()));
}
