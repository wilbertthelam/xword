import { Server } from "socket.io";
import asyncRedis from "./utils/async-redis";
import {
  generateGameCacheKey,
  generateGameUserListCacheKey,
  generateUserCacheKey,
  generateUserSocketCacheKey,
} from "./cache-keys";

// Right now let's just hardcode all routes to have a gameUUID
// of 04f4520b-bf8b-4445-9500-1e5c8eb8565a
const gameUUID = "04f4520b-bf8b-4445-9500-1e5c8eb8565a";

type User = {
  userUUID: string;
  userName: string;
};

export default class SocketServer {
  private io: Server;
  // Async redis client, async wrapper around some Redis client methods
  private redis;

  constructor(server, redisClient) {
    this.io = require("socket.io")(server);
    this.redis = asyncRedis(redisClient);

    this.initClientHandshake();
  }

  // Initialize a single client connection
  private initClientHandshake() {
    this.io.on("connection", (socket) => {
      console.log("a user connected: ", socket.id);

      this.emitInitialBoardState(socket);
      this.registerDisconnect(socket);
      this.registerGuess(socket);
      this.registerRegisterUser(socket);
    });
  }

  private async emitInitialBoardState(socket) {
    try {
      const response = await this.redis.get(generateGameCacheKey(gameUUID));
      console.log("initial response: ", response);
      this.emitInitialGuessState(socket, response, false);
    } catch (error) {
      console.log("initial board state error: ", error);
    }
  }

  private registerDisconnect(socket) {
    socket.on("disconnect", () => {
      console.log("a user disconnected");
    });
  }

  private async registerRegisterUser(socket) {
    socket.on("register-user", async (data) => {
      console.log("user object", data);
      this.updateUser(
        socket.id,
        data?.user?.uuid || "",
        data?.user?.name || ""
      );

      try {
        const users = await this.getUsersFromGame(gameUUID);
        console.log("game users: ", users);
        // Map response to the client User object
        const mappedUsers = users.map((user: User) => {
          return {
            name: user.userName,
            uuid: user.userUUID,
          };
        });
        // Tell other players (and yourself) in the game about new/updated user
        this.io.emit("users", this.enhanceData(mappedUsers));
      } catch (error) {}
    });
  }

  private async getUsersFromGame(gameUUID: string) {
    // For each user in the game, get the user information associated with the userUUID
    try {
      const userUUIDsList = await this.redis.smembers(
        generateGameUserListCacheKey(gameUUID)
      );
      console.log("userUUIDsList: ", userUUIDsList);
      const users = await Promise.all(
        userUUIDsList.map((userUUID) =>
          this.redis.hgetall(generateUserCacheKey(userUUID))
        )
      );
      return users;
    } catch (error) {
      console.error("could not get user list: ", error);
    }
  }

  private updateUser(socketID: string, userUUID: string, userName: string) {
    // socketID -> userUUID
    // All requests need to all come with a userUUID
    // userUUID is mapped to the local storage, so all browser
    // tabs and windows will share the same userUUID,
    // but they will have different socketIDs since these are different connections
    // Add user to the game in the Redis store
    // For now, all setters can be done asyncronously
    console.log(
      `update user with socketID: ${socketID} with userUUID: ${userUUID} and userName: ${userName}`
    );

    // Associate the socketID and the userUUID
    this.redis.set(generateUserSocketCacheKey(socketID), userUUID);

    // Create the user hash map with user details
    this.redis.hmset(generateUserCacheKey(userUUID), [
      "userName",
      userName,
      "userUUID",
      userUUID,
    ]);

    // Add user to the game user list
    this.redis.sadd(generateGameUserListCacheKey(gameUUID), userUUID);
  }

  private registerGuess(socket): void {
    socket.on("guess", async (data) => {
      console.log("user guess object", data);

      // Add board state to the Redis store
      // Use key gamestate:[gameUUID] => string(boardstate)
      try {
        await this.redis.set(generateGameCacheKey(gameUUID), data);
        // Broadcast to other users in the game
        this.emitGuessState(socket, data, true);
      } catch (error) {
        // TODO: handle some error
      }
    });
  }

  private emitGuessState(socket, data, broadcast: boolean): void {
    const formattedData = this.enhanceData(data);
    // TODO: broadcast to only a subset of users
    if (broadcast) {
      socket.broadcast.emit("guess-state", formattedData);
    } else {
      socket.emit("guess-state", formattedData);
    }
  }

  // TODO: dedupe with above function
  private emitInitialGuessState(socket, data, broadcast: boolean): void {
    const formattedData = this.enhanceData(data);
    // TODO: broadcast to only a subset of users
    if (broadcast) {
      socket.broadcast.emit("initial-guess-state", formattedData);
    } else {
      socket.emit("initial-guess-state", formattedData);
    }
  }

  private enhanceData(data) {
    return {
      state: data,
    };
  }
}
