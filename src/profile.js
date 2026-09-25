import * as z from "zod/v4";

export const PROFILE_VERSION = "0.1.0";
export const CASE_ID = "FR-2026-0042";
export const TOOL_NAMES = [
  "fe_find_invoices",
  "fe_get_invoice_case",
  "fe_check_invoice",
  "fe_get_available_actions",
  "fe_prepare_action",
  "fe_execute_action",
];

const text = z.string().min(1);
const caseId = text.describe("Stable case identifier from fe_find_invoices");

export const TOOL_SCHEMAS = {
  fe_find_invoices: {
    input: {
      query: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    },
    output: {
      profile_version: text,
      system: text,
      cases: z.array(
        z.object({ case_id: text, invoice_number: text, current_state: text }),
      ),
      next_cursor: z.string().nullable(),
    },
  },
  fe_get_invoice_case: {
    input: { case_id: caseId },
    output: {
      profile_version: text,
      system: text,
      case_id: caseId,
      invoice: z.object({
        number: text,
        seller: text,
        buyer: text,
        amount_due: z.number(),
        currency: text,
      }),
      facts: z.array(
        z.object({
          code: text,
          value: z.string(),
          source: text,
          observed_at: text,
        }),
      ),
      events: z.array(
        z.object({ code: text, at: text, source: text, evidence_ref: text }),
      ),
      evidence: z.array(
        z.object({
          ref: text,
          kind: text,
          digest_sha256: z.string().nullable(),
        }),
      ),
      revision: z.number().int().nonnegative(),
    },
  },
  fe_check_invoice: {
    input: { case_id: caseId },
    output: {
      profile_version: text,
      system: text,
      case_id: caseId,
      findings: z.array(
        z.object({
          code: text,
          severity: z.enum(["info", "warning", "blocking"]),
          rule_ref: text,
          evidence_refs: z.array(text),
          explanation: text,
        }),
      ),
    },
  },
  fe_get_available_actions: {
    input: { case_id: caseId },
    output: {
      profile_version: text,
      system: text,
      case_id: caseId,
      actions: z.array(
        z.object({ type: text, requires_approval: z.boolean(), effect: text }),
      ),
    },
  },
  fe_prepare_action: {
    input: { case_id: caseId, type: text, note: z.string().min(1).max(1000) },
    output: {
      profile_version: text,
      system: text,
      case_id: caseId,
      proposal_id: text,
      type: text,
      effect: text,
      expected_revision: z.number().int(),
      expires_at: text,
      approval_required: z.boolean(),
    },
  },
  fe_execute_action: {
    input: { proposal_id: text, approval_code: text, idempotency_key: text },
    output: {
      profile_version: text,
      system: text,
      proposal_id: text,
      receipt_id: text,
      case_id: caseId,
      revision: z.number().int(),
      effect: text,
    },
  },
};

export const DESCRIPTIONS = {
  fr: {
    fe_find_invoices:
      "Rechercher des dossiers de facture dans ce système. Données de démonstration.",
    fe_get_invoice_case:
      "Lire les faits, événements et preuves d’un dossier avec leur provenance.",
    fe_check_invoice:
      "Retourner des constats étayés, sans décision fiscale automatique.",
    fe_get_available_actions:
      "Lister les actions autorisées pour ce dossier et cet acteur.",
    fe_prepare_action:
      "Préparer une note interne sans modifier la facture ni son statut réglementaire.",
    fe_execute_action:
      "Enregistrer une note approuvée avec contrôle de version et idempotence. Démonstration uniquement.",
  },
  en: {
    fe_find_invoices:
      "Find invoice cases in this system. Synthetic reference data.",
    fe_get_invoice_case:
      "Read facts, events and evidence for an invoice case, with provenance.",
    fe_check_invoice:
      "Return evidence-backed findings; no automatic tax decision.",
    fe_get_available_actions: "List actions allowed for this case and actor.",
    fe_prepare_action:
      "Prepare a local note without changing the invoice or regulatory status.",
    fe_execute_action:
      "Commit an approved note with revision and idempotency checks. Demo only.",
  },
  es: {
    fe_find_invoices:
      "Buscar expedientes de factura en este sistema. Datos de demostración.",
    fe_get_invoice_case:
      "Leer hechos, eventos y pruebas de un expediente con su procedencia.",
    fe_check_invoice:
      "Devolver hallazgos respaldados por pruebas, sin decisión fiscal automática.",
    fe_get_available_actions:
      "Enumerar las acciones permitidas para este expediente y actor.",
    fe_prepare_action:
      "Preparar una nota interna sin cambiar la factura ni su estado reglamentario.",
    fe_execute_action:
      "Registrar una nota aprobada con control de versión e idempotencia. Solo demostración.",
  },
};
