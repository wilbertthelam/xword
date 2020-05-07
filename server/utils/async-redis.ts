// Create promise wrappers around node-redis commands
// to allow async/await usage
import { promisify } from "util";

export default function asyncRedis(redisClient) {
  const redisHelpers = {
    get: promisify(redisClient.get),
    set: promisify(redisClient.set),
    hgetall: promisify(redisClient.hgetall),
    hmset: promisify(redisClient.hmset),
    sadd: promisify(redisClient.sadd),
    smembers: promisify(redisClient.smembers),
  };

  // Bind promises to redisClient scope
  const boundRedis = {};
  Object.entries(redisHelpers).map(([key, value]) => {
    boundRedis[key] = value.bind(redisClient);
  });

  return boundRedis;
}
