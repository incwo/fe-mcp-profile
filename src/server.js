import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  DESCRIPTIONS,
  PROFILE_VERSION,
  TOOL_NAMES,
  TOOL_SCHEMAS,
} from "./profile.js";
import {
  INVOICE_RESOURCE_TEXT,
  INVOICE_RESOURCE_URI,
  ReferenceStore,
} from "./reference.js";
import { language } from "./i18n.js";

export function makeServer(store) {
  const server = new McpServer({
    name: `fe-mcp-reference-${store.system}`,
    version: PROFILE_VERSION,
  });
  if (store.system === "pa")
    server.registerResource(
      "synthetic-invoice-snapshot",
      INVOICE_RESOURCE_URI,
      {
        description: DESCRIPTIONS[store.lang].fe_get_invoice_case,
        mimeType: "application/json",
      },
      (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: INVOICE_RESOURCE_TEXT,
          },
        ],
      }),
    );
  const handlers = {
    fe_find_invoices: (args) => store.find(args),
    fe_get_invoice_case: (args) => store.get(args.case_id),
    fe_check_invoice: (args) => store.check(args.case_id),
    fe_get_available_actions: (args) => store.available(args.case_id),
    fe_prepare_action: (args) => store.prepare(args),
    fe_execute_action: (args) => store.execute(args),
  };
  for (const name of TOOL_NAMES) {
    server.registerTool(
      name,
      {
        description: DESCRIPTIONS[store.lang][name],
        inputSchema: TOOL_SCHEMAS[name].input,
        outputSchema: TOOL_SCHEMAS[name].output,
        annotations: {
          readOnlyHint: !["fe_prepare_action", "fe_execute_action"].includes(
            name,
          ),
          destructiveHint: false,
          idempotentHint: name !== "fe_prepare_action",
          openWorldHint: false,
        },
      },
      async (args) => {
        try {
          const structuredContent = handlers[name](args);
          return {
            content: [
              { type: "text", text: JSON.stringify(structuredContent) },
            ],
            structuredContent,
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: error.message }],
          };
        }
      },
    );
  }
  return server;
}

export async function runReferenceServer({ system = "pa", lang = "fr" } = {}) {
  const store = new ReferenceStore({
    system,
    lang: language(lang),
    writesEnabled: process.env.FE_DEMO_WRITES === "1",
    approvalCode: process.env.FE_DEMO_APPROVAL_CODE || "",
  });
  const server = makeServer(store);
  await server.connect(new StdioServerTransport());
}
