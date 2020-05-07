import express, { Request, Response } from "express";
import next from "next";
import SocketServer from "./socket";
import redis from "redis";
import redisConfig from "./redis-config";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const port = process.env.PORT || 3000;

// Instantiate server
(async () => {
  try {
    await nextApp.prepare();
    const app = express();
    const server = require("http").createServer(app);
    const redisClient = redis.createClient(redisConfig);

    redisClient.on("connect", () => {
      console.log("redis server successfully connected");
    });

    // Redis listener for errors
    redisClient.on("error", (error) => {
      console.error("redis server error: ", error);
    });

    // Instantiate Socket.IO websocket server
    new SocketServer(server, redisClient);

    // Catch default Next.js pages (/pages directory)
    app.all("*", (req: Request, res: Response) => {
      return handle(req, res);
    });

    server.listen(port, (err?: any) => {
      if (err) throw err;
      console.log(`ready on localhost:${port} - env ${process.env.NODE_ENV}`);
    });
  } catch (e) {
    console.error("server initiation failed");
    console.error(e);
    process.exit(1);
  }
})();
