import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { CASE_ID, PROFILE_VERSION } from "./profile.js";
import { language, t } from "./i18n.js";
import { ProfileError } from "./errors.js";

const observedAt = "2026-09-24T09:00:00Z";
const invoice = Object.freeze({
  number: "INV-2026-0042",
  seller: "Atelier Marais",
  buyer: "Librairie Atlas",
  amount_due: 1200,
  currency: "EUR",
  issue_date: "2026-09-23T08:00:00Z",
  due_date: "2026-10-23T00:00:00Z",
  seller_id: { scheme: "siren", value: "123456789" },
  buyer_id: { scheme: "siren", value: "987654321" },
});
const invoices = new Map([
  [CASE_ID, invoice],
  [
    "FR-2026-0043",
    {
      ...invoice,
      number: "INV-2026-0043",
      amount_due: 850,
      issue_date: "2026-09-24T08:00:00Z",
      due_date: "2026-10-24T00:00:00Z",
    },
  ],
  [
    "FR-2026-0044",
    {
      ...invoice,
      number: "INV-2026-0044",
      amount_due: 340,
      issue_date: "2026-09-25T08:00:00Z",
      due_date: null,
    },
  ],
]);
export const INVOICE_RESOURCE_URI = "fe-demo://pa/invoice/INV-2026-0042";
export const INVOICE_RESOURCE_TEXT = JSON.stringify({
  synthetic: true,
  invoice,
  purchase_order_ref: null,
});
const invoiceDigest = createHash("sha256")
  .update(INVOICE_RESOURCE_TEXT)
  .digest("hex");

const base = (system) => ({
  profile_version: PROFILE_VERSION,
  system,
  system_role: system,
});
const fact = (code, value, source) => ({
  code,
  value,
  source,
  observed_at: observedAt,
});
const event = (
  code,
  at,
  source,
  evidence_ref,
  reason_code = null,
  reason_label = null,
) => ({
  code,
  at,
  source,
  evidence_ref,
  reason_code,
  reason_label,
});

export class ReferenceStore {
  constructor({
    system = "pa",
    lang = "fr",
    writesEnabled = false,
    approvalCode = "",
    now = () => Date.now(),
  } = {}) {
    if (!["pa", "erp", "accounting"].includes(system))
      throw new ProfileError("invalid_input", lang, "invalid_system");
    this.system = system;
    this.lang = language(lang);
    this.writesEnabled = writesEnabled;
    this.approvalCode = approvalCode;
    this.now = now;
    this.revisions = new Map([...invoices.keys()].map((id) => [id, 1]));
    this.notes = new Map([...invoices.keys()].map((id) => [id, []]));
    this.proposals = new Map();
    this.receipts = new Map();
    this.keys = new Map();
    this.cursorSecret = randomBytes(32);
  }

  requireCase(case_id) {
    if (!invoices.has(case_id)) throw new ProfileError("not_found", this.lang);
  }

  encodeCursor({ query, limit, offset, expires_at }) {
    const payload = Buffer.from(
      JSON.stringify({
        query,
        limit,
        offset,
        expires_at,
      }),
    ).toString("base64url");
    const signature = createHmac("sha256", this.cursorSecret)
      .update(payload)
      .digest("base64url");
    return `${payload}.${signature}`;
  }

  decodeCursor(cursor, query, limit) {
    try {
      const [payload, signature, extra] = cursor.split(".");
      if (!payload || !signature || extra) throw new Error();
      const expected = createHmac("sha256", this.cursorSecret)
        .update(payload)
        .digest();
      const actual = Buffer.from(signature, "base64url");
      if (
        expected.length !== actual.length ||
        !timingSafeEqual(expected, actual)
      )
        throw new Error();
      const data = JSON.parse(Buffer.from(payload, "base64url").toString());
      if (
        data.query !== query ||
        data.limit !== limit ||
        !Number.isInteger(data.offset) ||
        data.offset < 1 ||
        data.expires_at < this.now()
      )
        throw new Error();
      return { offset: data.offset, expires_at: data.expires_at };
    } catch {
      throw new ProfileError("invalid_input", this.lang);
    }
  }

  find({ query = "", limit = 20, cursor } = {}) {
    if (
      typeof query !== "string" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      throw new ProfileError("invalid_input", this.lang);
    const page = cursor
      ? this.decodeCursor(cursor, query, limit)
      : { offset: 0, expires_at: this.now() + 300_000 };
    const { offset } = page;
    const matches = [...invoices].filter(([id, item]) =>
      [id, item.number, item.seller, item.buyer].some((value) =>
        value.toLowerCase().includes(query.toLowerCase()),
      ),
    );
    const state_domain =
      this.system === "pa"
        ? "pa"
        : this.system === "erp"
          ? "commercial"
          : "accounting";
    return {
      ...base(this.system),
      cases: matches.slice(offset, offset + limit).map(([id, item]) => ({
        case_id: id,
        invoice_number: item.number,
        state_domain,
        current_state:
          this.system === "pa"
            ? id === CASE_ID
              ? "refused_by_buyer"
              : "deposited"
            : this.system === "erp"
              ? "issued"
              : "not_booked",
        current_state_std:
          this.system === "pa"
            ? id === CASE_ID
              ? "refusee"
              : "deposee"
            : this.system === "erp"
              ? "issued"
              : "not_booked",
      })),
      next_cursor:
        offset + limit < matches.length
          ? this.encodeCursor({
              query,
              limit,
              offset: offset + limit,
              expires_at: page.expires_at,
            })
          : null,
    };
  }

  get(case_id) {
    this.requireCase(case_id);
    const caseInvoice = invoices.get(case_id);
    const common = {
      ...base(this.system),
      case_id,
      transaction_type: "b2b_domestic",
      recipient_directory_status: this.system === "pa" ? "found" : null,
      recipient_pdp: this.system === "pa" ? "PA-DEMO-DEST" : null,
      routing_id:
        this.system === "pa" ? `ROUTE-DEMO-${case_id.slice(-4)}` : null,
      invoice: caseInvoice,
      revision: this.revisions.get(case_id),
    };
    if (case_id !== CASE_ID) {
      const sourceRef = `${this.system}:invoice:${caseInvoice.number}`;
      return {
        ...common,
        facts: [
          fact(
            "local_status",
            this.system === "pa"
              ? "deposited"
              : this.system === "erp"
                ? "issued"
                : "not_booked",
            sourceRef,
          ),
          ...this.notes
            .get(case_id)
            .map((note, i) =>
              fact("internal_note", note, `erp:note:${case_id}:${i + 1}`),
            ),
        ],
        events: [],
        evidence: [
          { ref: sourceRef, kind: "synthetic_invoice_record", digest: null },
        ],
      };
    }
    if (this.system === "pa")
      return {
        ...common,
        facts: [
          fact("purchase_order_ref", "", INVOICE_RESOURCE_URI),
          fact("lifecycle_status", "refused_by_buyer", "pa:status:CDAR-42"),
          fact(
            "refusal_reason",
            "buyer:missing_order_reference",
            "pa:status:CDAR-42",
          ),
        ],
        events: [
          event("deposited", "2026-09-23T09:00:00Z", "pa", "pa:status:CDAR-40"),
          event(
            "refused_by_buyer",
            observedAt,
            "pa",
            "pa:status:CDAR-42",
            "buyer:missing_order_reference",
            t(this.lang, "buyer_refusal_reason"),
          ),
        ],
        evidence: [
          {
            ref: INVOICE_RESOURCE_URI,
            kind: "synthetic_invoice_snapshot",
            digest: { alg: "sha256", value: invoiceDigest },
          },
          {
            ref: "pa:status:CDAR-42",
            kind: "status_message",
            digest: null,
          },
        ],
      };
    if (this.system === "erp")
      return {
        ...common,
        facts: [
          fact("linked_order_ref", "PO-531", "erp:order:PO-531"),
          fact("issued_invoice_po_ref", "", "erp:invoice:INV-2026-0042"),
          ...this.notes
            .get(case_id)
            .map((note, i) => fact("internal_note", note, `erp:note:${i + 1}`)),
        ],
        events: [
          event(
            "order_created",
            "2026-09-20T10:00:00Z",
            "erp",
            "erp:order:PO-531",
          ),
          event(
            "invoice_issued",
            "2026-09-23T08:00:00Z",
            "erp",
            "erp:invoice:INV-2026-0042",
          ),
        ],
        evidence: [
          {
            ref: "erp:order:PO-531",
            kind: "purchase_order",
            digest: null,
          },
          {
            ref: "erp:invoice:INV-2026-0042",
            kind: "invoice_record",
            digest: null,
          },
        ],
      };
    return {
      ...common,
      facts: [
        fact(
          "booking_status",
          "not_booked",
          "accounting:invoice:INV-2026-0042",
        ),
      ],
      events: [],
      evidence: [
        {
          ref: "accounting:invoice:INV-2026-0042",
          kind: "accounting_record",
          digest: null,
        },
      ],
    };
  }

  check(case_id) {
    this.requireCase(case_id);
    if (case_id !== CASE_ID)
      return { ...base(this.system), case_id, findings: [] };
    const findings =
      this.system === "pa"
        ? [
            {
              code: "BUYER_REF_MISSING",
              severity: "warning",
              rule_ref: "demo:buyer-reference@1",
              evidence_refs: [INVOICE_RESOURCE_URI],
              explanation: t(this.lang, "missing_po"),
            },
            {
              code: "BUYER_REFUSAL",
              severity: "blocking",
              rule_ref: "demo:lifecycle@1",
              evidence_refs: ["pa:status:CDAR-42"],
              explanation: t(this.lang, "buyer_refusal"),
            },
          ]
        : this.system === "erp"
          ? [
              {
                code: "ORDER_REFERENCE_AVAILABLE",
                severity: "info",
                rule_ref: "demo:order-link@1",
                evidence_refs: ["erp:order:PO-531"],
                explanation: t(this.lang, "po_available"),
              },
            ]
          : [
              {
                code: "NO_BOOKING",
                severity: "info",
                rule_ref: "demo:accounting-link@1",
                evidence_refs: ["accounting:invoice:INV-2026-0042"],
                explanation: t(this.lang, "no_booking"),
              },
            ];
    return { ...base(this.system), case_id, findings };
  }

  available(case_id) {
    this.requireCase(case_id);
    return {
      ...base(this.system),
      case_id,
      actions:
        this.system === "erp"
          ? [
              {
                type: "record_internal_note",
                requires_approval: true,
                effect: t(this.lang, "note_effect"),
              },
            ]
          : [],
    };
  }

  prepare({ case_id, type, note }) {
    this.requireCase(case_id);
    if (this.system !== "erp" || type !== "record_internal_note")
      throw new ProfileError("unsupported_action", this.lang);
    if (!note || note.length > 1000)
      throw new ProfileError("invalid_input", this.lang);
    const proposal_id = randomUUID();
    const expires_at = new Date(this.now() + 5 * 60 * 1000).toISOString();
    this.proposals.set(proposal_id, {
      case_id,
      type,
      note,
      revision: this.revisions.get(case_id),
      expires_at,
    });
    return {
      ...base(this.system),
      case_id,
      proposal_id,
      type,
      effect: t(this.lang, "note_effect"),
      expected_revision: this.revisions.get(case_id),
      expires_at,
      approval_required: true,
    };
  }

  execute({ proposal_id, approval_code, idempotency_key }) {
    const proposal = this.proposals.get(proposal_id);
    if (!proposal)
      throw new ProfileError("not_found", this.lang, "unknown_proposal");
    const existingKey = this.keys.get(idempotency_key);
    if (existingKey && existingKey !== proposal_id)
      throw new ProfileError("idempotency_conflict", this.lang);
    if (!this.writesEnabled || !this.approvalCode)
      throw new ProfileError("write_disabled", this.lang);
    if (approval_code !== this.approvalCode)
      throw new ProfileError("forbidden", this.lang);
    if (this.receipts.has(proposal_id)) {
      this.keys.set(idempotency_key, proposal_id);
      return this.receipts.get(proposal_id);
    }
    if (new Date(proposal.expires_at).getTime() < this.now())
      throw new ProfileError("expired", this.lang);
    if (proposal.revision !== this.revisions.get(proposal.case_id))
      throw new ProfileError("stale_revision", this.lang);
    this.notes.get(proposal.case_id).push(proposal.note);
    const revision = this.revisions.get(proposal.case_id) + 1;
    this.revisions.set(proposal.case_id, revision);
    const receipt = {
      ...base(this.system),
      proposal_id,
      receipt_id: randomUUID(),
      case_id: proposal.case_id,
      revision,
      effect: t(this.lang, "note_effect"),
    };
    this.keys.set(idempotency_key, proposal_id);
    this.receipts.set(proposal_id, receipt);
    return receipt;
  }
}
