import { createServer } from "http";
import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import { initSocket } from "./socket/socket";

async function startServer() {
 await connectDatabase();
 
 const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.io ready`);
  });
}
startServer();