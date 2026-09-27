import { t } from "./i18n.js";

export const ERROR_CODES = [
  "not_found",
  "forbidden",
  "unsupported_action",
  "stale_revision",
  "expired",
  "idempotency_conflict",
  "write_disabled",
  "invalid_input",
  "internal",
];

const messageKeys = {
  not_found: "unknown_case",
  forbidden: "forbidden",
  unsupported_action: "unsupported_action",
  stale_revision: "stale",
  expired: "expired",
  idempotency_conflict: "key_conflict",
  write_disabled: "write_disabled",
  invalid_input: "invalid_input",
  internal: "internal_error",
};

export class ProfileError extends Error {
  constructor(code, lang = "fr", messageKey = messageKeys[code]) {
    if (!ERROR_CODES.includes(code))
      throw new TypeError(`Unknown profile error code: ${code}`);
    super(t(lang, messageKey));
    this.name = "ProfileError";
    this.code = code;
  }
}

export function errorResult(error, lang = "fr") {
  const known =
    error instanceof ProfileError ? error : new ProfileError("internal", lang);
  return {
    isError: true,
    content: [{ type: "text", text: known.message }],
    _meta: { "fe-mcp/error": { code: known.code } },
  };
}
