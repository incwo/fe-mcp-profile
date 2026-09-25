import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { t } from "./i18n.js";

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
    version: "0.1.0",
  });
  const transport = new StdioClientTransport({ command, args });
  await client.connect(transport);
  return { client, close: () => client.close() };
}

export async function call(client, name, args, lang = "fr") {
  const response = await client.callTool({ name, arguments: args });
  if (response.isError) throw new Error(response.content?.[0]?.text || name);
  if (!response.structuredContent)
    throw new Error(`${name}: ${t(lang, "missing_content")}`);
  return response.structuredContent;
}
