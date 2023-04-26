const express = require("express");
const app = express();
const https = require("https");
const cors = require("cors");
const { Server } = require("socket.io");
const usersInRooms = {};
let typingUsers = {};
app.use(cors());
app.options("*", cors());

const server = https.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
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
    if (!usersInRooms[room]) {
      usersInRooms[room] = [];
    }
    usersInRooms[room].push({ username, id: socket.id });
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
    socket.to(room).emit("user_joined", {
      message: `${username} has joined the room`,
      time:
        new Date(Date.now()).getHours() +
        ":" +
        new Date(Date.now()).getMinutes(),
      author: "System",
    });
    socket.emit("room_users", usersInRooms[room]);
  });

  socket.on("user_typing", (data) => {
    socket.to(data.room).emit("user_typing", data);
  });

  socket.on("user_stopped_typing", (data) => {
    socket.to(data.room).emit("user_stopped_typing", data);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  
    for (const room in usersInRooms) {
      const userIndex = usersInRooms[room].findIndex(
        (user) => user.id === socket.id
      );
  
      if (userIndex !== -1) {
        const username = usersInRooms[room][userIndex].username;
        usersInRooms[room].splice(userIndex, 1);
  
        socket.to(room).emit("user_left", {
          message: `${username} has left the room`,
          time:
            new Date(Date.now()).getHours() +
            ":" +
            new Date(Date.now()).getMinutes(),
          author: "System",
        });
      }
    }
  });
});



server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
