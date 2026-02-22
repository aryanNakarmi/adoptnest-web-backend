import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let io: Server;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware: authenticate socket connection via JWT
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`Socket connected: ${socket.id} | user: ${user?.id} | role: ${user?.role}`);

    // Client joins their chat room
    // User joins their own chatId, admin joins any chatId they open
    socket.on("join_chat", (chatId: string) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room: ${chatId}`);
    });

    socket.on("leave_chat", (chatId: string) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left room: ${chatId}`);
    });

    // Typing indicators
    socket.on("typing", (chatId: string) => {
      socket.to(chatId).emit("user_typing", { userId: user?.id, chatId });
    });

    socket.on("stop_typing", (chatId: string) => {
      socket.to(chatId).emit("user_stop_typing", { userId: user?.id, chatId });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Get the io instance anywhere in the app
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};
