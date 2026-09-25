#!/usr/bin/env node
import { runReferenceServer } from "../src/server.js";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

runReferenceServer({
  system: option("--system", "pa"),
  lang: option("--lang", "fr"),
}).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
