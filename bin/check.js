#!/usr/bin/env node
import * as z from "zod/v4";
import { createHash } from "node:crypto";
import { CASE_ID, TOOL_NAMES, TOOL_SCHEMAS } from "../src/profile.js";
import { call, connectCommand, connectReference } from "../src/client.js";
import { language, t } from "../src/i18n.js";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const lang = language(option("--lang", "fr"));
const caseId = option("--case-id", CASE_ID);
const separator = args.indexOf("--");
let connection;

try {
  connection =
    separator >= 0
      ? await connectCommand(args[separator + 1], args.slice(separator + 2))
      : await connectReference("pa", lang);
  const { client } = connection;
  const { tools } = await client.listTools();
  for (const name of TOOL_NAMES) {
    const tool = tools.find((item) => item.name === name);
    if (!tool) throw new Error(`${t(lang, "missing_tool")}: ${name}`);
    if (!tool.inputSchema || !tool.outputSchema)
      throw new Error(`${t(lang, "missing_schema")}: ${name}`);
  }
  const checks = [
    ["fe_find_invoices", { query: caseId }],
    ["fe_get_invoice_case", { case_id: caseId }],
    ["fe_check_invoice", { case_id: caseId }],
    ["fe_get_available_actions", { case_id: caseId }],
  ];
  let before;
  for (const [name, input] of checks) {
    const output = await call(client, name, input, lang);
    z.object(TOOL_SCHEMAS[name].output).parse(output);
    if (
      name === "fe_find_invoices" &&
      !output.cases.some((item) => item.case_id === caseId)
    )
      throw new Error(t(lang, "case_absent"));
    if (name === "fe_get_invoice_case") {
      if (output.case_id !== caseId) throw new Error(t(lang, "wrong_case"));
      before = output.revision;
      const verifiable = output.evidence.filter(
        (item) => item.digest_sha256 && item.ref.startsWith("fe-demo://"),
      );
      for (const item of verifiable) {
        const resource = await client.readResource({ uri: item.ref });
        const digest = createHash("sha256")
          .update(resource.contents[0].text)
          .digest("hex");
        if (digest !== item.digest_sha256)
          throw new Error(t(lang, "digest_mismatch"));
      }
    }
  }
  const after = await call(
    client,
    "fe_get_invoice_case",
    { case_id: caseId },
    lang,
  );
  if (after.revision !== before) throw new Error(t(lang, "changed_on_read"));
  const missing = await client.callTool({
    name: "fe_get_invoice_case",
    arguments: { case_id: "UNKNOWN-CASE" },
  });
  if (!missing.isError) throw new Error(t(lang, "unknown_succeeded"));
  console.log(`${t(lang, "check_ok")} · ${tools.length} tools · ${caseId}`);
} catch (error) {
  console.error(`${t(lang, "check_fail")}: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (connection) await connection.close();
}
