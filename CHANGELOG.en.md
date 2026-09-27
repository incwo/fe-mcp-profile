# Release history

[Français](CHANGELOG.md) · English · [Español](CHANGELOG.es.md)

Git tags version the repository; `profile_version` versions the FE-MCP wire contract. These numbers may differ.

## v0.2.0 — profile 0.2.0 — 27 September 2026

- **Incompatible with profile 0.1.0**: `digest_sha256` becomes `digest: { alg, value } | null`, and `state_domain` is required in search results.
- Validated UTC date-times, additional invoice dates and identifiers, and rules referenced as `namespace:rule@version`.
- Business error codes in `_meta["fe-mcp/error"].code`, independent of translated messages.
- Streamable HTTP conformance checker with test headers and the same checks as stdio; real pagination with signed cursors and a second-page test.
- Vendor prompt and documentation updated in French, English, and Spanish. Resolves issues #1 through #10.

## v0.1.1 — profile 0.1.0 — 25 September 2026

- Published the vendor implementation prompt in three languages; wire contract unchanged.

## v0.1.0 — profile 0.1.0 — 25 September 2026

- First release of six tools, three synthetic servers, and the stdio conformance checker.
