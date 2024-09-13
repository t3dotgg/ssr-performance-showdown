#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import Fastify from "fastify";

import { Worker } from "worker_threads";

import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function main() {
  const server = Fastify();

  server.get("/", (req, reply) => {
    const worker = new Worker(join(__dirname, "worker.js"), { type: "module" });

    worker.on("message", (html) => {
      reply.header("Content-Type", "text/html; charset=utf-8")
        .send(`<!DOCTYPE html>
      <html lang="en">
        <head>
        <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f0f0f0;
          margin: 0;
        }
        #wrapper {
          width: 960px;
          height: 720px;
          position: relative;
          background-color: white;
        }
        .tile {
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: #333;
        }
        </style>
        </head>
        <body>
          ${html}
        </body>
      </html>`);
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
