const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000
app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    const name = String(username || "").trim().slice(0, 20);
    if (!name) return;

    users.set(socket.id, name);
    io.emit("users-update", Array.from(users.values()));

    socket.broadcast.emit("system-message", {
      text: `${name} joined the chat`,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on("send-message", (text) => {
    const name = users.get(socket.id) || "Anonymous";
    const message = String(text || "").trim();
    if (!message) return;

    io.emit("receive-message", {
      text: message,
      username: name,
      senderId: socket.id,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    users.delete(socket.id);
    io.emit("users-update", Array.from(users.values()));

    if (name) {
      io.emit("system-message", {
        text: `${name} left the chat`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
