export function generateGameUserListCacheKey(gameUUID: string): string {
  return `game-users:${gameUUID}`;
}

export function generateUserCacheKey(userUUID: string): string {
  return `user:${userUUID}`;
}

export function generateUserSocketCacheKey(socketID: string): string {
  return `user-socket:${socketID}`;
}

export function generateGameCacheKey(gameUUID: string): string {
  return `game-state:${gameUUID}`;
}
