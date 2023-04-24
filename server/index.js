const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());
app.options("*", cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  let currentRoom;
  let currentUser;

  socket.on("join_room", (data) => {
    const { room, username } = data;
    currentRoom = room;
    currentUser = username;
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
    socket.to(room).emit("user_joined", {
      message: `${username} has joined the room`,
      time:
        new Date(Date.now()).getHours() +
        ":" +
        new Date(Date.now()).getMinutes(),
      author: "System",
    });
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    socket.to(currentRoom).emit("user_left", {
      message: `${currentUser} has left the room`,
      time:
        new Date(Date.now()).getHours() +
        ":" +
        new Date(Date.now()).getMinutes(),
      author: "System",
    });
  });
});


server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
