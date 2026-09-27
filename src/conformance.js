import * as z from "zod/v4";
import { createHash } from "node:crypto";
import {
  CASE_ID,
  PROFILE_VERSION,
  TOOL_NAMES,
  TOOL_SCHEMAS,
} from "./profile.js";
import { call } from "./client.js";
import { t } from "./i18n.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate(name, output, lang, system) {
  z.object(TOOL_SCHEMAS[name].output).parse(output);
  assert(
    output.profile_version === PROFILE_VERSION,
    `${name}: ${t(lang, "wrong_version")}`,
  );
  if (system)
    assert(output.system === system, `${name}: ${t(lang, "wrong_system")}`);
  return output.system;
}

export async function runChecks(
  client,
  { caseId = CASE_ID, lang = "fr" } = {},
) {
  const { tools } = await client.listTools();
  for (const name of TOOL_NAMES) {
    const tool = tools.find((item) => item.name === name);
    assert(tool, `${t(lang, "missing_tool")}: ${name}`);
    assert(
      tool.inputSchema && tool.outputSchema,
      `${t(lang, "missing_schema")}: ${name}`,
    );
  }

  let system;
  const search = await call(
    client,
    "fe_find_invoices",
    { query: caseId },
    lang,
  );
  system = validate("fe_find_invoices", search, lang, system);
  assert(
    search.cases.some((item) => item.case_id === caseId),
    t(lang, "case_absent"),
  );

  const invoiceCase = await call(
    client,
    "fe_get_invoice_case",
    { case_id: caseId },
    lang,
  );
  validate("fe_get_invoice_case", invoiceCase, lang, system);
  assert(invoiceCase.case_id === caseId, t(lang, "wrong_case"));
  const before = invoiceCase.revision;
  for (const item of invoiceCase.evidence) {
    if (!item.digest || !item.ref.startsWith("fe-demo://")) continue;
    const resource = await client.readResource({ uri: item.ref });
    const digest = createHash(item.digest.alg)
      .update(resource.contents[0].text)
      .digest("hex");
    assert(digest === item.digest.value, t(lang, "digest_mismatch"));
  }

  for (const name of ["fe_check_invoice", "fe_get_available_actions"]) {
    const output = await call(client, name, { case_id: caseId }, lang);
    validate(name, output, lang, system);
  }
  const after = await call(
    client,
    "fe_get_invoice_case",
    { case_id: caseId },
    lang,
  );
  assert(after.revision === before, t(lang, "changed_on_read"));

  const firstPage = await call(
    client,
    "fe_find_invoices",
    { query: "", limit: 1 },
    lang,
  );
  validate("fe_find_invoices", firstPage, lang, system);
  if (firstPage.next_cursor) {
    const secondPage = await call(
      client,
      "fe_find_invoices",
      {
        query: "",
        limit: 1,
        cursor: firstPage.next_cursor,
      },
      lang,
    );
    validate("fe_find_invoices", secondPage, lang, system);
    assert(secondPage.cases.length > 0, t(lang, "empty_next_page"));
    assert(
      !firstPage.cases.some((item) =>
        secondPage.cases.some((next) => next.case_id === item.case_id),
      ),
      t(lang, "duplicate_page"),
    );
  }
  const invalidCursor = await client.callTool({
    name: "fe_find_invoices",
    arguments: { query: "", limit: 1, cursor: "invalid-cursor" },
  });
  assert(
    invalidCursor.isError &&
      invalidCursor._meta?.["fe-mcp/error"]?.code === "invalid_input",
    t(lang, "invalid_cursor_succeeded"),
  );

  const missing = await client.callTool({
    name: "fe_get_invoice_case",
    arguments: { case_id: "UNKNOWN-CASE" },
  });
  assert(
    missing.isError && missing._meta?.["fe-mcp/error"]?.code === "not_found",
    t(lang, "unknown_succeeded"),
  );

  return {
    tools: tools.length,
    caseId,
    pagesChecked: firstPage.next_cursor ? 2 : 1,
  };
}
