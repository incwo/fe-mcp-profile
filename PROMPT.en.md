# FE-MCP implementation prompt for software vendors

[Français](PROMPT.md) · English · [Español](PROMPT.es.md)

Copy **all the text below** into the coding AI working on your software or MCP server repository. Give it access to the code and a test environment with synthetic data. Production access is not needed to start.

---

You are working in a software vendor’s MCP repository. **Implement community profile FE-MCP 0.1.0** on this server using the software’s real data and authorization mechanisms, then demonstrate conformance with a synthetic test case. Make the changes in the repository, run the tests, and provide a verifiable report. Do not enable invoice transmission or regulatory writes to satisfy this prompt.

## Read the contract before coding

- Public reference repository: `https://github.com/incwo/fe-mcp-profile/tree/v0.1.1`.
- Read `SPEC.en.md`, `src/profile.js`, `src/reference.js`, `bin/check.js`, and the reference repository’s tests. The code in `src/profile.js` is the exact source for the names, parameters, and schemas in version 0.1.0. Do not silently substitute “equivalent” schemas.
- The profile is a community proposal above MCP and business APIs. It does not replace approved platforms, XP Z12-013, or applicable tax rules.
- Use the MCP SDK, transport, authentication, and conventions already present in your repository. Do not add a second server or technology stack if the existing server can be extended cleanly.

## Start with a concrete inventory

1. Find where MCP tools are registered, invoicing services, any approved-platform APIs, invoice/order/payment models, roles and delegations, and existing tests. Follow local repository instructions.
2. Produce a mapping table **FE-MCP field → business source → access check → available evidence**. Clearly separate what the software knows, what the approved platform knows, and what is unavailable. Do not infer an approved-platform status from an ERP or accounting state.
3. Choose a reproducible synthetic case in a test tenant. Ensure it cannot reveal a real invoice, customer data, or a secret. Record its `case_id` and the command that starts the MCP server locally.
4. If required information is unavailable, report the gap and make the affected call fail explicitly. Do not invent values to pass the conformance checker.

## Implement all six tools with their exact names

| Tool                       | Expected behavior                                                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fe_find_invoices`         | Paginated search restricted to the tenant and invoices visible to the actor; return stable `case_id` values within this server.                                                                                                            |
| `fe_get_invoice_case`      | Return invoice, facts, events, evidence, and revision. Every fact has a `source` and `observed_at`. Keep platform, commercial, and accounting statuses separate.                                                                           |
| `fe_check_invoice`         | Return only deterministic or clearly sourced findings with `code`, `severity`, `rule_ref`, `evidence_refs`, and `explanation`. Version the rules; never present an AI suggestion as tax validation.                                        |
| `fe_get_available_actions` | Return only actions actually allowed for this actor and case at this moment. An empty list is valid.                                                                                                                                       |
| `fe_prepare_action`        | Prepare a typed action, announced effect, expected revision, and expiry; do not modify an issued invoice or regulatory status. For the first integration, support only `record_internal_note` if the software really has an internal note. |
| `fe_execute_action`        | Recheck rights, tenant, approval, expiry, and revision at execution time; apply the effect once and return a stable receipt. If safe approval or the corresponding write is unavailable, refuse execution explicitly.                      |

For every success, return `structuredContent` that matches the published `outputSchema`, with `profile_version: "0.1.0"` and a stable `system`. For a business error or denied access, return an MCP error (`isError`) without pretending to succeed. Preserve source IDs and provenance; `case_id` is local to the server, not a universal tax identifier. Supply `digest_sha256` only if the exact evidence bytes are available to the same actor through an MCP resource or another documented, authorized path; otherwise use `null`.

## Permissions and writes: production safeguards

- Check identity, company/tenant, role, and delegation **server-side on every call**, including reads, listings, evidence, and proposals. Prompt text, agent-provided arguments, and MCP annotations grant no permissions. Prevent cross-tenant leaks in errors, searches, and cursors as well.
- Reuse existing authentication. Do not pass an MCP client token directly to an approved platform or another API unless that API’s authorization flow allows it. Do not log secrets, originals, or sensitive attachments.
- The profile 0.1.0 `approval_code` field **is not** proof of approval on its own. In production, accept only a server-verifiable authorization bound to actor, tenant, `proposal_id`, effect, and a short lifetime. If the architecture does not yet support this, expose the tool but make execution unavailable; do not copy the demo server’s static code.
- Bind `idempotency_key` to actor, tenant, and operation; persist receipts across restarts and multiple instances. Reject reuse of a key for another proposal. Prevent duplicate writes under concurrent calls.
- Do not create credit notes, approved-platform refusals, payment status, or e-reporting in this first integration. Every future action needs its own business analysis, schemas, and permissions.

## Tests and acceptance criteria

1. Add contract tests for **all six** tool names, parameters, schemas, and structured outputs. Test search/pagination, an unknown case, evidence, and no mutation after read calls.
2. Test isolation across two tenants and two roles; verify that an unauthorized user cannot see a case, evidence, or action. Test execution without approval, expired proposals, stale revisions, concurrency, and idempotent replay. If writes are unavailable, test the explicit refusal.
3. Check user-facing messages in the product’s supported languages; provide at least FR, EN, and ES for new text if repository rules require it. Never automatically translate user data.
4. Run the public **read-only** checker against the local server and synthetic case:

```sh
git clone https://github.com/incwo/fe-mcp-profile.git
cd fe-mcp-profile
npm ci
node bin/check.js --case-id SYNTHETIC_CASE_ID -- mcp-server-start-command arguments
```

The current checker expects an MCP **stdio** server. If yours uses HTTP, create a local test stdio adapter or run the same assertions through an MCP HTTP client; state exactly what was tested. The checker verifies shape and a read scenario, not security or tax compliance. Also run the vendor repository’s own tests and formatter.

## Expected delivery

Provide the code changes, tests, and short integration documentation. In your final report, include: (1) working tools and tools that intentionally refuse writes; (2) the mapping table with data sources; (3) test command and results; (4) concrete limitations, including missing platform data or delegations; and (5) actions required before any real pilot. Do not claim “e-invoicing compliant” based only on these tests. Do not deploy to production without explicit instruction from the vendor.

---

**Planned first incwo pilot:** run this prompt in the incwo MCP repository with a test tenant and synthetic invoices, then run the read-only checker. Publishing this prompt does not yet connect incwo to an approved platform or another vendor.
