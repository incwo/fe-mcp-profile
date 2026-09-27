import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { fileURLToPath } from "node:url";
import { t } from "./i18n.js";
import { PROFILE_VERSION } from "./profile.js";

const serverPath = fileURLToPath(new URL("../bin/server.js", import.meta.url));

export async function connectReference(system, lang = "fr") {
  return connectCommand(process.execPath, [
    serverPath,
    "--system",
    system,
    "--lang",
    lang,
  ]);
}

export async function connectCommand(command, args = []) {
  const client = new Client({
    name: "fe-mcp-profile-client",
    version: PROFILE_VERSION,
  });
  const transport = new StdioClientTransport({ command, args });
  await client.connect(transport);
  return { client, close: () => client.close() };
}

export async function connectHttp(url, headers = {}, lang = "fr") {
  const endpoint = new URL(url);
  if (!["https:", "http:"].includes(endpoint.protocol))
    throw new TypeError(t(lang, "unsupported_protocol"));
  if (
    endpoint.protocol === "http:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname) &&
    Object.keys(headers).length
  )
    throw new TypeError(t(lang, "insecure_header_transport"));
  const client = new Client({
    name: "fe-mcp-profile-client",
    version: PROFILE_VERSION,
  });
  const transport = new StreamableHTTPClientTransport(endpoint, {
    requestInit: { headers },
  });
  await client.connect(transport);
  return { client, close: () => client.close() };
}

export async function call(client, name, args, lang = "fr") {
  const response = await client.callTool({ name, arguments: args });
  if (response.isError) {
    const error = new Error(response.content?.[0]?.text || name);
    error.code = response._meta?.["fe-mcp/error"]?.code;
    throw error;
  }
  if (!response.structuredContent)
    throw new Error(`${name}: ${t(lang, "missing_content")}`);
  return response.structuredContent;
}
