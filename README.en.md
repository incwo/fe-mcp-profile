# FE-MCP Profile

**A community proposal for making e-invoicing cases accessible to agents across software vendors.** A small vocabulary of MCP tools, a reference server with synthetic data, and an executable conformance check.

[Français](README.md) · English · [Español](README.es.md)

> Exploratory version 0.1. This project is neither an AFNOR standard, nor an approved platform, nor a tax compliance certification. It connects to no real service.

**Vendors:** give the [complete implementation prompt](PROMPT.en.md) to your coding AI to add the profile to your MCP server. [FR](PROMPT.md) and [ES](PROMPT.es.md) versions are available.

## Why

Invoice formats and exchanges with approved platforms already have standards. Daily work remains split across systems: a platform knows about a refusal, an ERP knows the purchase order, and an accounting firm knows the booking. FE-MCP proposes six common business calls with sourced facts and explicit actions. An authorized MCP client can connect to each software server separately and combine their responses. Servers do not communicate automatically with one another.

## Try it in two minutes

Node.js 22+:

```sh
npm ci
npm run demo
npm run check
npm test
```

The demo starts three real local MCP servers (`pa`, `erp`, `accounting`) with **entirely synthetic data**. It shows a refused invoice, an order reference found in the ERP, and no accounting entry. It issues no invoice and contacts no third party.

Change language: `node bin/demo.js --lang en` or `--lang es`. JSON output: `node bin/demo.js --json`. Start a server separately: `node bin/server.js --system pa --lang en` (MCP stdio transport; output is intended for an MCP client).

## The six tools

| Tool                       | Meaning                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| `fe_find_invoices`         | Search cases and obtain stable identifiers                             |
| `fe_get_invoice_case`      | Read invoice, facts, events, evidence and provenance                   |
| `fe_check_invoice`         | Get findings backed by rules and evidence                              |
| `fe_get_available_actions` | See actions allowed in this system                                     |
| `fe_prepare_action`        | Prepare an action without changing the invoice                         |
| `fe_execute_action`        | Execute a proposal with authorization, revision and idempotency checks |

The reference server allows only an **internal ERP note** as a write. It is disabled by default and only affects synthetic data. Read tools, the evidence resource and its SHA-256 verification work without configuration. See the [detailed profile](SPEC.en.md).

## Check another server

The checker verifies six declared tools, their schemas, four read calls, revision stability and the response for an unknown case. It also verifies digests for `fe-demo://` resources when present. It never calls write tools.

```sh
node bin/check.js --case-id FR-2026-0042 -- node /path/to/server.js
```

A real adapter must provide its own test case, replace the ID after `--case-id`, authenticate every actor and enforce each company's permissions. The current checker is an interoperability starting point, not a regulatory or security audit.

## Place in the ecosystem

FE-MCP sits **above** business APIs and XP Z12-013. Approved platforms retain their legal transmission and reception role; platform, commercial and accounting statuses remain distinct. This repository does not replace the existing [mcp-facture-electronique-fr](https://github.com/cmendezs/mcp-facture-electronique-fr) server, which exposes approved platform interfaces. The planned first pilot uses the incwo MCP server and synthetic data; a trial across two vendors and an accounting firm may follow.

Sources: [French tax authority — approved platforms](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees), [external specifications](https://www.impots.gouv.fr/specifications-externes-b2b), [MCP architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture).

MIT · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)
