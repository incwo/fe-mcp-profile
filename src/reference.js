import { createHash, randomUUID } from "node:crypto";
import { CASE_ID, PROFILE_VERSION } from "./profile.js";
import { language, t } from "./i18n.js";

const observedAt = "2026-09-24T09:00:00Z";
const invoice = Object.freeze({
  number: "INV-2026-0042",
  seller: "Atelier Marais",
  buyer: "Librairie Atlas",
  amount_due: 1200,
  currency: "EUR",
});
export const INVOICE_RESOURCE_URI = "fe-demo://pa/invoice/INV-2026-0042";
export const INVOICE_RESOURCE_TEXT = JSON.stringify({
  synthetic: true,
  invoice,
  purchase_order_ref: null,
});
const invoiceDigest = createHash("sha256")
  .update(INVOICE_RESOURCE_TEXT)
  .digest("hex");

const base = (system) => ({ profile_version: PROFILE_VERSION, system });
const fact = (code, value, source) => ({
  code,
  value,
  source,
  observed_at: observedAt,
});
const event = (code, at, source, evidence_ref) => ({
  code,
  at,
  source,
  evidence_ref,
});

export class ReferenceStore {
  constructor({
    system = "pa",
    lang = "fr",
    writesEnabled = false,
    approvalCode = "",
  } = {}) {
    if (!["pa", "erp", "accounting"].includes(system))
      throw new Error(t(lang, "invalid_system"));
    this.system = system;
    this.lang = language(lang);
    this.writesEnabled = writesEnabled;
    this.approvalCode = approvalCode;
    this.revision = 1;
    this.notes = [];
    this.proposals = new Map();
    this.receipts = new Map();
    this.keys = new Map();
  }

  requireCase(case_id) {
    if (case_id !== CASE_ID) throw new Error(t(this.lang, "unknown_case"));
  }

  find({ query = "", limit = 20, cursor } = {}) {
    if (cursor) return { ...base(this.system), cases: [], next_cursor: null };
    const matches = [
      CASE_ID,
      invoice.number,
      invoice.seller,
      invoice.buyer,
    ].some((x) => x.toLowerCase().includes(query.toLowerCase()));
    return {
      ...base(this.system),
      cases:
        matches && limit > 0
          ? [
              {
                case_id: CASE_ID,
                invoice_number: invoice.number,
                current_state:
                  this.system === "pa"
                    ? "refused_by_buyer"
                    : this.system === "erp"
                      ? "issued"
                      : "not_booked",
              },
            ]
          : [],
      next_cursor: null,
    };
  }

  get(case_id) {
    this.requireCase(case_id);
    const common = {
      ...base(this.system),
      case_id,
      invoice,
      revision: this.revision,
    };
    if (this.system === "pa")
      return {
        ...common,
        facts: [
          fact("purchase_order_ref", "", INVOICE_RESOURCE_URI),
          fact("lifecycle_status", "refused_by_buyer", "pa:status:CDAR-42"),
        ],
        events: [
          event("deposited", "2026-09-23T09:00:00Z", "pa", "pa:status:CDAR-40"),
          event("refused_by_buyer", observedAt, "pa", "pa:status:CDAR-42"),
        ],
        evidence: [
          {
            ref: INVOICE_RESOURCE_URI,
            kind: "synthetic_invoice_snapshot",
            digest_sha256: invoiceDigest,
          },
          {
            ref: "pa:status:CDAR-42",
            kind: "status_message",
            digest_sha256: null,
          },
        ],
      };
    if (this.system === "erp")
      return {
        ...common,
        facts: [
          fact("linked_order_ref", "PO-531", "erp:order:PO-531"),
          fact("issued_invoice_po_ref", "", "erp:invoice:INV-2026-0042"),
          ...this.notes.map((note, i) =>
            fact("internal_note", note, `erp:note:${i + 1}`),
          ),
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
            digest_sha256: null,
          },
          {
            ref: "erp:invoice:INV-2026-0042",
            kind: "invoice_record",
            digest_sha256: null,
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
          digest_sha256: null,
        },
      ],
    };
  }

  check(case_id) {
    this.requireCase(case_id);
    const findings =
      this.system === "pa"
        ? [
            {
              code: "BUYER_REF_MISSING",
              severity: "warning",
              rule_ref: "demo:buyer-reference",
              evidence_refs: [INVOICE_RESOURCE_URI],
              explanation: t(this.lang, "missing_po"),
            },
            {
              code: "BUYER_REFUSAL",
              severity: "blocking",
              rule_ref: "demo:lifecycle",
              evidence_refs: ["pa:status:CDAR-42"],
              explanation: t(this.lang, "buyer_refusal"),
            },
          ]
        : this.system === "erp"
          ? [
              {
                code: "ORDER_REFERENCE_AVAILABLE",
                severity: "info",
                rule_ref: "demo:order-link",
                evidence_refs: ["erp:order:PO-531"],
                explanation: t(this.lang, "po_available"),
              },
            ]
          : [
              {
                code: "NO_BOOKING",
                severity: "info",
                rule_ref: "demo:accounting-link",
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
      throw new Error(t(this.lang, "unsupported_action"));
    if (!note || note.length > 1000)
      throw new Error(t(this.lang, "unsupported_action"));
    const proposal_id = randomUUID();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.proposals.set(proposal_id, {
      case_id,
      type,
      note,
      revision: this.revision,
      expires_at,
    });
    return {
      ...base(this.system),
      case_id,
      proposal_id,
      type,
      effect: t(this.lang, "note_effect"),
      expected_revision: this.revision,
      expires_at,
      approval_required: true,
    };
  }

  execute({ proposal_id, approval_code, idempotency_key }) {
    const proposal = this.proposals.get(proposal_id);
    if (!proposal) throw new Error(t(this.lang, "unknown_proposal"));
    const existingKey = this.keys.get(idempotency_key);
    if (existingKey && existingKey !== proposal_id)
      throw new Error(t(this.lang, "key_conflict"));
    if (this.receipts.has(proposal_id)) {
      this.keys.set(idempotency_key, proposal_id);
      return this.receipts.get(proposal_id);
    }
    if (
      !this.writesEnabled ||
      !this.approvalCode ||
      approval_code !== this.approvalCode
    )
      throw new Error(t(this.lang, "approval_required"));
    if (new Date(proposal.expires_at).getTime() < Date.now())
      throw new Error(t(this.lang, "expired"));
    if (proposal.revision !== this.revision)
      throw new Error(t(this.lang, "stale"));
    this.notes.push(proposal.note);
    this.revision += 1;
    const receipt = {
      ...base(this.system),
      proposal_id,
      receipt_id: randomUUID(),
      case_id: proposal.case_id,
      revision: this.revision,
      effect: t(this.lang, "note_effect"),
    };
    this.keys.set(idempotency_key, proposal_id);
    this.receipts.set(proposal_id, receipt);
    return receipt;
  }
}
