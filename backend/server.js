const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast helper — sends to all connected clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// Make broadcast available to routes
app.set("broadcast", broadcast);

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  ws.on("close", () => console.log("WebSocket client disconnected"));
});

const adminRoutes = require("./routes/admin");
const examRoutes = require("./routes/exam");

app.use("/api/admin", adminRoutes);
app.use("/api/exam", examRoutes);

server.listen(5000, () => console.log("Backend running on port 5000"));