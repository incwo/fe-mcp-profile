import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import * as z from "zod/v4";
import {
  CASE_ID,
  PROFILE_VERSION,
  TOOL_NAMES,
  TOOL_SCHEMAS,
} from "../src/profile.js";
import {
  INVOICE_RESOURCE_TEXT,
  INVOICE_RESOURCE_URI,
  ReferenceStore,
} from "../src/reference.js";
import { call, connectReference } from "../src/client.js";
import { ProfileError } from "../src/errors.js";

const demoPath = fileURLToPath(new URL("../bin/demo.js", import.meta.url));
const checkPath = fileURLToPath(new URL("../bin/check.js", import.meta.url));

test("three systems expose the same six MCP tools and complementary evidence", async () => {
  const connections = await Promise.all(
    ["pa", "erp", "accounting"].map((system) => connectReference(system)),
  );
  try {
    const results = [];
    for (const { client } of connections) {
      const listed = await client.listTools();
      assert.deepEqual(
        listed.tools.map((tool) => tool.name),
        TOOL_NAMES,
      );
      assert.match(
        listed.tools.find((tool) => tool.name === "fe_execute_action")
          .inputSchema.properties.approval_code.description,
        /non-authoritative/,
      );
      results.push(
        await call(client, "fe_get_invoice_case", { case_id: CASE_ID }),
      );
    }
    assert.equal(
      results[0].facts.find((fact) => fact.code === "purchase_order_ref").value,
      "",
    );
    assert.equal(
      results[1].facts.find((fact) => fact.code === "linked_order_ref").value,
      "PO-531",
    );
    assert.equal(
      results[2].facts.find((fact) => fact.code === "booking_status").value,
      "not_booked",
    );
    const evidence = results[0].evidence.find(
      (item) => item.ref === INVOICE_RESOURCE_URI,
    );
    const resource = await connections[0].client.readResource({
      uri: INVOICE_RESOURCE_URI,
    });
    assert.equal(resource.contents[0].text, INVOICE_RESOURCE_TEXT);
    assert.equal(
      createHash("sha256").update(resource.contents[0].text).digest("hex"),
      evidence.digest.value,
    );
    assert.equal(evidence.digest.alg, "sha256");
    assert.equal(results[0].profile_version, PROFILE_VERSION);
    assert.equal(results[0].invoice.issue_date, "2026-09-23T08:00:00Z");
    assert.equal(results[0].invoice.seller_id, "123456789");
  } finally {
    await Promise.all(connections.map((connection) => connection.close()));
  }
});

test("writes require server-side enablement and explicit approval", () => {
  const disabled = new ReferenceStore({ system: "erp" });
  const proposal = disabled.prepare({
    case_id: CASE_ID,
    type: "record_internal_note",
    note: "Review",
  });
  assert.throws(
    () =>
      disabled.execute({
        proposal_id: proposal.proposal_id,
        approval_code: "anything",
        idempotency_key: "one",
      }),
    { code: "write_disabled" },
  );
  assert.equal(disabled.get(CASE_ID).revision, 1);

  const enabled = new ReferenceStore({
    system: "erp",
    writesEnabled: true,
    approvalCode: "local-test-code",
  });
  const prepared = enabled.prepare({
    case_id: CASE_ID,
    type: "record_internal_note",
    note: "Review",
  });
  assert.throws(
    () =>
      enabled.execute({
        proposal_id: prepared.proposal_id,
        approval_code: "wrong",
        idempotency_key: "one",
      }),
    { code: "forbidden" },
  );
  const receipt = enabled.execute({
    proposal_id: prepared.proposal_id,
    approval_code: "local-test-code",
    idempotency_key: "one",
  });
  assert.equal(receipt.revision, 2);
  assert.deepEqual(
    enabled.execute({
      proposal_id: prepared.proposal_id,
      approval_code: "local-test-code",
      idempotency_key: "one",
    }),
    receipt,
  );
  assert.throws(
    () =>
      enabled.execute({
        proposal_id: prepared.proposal_id,
        approval_code: "wrong",
        idempotency_key: "one",
      }),
    { code: "forbidden" },
  );
  assert.equal(
    enabled.get(CASE_ID).facts.filter((fact) => fact.code === "internal_note")
      .length,
    1,
  );
  const second = enabled.prepare({
    case_id: CASE_ID,
    type: "record_internal_note",
    note: "Another",
  });
  assert.throws(
    () =>
      enabled.execute({
        proposal_id: second.proposal_id,
        approval_code: "local-test-code",
        idempotency_key: "one",
      }),
    { code: "idempotency_conflict" },
  );
});

test("stale proposals cannot write", () => {
  const store = new ReferenceStore({
    system: "erp",
    writesEnabled: true,
    approvalCode: "local-test-code",
  });
  const first = store.prepare({
    case_id: CASE_ID,
    type: "record_internal_note",
    note: "First",
  });
  const stale = store.prepare({
    case_id: CASE_ID,
    type: "record_internal_note",
    note: "Stale",
  });
  store.execute({
    proposal_id: first.proposal_id,
    approval_code: "local-test-code",
    idempotency_key: "first",
  });
  assert.throws(
    () =>
      store.execute({
        proposal_id: stale.proposal_id,
        approval_code: "local-test-code",
        idempotency_key: "second",
      }),
    { code: "stale_revision" },
  );
  assert.equal(
    store.get(CASE_ID).facts.filter((fact) => fact.code === "internal_note")
      .length,
    1,
  );
});

test("cursor pages are stable, scoped to their query, and reject tampering", () => {
  let now = Date.parse("2026-09-27T00:00:00Z");
  const store = new ReferenceStore({ system: "pa", now: () => now });
  const pages = [];
  let cursor;
  do {
    const page = store.find({ query: "FR-2026", limit: 1, cursor });
    pages.push(page);
    cursor = page.next_cursor;
  } while (cursor);
  assert.deepEqual(
    pages.map((page) => page.cases[0].case_id),
    [CASE_ID, "FR-2026-0043", "FR-2026-0044"],
  );
  assert.equal(pages[0].cases[0].state_domain, "pa");
  assert.deepEqual(
    store.find({ query: "FR-2026", limit: 1, cursor: pages[0].next_cursor }),
    pages[1],
  );
  assert.throws(
    () =>
      store.find({
        query: "FR-2026",
        limit: 1,
        cursor: `${pages[0].next_cursor}x`,
      }),
    { code: "invalid_input" },
  );
  assert.throws(
    () =>
      store.find({ query: "OTHER", limit: 1, cursor: pages[0].next_cursor }),
    { code: "invalid_input" },
  );
  assert.throws(
    () =>
      store.find({ query: "FR-2026", limit: 2, cursor: pages[0].next_cursor }),
    { code: "invalid_input" },
  );
  assert.equal(store.get("FR-2026-0043").invoice.number, "INV-2026-0043");
  z.object(TOOL_SCHEMAS.fe_get_invoice_case.output).parse(
    store.get("FR-2026-0043"),
  );
  now += 300_001;
  assert.throws(
    () =>
      store.find({ query: "FR-2026", limit: 1, cursor: pages[0].next_cursor }),
    { code: "invalid_input" },
  );
});

test("expired proposals return a stable error code without writing", () => {
  let now = Date.parse("2026-09-27T00:00:00Z");
  const store = new ReferenceStore({
    system: "erp",
    writesEnabled: true,
    approvalCode: "local-test-code",
    now: () => now,
  });
  const proposal = store.prepare({
    case_id: CASE_ID,
    type: "record_internal_note",
    note: "Review",
  });
  now += 300_001;
  assert.throws(
    () =>
      store.execute({
        proposal_id: proposal.proposal_id,
        approval_code: "local-test-code",
        idempotency_key: "expiring",
      }),
    { code: "expired" },
  );
  assert.equal(store.get(CASE_ID).revision, 1);
});

test("UTC timestamps and versioned rules are enforced by the profile", () => {
  const store = new ReferenceStore({ system: "pa" });
  const invoiceCase = store.get(CASE_ID);
  z.object(TOOL_SCHEMAS.fe_get_invoice_case.output).parse(invoiceCase);
  z.object(TOOL_SCHEMAS.fe_check_invoice.output).parse(store.check(CASE_ID));
  assert.ok(
    !z.object(TOOL_SCHEMAS.fe_get_invoice_case.output).safeParse({
      ...invoiceCase,
      facts: [{ ...invoiceCase.facts[0], observed_at: "24/09/2026" }],
    }).success,
  );
  assert.ok(
    !z.object(TOOL_SCHEMAS.fe_check_invoice.output).safeParse({
      ...store.check(CASE_ID),
      findings: [
        { ...store.check(CASE_ID).findings[0], rule_ref: "demo:unversioned" },
      ],
    }).success,
  );
  assert.equal(
    new ProfileError("not_found", "fr").code,
    new ProfileError("not_found", "es").code,
  );
});

test("MCP error codes remain stable across translated messages", async () => {
  const responses = [];
  for (const lang of ["fr", "en", "es"]) {
    const connection = await connectReference("pa", lang);
    try {
      responses.push(
        await connection.client.callTool({
          name: "fe_get_invoice_case",
          arguments: { case_id: "UNKNOWN-CASE" },
        }),
      );
    } finally {
      await connection.close();
    }
  }
  assert.ok(
    responses.every(
      (response) =>
        response.isError &&
        response._meta?.["fe-mcp/error"]?.code === "not_found",
    ),
  );
  assert.equal(
    new Set(responses.map((response) => response.content[0].text)).size,
    3,
  );
});

test("French, English and Spanish demo and conformance flows", () => {
  const labels = {
    fr: ["Démonstration FE-MCP", "Profil vérifié"],
    en: ["FE-MCP demo", "Read-only profile verified"],
    es: ["Demostración FE-MCP", "Perfil verificado"],
  };
  for (const [lang, [demoLabel, checkLabel]] of Object.entries(labels)) {
    const demo = execFileSync(process.execPath, [demoPath, "--lang", lang], {
      encoding: "utf8",
    });
    const check = execFileSync(process.execPath, [checkPath, "--lang", lang], {
      encoding: "utf8",
    });
    assert.match(demo, new RegExp(demoLabel));
    assert.match(check, new RegExp(checkLabel));
  }
});
