import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { CASE_ID, TOOL_NAMES } from "../src/profile.js";
import {
  INVOICE_RESOURCE_TEXT,
  INVOICE_RESOURCE_URI,
  ReferenceStore,
} from "../src/reference.js";
import { call, connectReference } from "../src/client.js";

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
      evidence.digest_sha256,
    );
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
  assert.throws(() =>
    disabled.execute({
      proposal_id: proposal.proposal_id,
      approval_code: "anything",
      idempotency_key: "one",
    }),
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
  assert.throws(() =>
    enabled.execute({
      proposal_id: prepared.proposal_id,
      approval_code: "wrong",
      idempotency_key: "one",
    }),
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
  assert.throws(() =>
    enabled.execute({
      proposal_id: second.proposal_id,
      approval_code: "local-test-code",
      idempotency_key: "one",
    }),
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
  assert.throws(() =>
    store.execute({
      proposal_id: stale.proposal_id,
      approval_code: "local-test-code",
      idempotency_key: "second",
    }),
  );
  assert.equal(
    store.get(CASE_ID).facts.filter((fact) => fact.code === "internal_note")
      .length,
    1,
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
