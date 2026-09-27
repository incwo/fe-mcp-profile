#!/usr/bin/env node
import { CASE_ID } from "../src/profile.js";
import {
  connectCommand,
  connectHttp,
  connectReference,
} from "../src/client.js";
import { runChecks } from "../src/conformance.js";
import { language, t } from "../src/i18n.js";

const args = process.argv.slice(2);
const separator = args.indexOf("--");
const options = separator < 0 ? args : args.slice(0, separator);
const option = (name, fallback) => {
  const index = options.indexOf(name);
  return index >= 0 ? options[index + 1] : fallback;
};
const lang = language(option("--lang", "fr"));
const caseId = option("--case-id", CASE_ID);
const httpUrl = option("--http", null);
const headerValues = [];
const headers = {};
let connection;

function addHeader(value) {
  const index = value?.indexOf(":") ?? -1;
  if (index < 1) throw new Error(t(lang, "invalid_header"));
  const name = value.slice(0, index).trim();
  const headerValue = value.slice(index + 1).trim();
  if (!/^[A-Za-z0-9-]+$/.test(name) || /[\r\n]/.test(headerValue))
    throw new Error(t(lang, "invalid_header"));
  headers[name] = headerValue;
  if (headerValue) headerValues.push(headerValue);
}

try {
  for (let i = 0; i < options.length; i++) {
    if (options[i] === "--header") addHeader(options[++i]);
    if (options[i] === "--header-env") {
      const value = process.env[options[++i]];
      if (!value) throw new Error(t(lang, "missing_header_env"));
      addHeader(value);
    }
  }
  if (httpUrl && separator >= 0) throw new Error(t(lang, "transport_conflict"));
  connection = httpUrl
    ? await connectHttp(httpUrl, headers, lang)
    : separator >= 0
      ? await connectCommand(args[separator + 1], args.slice(separator + 2))
      : await connectReference("pa", lang);
  const result = await runChecks(connection.client, { caseId, lang });
  console.log(
    `${t(lang, "check_ok")} · ${result.tools} ${t(lang, "tools")} · ${caseId} · ${result.pagesChecked} ${t(lang, "pages")}`,
  );
} catch (error) {
  let message = error.message;
  for (const value of headerValues)
    message = message.replaceAll(value, "[redacted]");
  console.error(`${t(lang, "check_fail")}: ${message}`);
  process.exitCode = 1;
} finally {
  if (connection) await connection.close();
}
