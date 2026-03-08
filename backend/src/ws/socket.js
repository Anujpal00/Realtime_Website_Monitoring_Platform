import { WebSocketServer } from "ws";

let activeWss = null;

export function broadcastEvent(type, payload) {
  if (!activeWss) return;
  const message = JSON.stringify({ type, payload });
  for (const client of activeWss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

export function initWebSocket(server) {
  const path = process.env.WS_PATH || "/ws";
  const wss = new WebSocketServer({ server, path });
  activeWss = wss;

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.send(JSON.stringify({ type: "welcome", payload: { message: "connected" } }));
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
    activeWss = null;
  });

  return wss;
}
