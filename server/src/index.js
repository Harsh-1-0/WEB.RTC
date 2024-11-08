import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const port = 5500;
const app = express();
const server = createServer(app);

app.get("/", (req, res) => {
  res.status(200).send("Heart is Beating");
});
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://webrtc-khaki-nu.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Handle user joining a room with a limit of 2 clients
  socket.on("join", ({ roomId, name }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;

    if (numClients < 2) {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId} with name ${name}`);

      // Store the name of the joining user for future use
      socket.data.name = name;

      // Notify other users in the room about the new user's name
      socket.to(roomId).emit("user-joined", { name, id: socket.id });

      // If there’s an existing user in the room, send their name to the new user
      if (numClients === 1) {
        const [existingSocketId] = room;
        const existingSocket = io.sockets.sockets.get(existingSocketId);

        // Send the existing user's name to the new user
        if (existingSocket && existingSocket.data.name) {
          socket.emit("user-joined", {
            name: existingSocket.data.name,
            id: existingSocketId,
          });
        }
      }
    } else {
      socket.emit("room_full", { roomId, socketId: socket.id });
      console.log(
        `Room ${roomId} is full. ${socket.id} was not allowed to join.`
      );
    }
  });

  // When one peer sends an offer
  socket.on("offer", ({ offer, to }) => {
    console.log("Sending offer to:", to);
    socket.to(to).emit("offer", { offer, from: socket.id });
  });

  // When one peer sends an answer
  socket.on("answer", ({ answer, to }) => {
    console.log("Sending answer to:", to);
    socket.to(to).emit("answer", { answer, from: socket.id });
  });

  // When one peer sends an ICE candidate
  socket.on("ice-candidate", ({ candidate, to }) => {
    console.log("Sending ICE candidate to:", to);
    socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Handle screen sharing events
  socket.on("screen-share", ({ stream, to }) => {
    console.log(`Sending screen share stream to: ${to}`);
    socket.to(to).emit("screen-share", { stream, from: socket.id });
  });
});

server.listen(port, () => {
  console.log("Server is running on port", port);
});
