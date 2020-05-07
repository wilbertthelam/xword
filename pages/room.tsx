import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import io from "socket.io-client";

function Room() {
  const socket = io();
  const [initialBoardState, setInitialBoardState] = useState("");

  // Initialization listeners setup
  useEffect(() => {
    // Retrieve the initial board state based on the current game
    socket.on("initial-guess-state", (data) => {
      console.log("initial guess state recieved: ", data.state);
      setInitialBoardState(data.state);
    });
    return () => socket.off("initial-guess-state");
  }, [socket]);

  // Hold off generating game until we get initial states
  if (!initialBoardState) {
    return null;
  }

  return (
    <GameContainer socket={socket} initialBoardState={initialBoardState} />
  );
}

// Wrapper that lazy loads the crossword component, we use this to avoid
// sserver side rendering (SSR) since this component is browser only (needs access to window)
const GameContainer = dynamic(() => import("./components/game-container"), {
  ssr: false,
});

export default Room;
