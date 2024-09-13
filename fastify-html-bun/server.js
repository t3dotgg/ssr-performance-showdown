import { fileURLToPath } from "node:url";
import Fastify from "fastify";

const NUM_WORKERS = 12;
const workers = [];

export async function main() {
  const server = Fastify();

  server.get("/", (req, reply) => {
    const worker = new Worker("./worker.js");

    worker.addEventListener("message", (event) => {
      reply.header("Content-Type", "text/html; charset=utf-8").send(event.data);

      worker.terminate();
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
