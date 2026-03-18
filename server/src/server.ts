import http from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import { env } from "./config/env";

const httpServer = http.createServer(app);

// Socket.IO bootstrap kept intentionally thin for future realtime expansion.
export const io = new SocketServer(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("chat:join", (channel: string) => {
    socket.join(channel);
  });

  socket.on("chat:leave", (channel: string) => {
    socket.leave(channel);
  });
});

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AidLine backend listening on port ${env.PORT}`);
});
