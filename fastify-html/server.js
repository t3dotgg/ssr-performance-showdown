#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import Fastify from "fastify";

import { Worker } from "worker_threads";

import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NUM_WORKERS = 12;
const workers = [];

// Create a pool of workers
for (let i = 0; i < NUM_WORKERS; i++) {
  const worker = new Worker(join(__dirname, "worker.js"), { type: "module" });
  worker.setMaxListeners(0); // Remove the limit on listeners
  workers.push(worker);
}

let currentWorker = 0;

export async function main() {
  const server = Fastify();

  server.get("/", (req, reply) => {
    const worker = workers[currentWorker];
    currentWorker = (currentWorker + 1) % NUM_WORKERS;

    const messageHandler = (html) => {
      reply.header("Content-Type", "text/html; charset=utf-8").send(html);
      worker.removeListener("message", messageHandler);
    };

    worker.on("message", messageHandler);

    // Start the worker
    worker.postMessage("start");
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await main();
  await server.listen({ port: 3000 });
}
