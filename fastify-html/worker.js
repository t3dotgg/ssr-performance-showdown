// worker.js
import { parentPort } from "worker_threads";

import Fastify from "fastify";
import fastifyHtml from "fastify-html";

const server = Fastify();
await server.register(fastifyHtml);

parentPort.on("message", (message) => {
  const wrapperWidth = 960;
  const wrapperHeight = 720;
  const cellSize = 10;
  const centerX = wrapperWidth / 2;
  const centerY = wrapperHeight / 2;

  let angle = 0;
  let radius = 0;

  const tiles = [];
  const step = cellSize;

  let x;
  let y;
  while (radius < Math.min(wrapperWidth, wrapperHeight) / 2) {
    x = centerX + Math.cos(angle) * radius;
    y = centerY + Math.sin(angle) * radius;

    if (
      x >= 0 &&
      x <= wrapperWidth - cellSize &&
      y >= 0 &&
      y <= wrapperHeight - cellSize
    ) {
      tiles.push({ x, y });
    }

    angle += 0.2;
    radius += step * 0.015;
  }

  console.log("we tried");

  const response = server.html(`<div id="wrapper">
    ${tiles.map(({ x, y }) =>
      server.html(`<div
          class="tile"
          style="left: ${x.toFixed(2)}px; top: ${y.toFixed(2)}px"></div>`)
    )}
    </div>`);

  parentPort.postMessage(response);
});
