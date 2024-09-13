import { fileURLToPath } from "node:url";
import Fastify from "fastify";

const NUM_WORKERS = 12;
const workers = [];

// Create a pool of workers
for (let i = 0; i < NUM_WORKERS; i++) {
  const worker = new Worker("./worker.js");
  workers.push(worker);
}

let currentWorker = 0;

export async function main() {
  const server = Fastify();

  server.get("/", (req, reply) => {
    const worker = workers[currentWorker];
    currentWorker = (currentWorker + 1) % NUM_WORKERS;

    const listener = (event) => {
      reply.header("Content-Type", "text/html; charset=utf-8").send(event.data);

      worker.removeEventListener("message", listener);
    };

    worker.addEventListener("message", listener);

    // Start the worker
    worker.postMessage("start");
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await main();
  await server.listen({ port: 3000 });
}
