#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyHtml from "fastify-html";
import { createHtmlFunction } from "./client/index.js";

import { Worker } from "worker_threads";

import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function main() {
  const server = Fastify();
  await server.register(fastifyHtml);

  server.addLayout(createHtmlFunction(server));

  server.get("/", (req, reply) => {
    const worker = new Worker(join(__dirname, "worker.js"), { type: "module" });

    worker.on("message", (html) => {
      console.log("HTML?", html);
      reply.html(html);
    });

    worker.on("error", (err) => {
      console.error(err);
      reply.code(500).send("Internal Server Error");
    });

    // Start the worker
    worker.postMessage("start");
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await main();
  await server.listen({ port: 3000 });
}
