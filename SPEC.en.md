# FE-MCP 0.1 — proposed profile

[Français](SPEC.md) · English · [Español](SPEC.es.md)

This document describes an **experimental community convention**, independent of invoicing standards. It defines an interface for MCP clients, not a new transmission channel between approved platforms.

## Model

A `case_id` is a stable case identifier within **one server**. It does not replace invoice IDs, company identifiers, or platform IDs. A client combining systems reconciles their references while preserving `system` and `source`. An invoice may have different simultaneous states in different domains; a server must not invent one global status.

Each successful response uses `structuredContent`, validates against the published `outputSchema`, and includes `profile_version` and `system`. Error responses use `isError` rather than pretending to succeed. Lists are paginated. A finding includes `code`, `severity`, `rule_ref`, `evidence_refs` and `explanation`. `rule_ref` must identify the applicable rule version; demo rules named `demo:*` are not regulatory validation.

## Calls

1. `fe_find_invoices(query, limit, cursor)` returns case references and an optional cursor.
2. `fe_get_invoice_case(case_id)` returns invoice, facts, events, evidence and revision. Each fact has a source and observation time. A SHA-256 digest is supplied only when the corresponding bytes are available for verification.
3. `fe_check_invoice(case_id)` returns sourced findings. A model's diagnosis must not be presented as a system fact or certain tax advice.
4. `fe_get_available_actions(case_id)` returns operations permitted _in this system_ at call time. They may no longer be permitted at execution time.
5. `fe_prepare_action(case_id, type, note)` creates a temporary proposal with expected effect, revision and expiry. In reference version 0.1, the only `type` is `record_internal_note` in the synthetic ERP.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` rechecks rights, expiry and revision, then returns a stable receipt. Repeating a proposal must not duplicate the effect. Demo approval is a local code; a real integration needs its own server-side identity, delegation and approval controls.

## States and permissions

`refused_by_buyer`, `issued` and `not_booked` are states from **different systems** in the example. The reference internal note changes no regulatory status or issued invoice. Future actions such as credit notes, refusals or payment status would need their own schemas, permissions and business tests; they are not implemented here.

A real implementation must isolate companies, authenticate the user, check delegation on **every** call, limit returned data and retain an audit log. MCP annotations describe intent; they grant no permissions. The reference server is intended only for local public synthetic data.

## Compatibility and conformance

Tool names and fields in this version are stable within the repository, without claiming official standard status. Vendors may start with read calls and declare writes unavailable. `bin/check.js` tests shape and a read scenario; it proves neither XP Z12-012/013/014 compliance nor production security. An incompatible change will require a new profile version.
