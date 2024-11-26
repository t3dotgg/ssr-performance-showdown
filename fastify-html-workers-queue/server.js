#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import Fastify from "fastify";

import { Worker } from "worker_threads";

import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NUM_WORKERS = 12;

function createWorkerPool() {
  const idleWorkers = [];
  const handlers = [];
  const queue = [];
  for (let i = 0; i < NUM_WORKERS; i++) {
    const workerIdx = i;
    const worker = new Worker(join(__dirname, "worker.js"), { type: "module" });
    idleWorkers.push([workerIdx, worker]);
    handlers.push(undefined)
    worker.on("message", (message) => {
      handlers[workerIdx](message)
      const next = queue.shift();
      if (next) {
        const [nextMessage, nextHandler] = next;
        handlers[workerIdx] = nextHandler;
        worker.postMessage(nextMessage)
      } else {
        handlers[workerIdx] = undefined
        idleWorkers.push([workerIdx, worker])
      }
    })
  }
  return {
    run(message) {
      return new Promise((resolve) => {
        const workerTuple = idleWorkers.pop();
        if (workerTuple) {
          const [workerId, worker] = workerTuple;
          handlers[workerId] = resolve
          worker.postMessage(message)
        } else {
          queue.push([message, resolve])
        }
      })
    }
  }
}

const pool = createWorkerPool()

export async function main() {
  const server = Fastify();

  server.get("/", async (req, reply) => {
    const html = await pool.run("start");
    reply.header("Content-Type", "text/html; charset=utf-8").send(html);
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await main();
  await server.listen({ port: 3000 });
}
