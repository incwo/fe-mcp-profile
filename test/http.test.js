import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { makeServer } from "../src/server.js";
import { ReferenceStore } from "../src/reference.js";
import { connectHttp } from "../src/client.js";
import { runChecks } from "../src/conformance.js";

test("HTTP Streamable conformance uses the same read checks and sends authorization", async () => {
  const store = new ReferenceStore({ system: "pa" });
  const app = createMcpExpressApp();
  const requests = [];
  app.post("/mcp", async (req, res) => {
    requests.push(req.get("authorization"));
    if (req.get("authorization") !== "Bearer synthetic-test") {
      res.status(401).end();
      return;
    }
    const server = makeServer(store);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } finally {
      await transport.close();
      await server.close();
    }
  });
  app.get("/mcp", (_req, res) => res.status(405).end());
  app.delete("/mcp", (_req, res) => res.status(405).end());
  const httpServer = app.listen(0, "127.0.0.1");
  await once(httpServer, "listening");
  const url = `http://127.0.0.1:${httpServer.address().port}/mcp`;
  let connection;
  try {
    connection = await connectHttp(url, {
      Authorization: "Bearer synthetic-test",
    });
    const result = await runChecks(connection.client);
    assert.equal(result.pagesChecked, 2);
    const checker = spawn(
      process.execPath,
      [
        fileURLToPath(new URL("../bin/check.js", import.meta.url)),
        "--http",
        url,
        "--header-env",
        "FE_TEST_AUTH_HEADER",
      ],
      {
        env: {
          ...process.env,
          FE_TEST_AUTH_HEADER: "Authorization: Bearer synthetic-test",
        },
      },
    );
    let output = "";
    let errors = "";
    checker.stdout.on("data", (chunk) => {
      output += chunk;
    });
    checker.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    const [exitCode] = await once(checker, "close");
    assert.equal(exitCode, 0, errors);
    assert.match(output, /Profil vérifié/);
    assert.ok(!output.includes("synthetic-test"));
    assert.ok(requests.length > 3);
    assert.ok(requests.every((value) => value === "Bearer synthetic-test"));
    await assert.rejects(() =>
      connectHttp(url, { Authorization: "Bearer wrong" }),
    );
    await assert.rejects(() =>
      connectHttp("http://example.com/mcp", {
        Authorization: "Bearer synthetic-test",
      }),
    );
  } finally {
    if (connection) await connection.close();
    httpServer.close();
    await once(httpServer, "close");
  }
});
