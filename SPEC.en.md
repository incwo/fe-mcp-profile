# FE-MCP 0.2 — proposed profile

[Français](SPEC.md) · English · [Español](SPEC.es.md)

This document describes an **experimental community convention**, independent of invoicing standards. It defines an interface for MCP clients, not a new transmission channel between approved platforms.

## Model

A `case_id` is a stable case identifier within **one server**. It does not replace invoice IDs, company identifiers, or platform IDs. A client combining systems reconciles their references while preserving `system` and `source`. An invoice may have different simultaneous states in different domains; a server must not invent one global status. In `fe_find_invoices`, `state_domain` is `pa`, `commercial`, or `accounting`; `current_state` remains free-form **within that domain**.

Each successful response uses `structuredContent`, validates against the published `outputSchema`, and includes `profile_version: "0.2.0"` and `system`. A finding includes `code`, `severity`, `rule_ref`, `evidence_refs`, and `explanation`. `rule_ref` follows `namespace:rule@version`, for example `demo:buyer-reference@1`. `demo:*` rules are not regulatory validation.

`issue_date`, nullable `due_date`, `facts[].observed_at`, `events[].at`, and `expires_at` are RFC 3339 date-times in **UTC with a `Z` suffix**. `seller_id` and `buyer_id` are nullable legal identifiers; version 0.2 does not yet normalize their identifier scheme. Evidence uses `digest: { alg: "sha256", value: "..." } | null`. Supply a digest only when the corresponding bytes are accessible to the authorized actor.

Business errors use `isError: true`, a human message in `content`, and a stable code in `_meta["fe-mcp/error"].code`. Version 0.2 codes: `not_found`, `forbidden`, `unsupported_action`, `stale_revision`, `expired`, `idempotency_conflict`, `write_disabled`, `invalid_input`, `internal`. `structuredContent` is reserved for success because the SDK validates it against the normal result's `outputSchema`. MCP protocol errors are separate and retain their own codes.

## Pagination

`fe_find_invoices` accepts an empty `query`, a `limit` from 1 to 100, and an opaque `cursor`. Reusing a cursor with the **same** `query` and `limit` must return the same page while it is valid, with no duplicates from the previous page. Servers may set a documented validity period; an unreadable, changed, expired, or mismatched cursor returns `invalid_input`. The reference has three synthetic cases and signed cursors valid for five minutes, invalidated by a restart.

## Calls

1. `fe_find_invoices(query, limit, cursor)` returns case references, their state domain, and an optional cursor.
2. `fe_get_invoice_case(case_id)` returns invoice, dates, identifiers, facts, events, evidence, and revision. Each fact has a source and observation time.
3. `fe_check_invoice(case_id)` returns sourced findings. A model's diagnosis must not be presented as a system fact or certain tax advice.
4. `fe_get_available_actions(case_id)` returns operations permitted _in this system_ at call time. They may no longer be permitted at execution time.
5. `fe_prepare_action(case_id, type, note)` creates a temporary proposal with expected effect, revision and expiry. In reference version 0.2, the only `type` is `record_internal_note` in the synthetic ERP.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` rechecks rights, expiry and revision, then returns a stable receipt. Repeating a proposal must not duplicate the effect. Demo approval is a local code; a real integration needs its own server-side identity, delegation and approval controls.

## States and permissions

`refused_by_buyer`, `issued` and `not_booked` are states from **different systems** in the example. The reference internal note changes no regulatory status or issued invoice. Future actions such as credit notes, refusals or payment status would need their own schemas, permissions and business tests; they are not implemented here.

A real implementation must isolate companies, authenticate the user, check delegation on **every** call, limit returned data and retain an audit log. MCP annotations describe intent; they grant no permissions. The reference server is intended only for local public synthetic data.

The `approval_code` field is **non-authoritative**: its presence proves no permission. The server must verify approval bound to the actor, tenant, proposal, its effect, and a short validity period; otherwise execution returns `write_disabled` or `forbidden`. The demo's static code is not a production security model.

## Compatibility and conformance

Tool names and fields in this version are stable within the repository, without claiming official standard status. Vendors may start with read calls and declare writes unavailable. `bin/check.js` tests shape and a read scenario over stdio or Streamable HTTP; it proves neither XP Z12-012/013/014 compliance nor production security.

`profile_version` is the **wire contract** version; a Git tag identifies a **repository release**. They evolve separately. Profile 0.2.0 is incompatible with 0.1.0 (`digest_sha256` becomes `digest` and `state_domain` is required). An incompatible change requires a new profile version; see [CHANGELOG.en.md](CHANGELOG.en.md).
