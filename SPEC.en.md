# FE-MCP 0.3 — proposed profile

[Français](SPEC.md) · English · [Español](SPEC.es.md)

This document describes an **experimental community convention**, independent of invoicing standards. It defines an interface for MCP clients, not a new transmission channel between approved platforms.

## Model

A `case_id` is a stable case identifier within **one server**. It does not replace invoice IDs, company identifiers, or platform IDs. A client combining systems reconciles their references while preserving `system` and `source`. An invoice may have different simultaneous states in different domains; a server must not invent one global status. In `fe_find_invoices`, `state_domain` is `pa`, `commercial`, or `accounting`; `current_state` remains free-form **within that domain**.

Each successful response uses `structuredContent`, validates against the published `outputSchema`, and includes `profile_version: "0.3.0"` and `system`. A finding includes `code`, `severity`, `rule_ref`, `evidence_refs`, and `explanation`. `rule_ref` follows `namespace:rule@version`, for example `demo:buyer-reference@1`. `demo:*` rules are not regulatory validation.

`issue_date`, nullable `due_date`, `facts[].observed_at`, `events[].at`, and `expires_at` are RFC 3339 date-times in **UTC with a `Z` suffix**. `seller_id` and `buyer_id` are `{ scheme, value } | null`, with `scheme` in `siren`, `siret`, `vat`, `duns`, `gln`, `other`; `value` preserves the source identifier. The schema does not verify the identifier itself. Evidence uses `digest: { alg: "sha256", value: "..." } | null`. Supply a digest only when the corresponding bytes are accessible to the authorized actor.

Business errors use `isError: true`, a human message in `content`, and a stable code in `_meta["fe-mcp/error"].code`. Version 0.3 codes: `not_found`, `forbidden`, `unsupported_action`, `stale_revision`, `expired`, `idempotency_conflict`, `write_disabled`, `invalid_input`, `internal`. `structuredContent` is reserved for success because the SDK validates it against the normal result's `outputSchema`. MCP protocol errors are separate and retain their own codes.

## State semantics and scope

`system` is the stable, free-form identifier of the emitting server, separate from `state_domain`. Optional nullable `system_role` is `pa`, `erp`, `accounting`, or `other`; an ERP may expose sourced PA observations without claiming to be a PA. `current_state` retains the system-native value. Optional nullable `current_state_std` is free-form and carries a recommended value only when the mapping is justified. Clients must retain domain and provenance and accept unknown values.

**Recommended, schema-unenforced** vocabulary:

| `state_domain` | Suggested `current_state_std` values                                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pa`           | `deposee`, `rejetee`, `refusee`, `encaissee`, `emise_par_plateforme`, `recue_par_plateforme`, `mise_a_disposition`, `prise_en_charge`, `completee`, `suspendue`, `en_litige`, `approuvee`, `approuvee_partiellement`, `paiement_transmis` |
| `commercial`   | `draft`, `issued`, `sent`, `disputed`, `cancelled`                                                                                                                                                                                        |
| `accounting`   | `not_booked`, `booked`, `matched`, `partially_paid`, `paid`                                                                                                                                                                               |

For `pa`, the [DGFiP fact sheet 1-F-V (2025)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-1_f_v.pdf) identifies four minimum statuses: deposit, rejection, refusal, and collection. Other labels above are lifecycle examples from the [external specifications v2.1, § 2.8 (29 July 2022)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/specification_externes_b2b/version_2-1_du_29_07_2022/dossier-de-specifications-externes-de-la-facturation-electronique-v2.1.pdf), **not** a current normative list. Under the [v3.2 external specifications (30 April 2026)](https://www.impots.gouv.fr/specifications-externes-b2b), the business exchange baseline includes XP Z12-012; check that standard and PA rules before production mapping. `commercial` and `accounting` are FE-MCP conventions without regulatory status.

Nullable `transaction_type` (`b2b_domestic`, `b2c`, `b2b_international`, `payment_data`, `other`) classifies a case without determining legal obligations. The profile describes an **invoice case for reading**; it defines no e-reporting submission, transaction aggregation, or payment declaration. The [DGFiP v3.2 specifications](https://www.impots.gouv.fr/specifications-externes-b2b) cover those distinct flows. A standalone payment-data case without an invoice cannot be represented by `fe_get_invoice_case` 0.3.

`events[]` carries nullable `reason_code` and `reason_label`. Codes preserve a source namespace, such as `pa:format_invalid`, `buyer:missing_order_reference`, or `commercial:price_dispute`. These are examples, not an enum or an equivalence between PA rejection, buyer refusal, and commercial dispute. Labels explain reasons in the response language without translating user-authored data.

In `fe_get_invoice_case`, `recipient_directory_status` (`found`, `not_found`, `ambiguous`) and nullable `recipient_pdp`/`routing_id` are **read-only observations** of routing when available. They are `null` when the server has no such observation, including outside PA scope. `recipient_pdp` and `routing_id` are opaque IDs; `found` proves neither delivery nor compliance. The reference does not query a real directory.

## Indicative EN 16931 mapping

| FE-MCP               | EN 16931 term                                                  | Limit                                                 |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `invoice.number`     | BT-1                                                           | Invoice number                                        |
| `invoice.issue_date` | BT-2                                                           | FE-MCP carries a UTC instant; EN 16931 carries a date |
| `invoice.due_date`   | BT-9                                                           | Same date/instant distinction                         |
| `invoice.currency`   | BT-5                                                           | Invoice currency                                      |
| `invoice.amount_due` | BT-115                                                         | Amount due; FE-MCP does not validate the arithmetic   |
| `invoice.seller_id`  | BT-29, BT-30, or BT-31 according to identifier type and scheme | No guaranteed automatic mapping                       |
| `invoice.buyer_id`   | BT-46, BT-47, or BT-48 according to identifier type and scheme | No guaranteed automatic mapping                       |

This **non-normative** table uses the [EN 16931 model bound to UBL in Peppol BIS Billing 3.0, May 2026 release](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/). `siren`/`siret` may be legal or business identifiers according to context and invoice profile. `vat` points to a VAT identifier only when it truly identifies that party. `duns`/`gln` need their own scheme in the target document. FE-MCP neither converts identifiers nor validates an EN 16931 invoice.

## Pagination

`fe_find_invoices` accepts an empty `query`, a `limit` from 1 to 100, and an opaque `cursor`. Reusing a cursor with the **same** `query` and `limit` must return the same page while it is valid, with no duplicates from the previous page. Servers may set a documented validity period; an unreadable, changed, expired, or mismatched cursor returns `invalid_input`. The reference has three synthetic cases and signed cursors valid for five minutes, invalidated by a restart.

## Calls

1. `fe_find_invoices(query, limit, cursor)` returns case references, their state domain, and an optional cursor.
2. `fe_get_invoice_case(case_id)` returns invoice, dates, identifiers, facts, events, evidence, and revision. Each fact has a source and observation time.
3. `fe_check_invoice(case_id)` returns sourced findings. A model's diagnosis must not be presented as a system fact or certain tax advice.
4. `fe_get_available_actions(case_id)` returns operations permitted _in this system_ at call time. They may no longer be permitted at execution time.
5. `fe_prepare_action(case_id, type, note)` creates a temporary proposal with expected effect, revision and expiry. In reference version 0.3, the only `type` is `record_internal_note` in the synthetic ERP.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` rechecks rights, expiry and revision, then returns a stable receipt. Repeating a proposal must not duplicate the effect. Demo approval is a local code; a real integration needs its own server-side identity, delegation and approval controls.

## States and permissions

`refused_by_buyer`, `issued` and `not_booked` are states from **different systems** in the example. The reference internal note changes no regulatory status or issued invoice. Future actions such as credit notes, refusals or payment status would need their own schemas, permissions and business tests; they are not implemented here.

A real implementation must isolate companies, authenticate the user, check delegation on **every** call, limit returned data and retain an audit log. MCP annotations describe intent; they grant no permissions. The reference server is intended only for local public synthetic data.

The `approval_code` field is **non-authoritative**: its presence proves no permission. The server must verify approval bound to the actor, tenant, proposal, its effect, and a short validity period; otherwise execution returns `write_disabled` or `forbidden`. The demo's static code is not a production security model.

## Compatibility and conformance

Tool names and fields in this version are stable within the repository, without claiming official standard status. Vendors may start with read calls and declare writes unavailable. `bin/check.js` tests shape and a read scenario over stdio or Streamable HTTP; it proves neither XP Z12-012/013/014 compliance nor production security.

`profile_version` is the **wire contract** version; a Git tag identifies a **repository release**. They evolve separately. Profile 0.3.0 is incompatible with 0.2.0: `seller_id` and `buyer_id` become nullable typed objects and `events[]` adds nullable reasons. Migrate old strings to `{ scheme, value }` only after reliably identifying their scheme; otherwise use `null`. `z.literal("0.3.0")` enforces `profile_version` on all six outputs; see [CHANGELOG.en.md](CHANGELOG.en.md).
