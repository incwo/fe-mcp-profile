export const LANGUAGES = ["fr", "en", "es"];

const messages = {
  fr: {
    invalid_system: "Système de référence invalide",
    missing_tool: "Outil manquant",
    missing_schema: "Schéma manquant",
    missing_content: "Sortie structurée absente",
    case_absent: "Dossier absent de la recherche",
    wrong_case: "Identifiant de dossier incorrect",
    wrong_version: "Version de profil incorrecte",
    wrong_system: "Identifiant de système incohérent",
    empty_next_page: "Curseur vers une page vide",
    duplicate_page: "Dossier répété entre deux pages",
    invalid_cursor_succeeded:
      "Un curseur invalide n’a pas été rejeté avec le code invalid_input",
    invalid_header: "En-tête HTTP invalide",
    missing_header_env: "Variable d’environnement d’en-tête absente",
    transport_conflict: "Choisir le transport HTTP ou stdio",
    unsupported_protocol: "Protocole d’URL MCP non pris en charge",
    insecure_header_transport:
      "Les en-têtes d’autorisation exigent HTTPS hors de la machine locale",
    pages: "pages",
    tools: "outils",
    changed_on_read: "Les appels de lecture ont modifié la révision",
    unknown_succeeded: "Un dossier inconnu n’a pas produit d’erreur",
    digest_mismatch: "Empreinte de preuve incorrecte",
    unknown_case: "Dossier introuvable",
    forbidden: "Action non autorisée",
    write_disabled: "Écriture indisponible sur ce serveur",
    invalid_input: "Paramètre ou curseur invalide",
    internal_error: "Erreur interne du serveur",
    unsupported_action: "Action indisponible pour cet acteur ou ce système",
    unknown_proposal: "Proposition introuvable",
    approval_required: "Écriture désactivée ou code d’approbation invalide",
    expired: "Proposition expirée",
    stale: "Le dossier a changé depuis la préparation",
    key_conflict: "Clé d’idempotence déjà utilisée pour une autre proposition",
    missing_po: "La référence de commande manque dans la facture transmise.",
    buyer_refusal:
      "Le destinataire a refusé la facture ; vérifier le motif avant toute correction.",
    po_available:
      "Une commande liée contient une référence qui pourrait aider à résoudre le refus.",
    no_booking:
      "Aucune écriture comptable n’est associée à ce dossier dans cet exemple.",
    note_effect:
      "Ajouter une note interne au dossier ERP ; aucun statut PA ni document émis ne change.",
    demo_title: "Démonstration FE-MCP : dossier refusé",
    demo_summary:
      "La PA signale un refus ; l’ERP contient une référence de commande absente de la facture ; la comptabilité ne montre aucune écriture.",
    demo_next:
      "Faire vérifier le motif et la correction appropriée par une personne habilitée.",
    check_ok: "Profil vérifié en lecture seule",
    check_fail: "Échec de conformité",
  },
  en: {
    invalid_system: "Invalid reference system",
    missing_tool: "Missing tool",
    missing_schema: "Missing schema",
    missing_content: "Structured output missing",
    case_absent: "Case absent from search",
    wrong_case: "Wrong case identifier",
    wrong_version: "Wrong profile version",
    wrong_system: "Inconsistent system identifier",
    empty_next_page: "Cursor points to an empty page",
    duplicate_page: "Case repeated across pages",
    invalid_cursor_succeeded:
      "Invalid cursor was not rejected with invalid_input",
    invalid_header: "Invalid HTTP header",
    missing_header_env: "Header environment variable is missing",
    transport_conflict: "Choose HTTP or stdio transport",
    unsupported_protocol: "Unsupported MCP URL protocol",
    insecure_header_transport:
      "Authorization headers require HTTPS outside localhost",
    pages: "pages",
    tools: "tools",
    changed_on_read: "Read calls changed the revision",
    unknown_succeeded: "An unknown case did not fail",
    digest_mismatch: "Evidence digest mismatch",
    unknown_case: "Case not found",
    forbidden: "Action not authorized",
    write_disabled: "Writes are unavailable on this server",
    invalid_input: "Invalid parameter or cursor",
    internal_error: "Internal server error",
    unsupported_action: "Action unavailable for this actor or system",
    unknown_proposal: "Proposal not found",
    approval_required: "Writes disabled or invalid approval code",
    expired: "Proposal expired",
    stale: "Case changed after preparation",
    key_conflict: "Idempotency key already used for another proposal",
    missing_po:
      "The purchase order reference is missing from the transmitted invoice.",
    buyer_refusal:
      "The buyer refused the invoice; check the reason before any correction.",
    po_available:
      "A linked order contains a reference that may help resolve the refusal.",
    no_booking: "No accounting entry is linked to this case in the example.",
    note_effect:
      "Add an internal note to the ERP case; no PA status or issued document changes.",
    demo_title: "FE-MCP demo: refused invoice case",
    demo_summary:
      "The PA reports a refusal; the ERP contains an order reference missing from the invoice; accounting shows no entry.",
    demo_next:
      "Have an authorized person review the reason and appropriate correction.",
    check_ok: "Read-only profile verified",
    check_fail: "Conformance failed",
  },
  es: {
    invalid_system: "Sistema de referencia no válido",
    missing_tool: "Falta una herramienta",
    missing_schema: "Falta un esquema",
    missing_content: "Falta la salida estructurada",
    case_absent: "El expediente no aparece en la búsqueda",
    wrong_case: "Identificador de expediente incorrecto",
    wrong_version: "Versión del perfil incorrecta",
    wrong_system: "Identificador de sistema incoherente",
    empty_next_page: "El cursor apunta a una página vacía",
    duplicate_page: "Expediente repetido entre páginas",
    invalid_cursor_succeeded:
      "El cursor inválido no se rechazó con invalid_input",
    invalid_header: "Cabecera HTTP inválida",
    missing_header_env: "Falta la variable de entorno de la cabecera",
    transport_conflict: "Elija transporte HTTP o stdio",
    unsupported_protocol: "Protocolo de URL MCP no admitido",
    insecure_header_transport:
      "Las cabeceras de autorización requieren HTTPS fuera del equipo local",
    pages: "páginas",
    tools: "herramientas",
    changed_on_read: "Las consultas cambiaron la revisión",
    unknown_succeeded: "Un expediente desconocido no produjo error",
    digest_mismatch: "La huella de la prueba no coincide",
    unknown_case: "Expediente no encontrado",
    forbidden: "Acción no autorizada",
    write_disabled: "La escritura no está disponible en este servidor",
    invalid_input: "Parámetro o cursor no válido",
    internal_error: "Error interno del servidor",
    unsupported_action: "Acción no disponible para este actor o sistema",
    unknown_proposal: "Propuesta no encontrada",
    approval_required:
      "Escrituras desactivadas o código de aprobación inválido",
    expired: "Propuesta caducada",
    stale: "El expediente cambió después de preparar la propuesta",
    key_conflict: "Clave de idempotencia ya usada para otra propuesta",
    missing_po: "Falta la referencia del pedido en la factura transmitida.",
    buyer_refusal:
      "El destinatario rechazó la factura; compruebe el motivo antes de corregirla.",
    po_available:
      "Un pedido vinculado contiene una referencia que podría ayudar a resolver el rechazo.",
    no_booking:
      "No hay asiento contable vinculado a este expediente en el ejemplo.",
    note_effect:
      "Añadir una nota interna al expediente ERP; no cambian el estado de la PA ni el documento emitido.",
    demo_title: "Demostración FE-MCP: factura rechazada",
    demo_summary:
      "La PA informa de un rechazo; el ERP contiene una referencia de pedido ausente en la factura; contabilidad no muestra ningún asiento.",
    demo_next:
      "Solicitar a una persona autorizada que revise el motivo y la corrección adecuada.",
    check_ok: "Perfil verificado en modo de solo lectura",
    check_fail: "Fallo de conformidad",
  },
};

export function language(value) {
  return LANGUAGES.includes(value) ? value : "fr";
}

export function t(lang, key) {
  return messages[language(lang)][key];
}
