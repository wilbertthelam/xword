// @ts-ignore I'm too lazy to make a type declaration for this
import CrosswordModule from "@wilbertthelam/react-crossword";
import { User } from "./game-container";
import { useEffect, useState } from "react";
const data = {
  across: {
    1: {
      clue: "one plus one",
      answer: "TWO",
      row: 0,
      col: 0,
    },
  },
  down: {
    2: {
      clue: "three minus two",
      answer: "ONE",
      row: 0,
      col: 2,
    },
    3: {
      clue: "four plus one",
      answer: "five",
      row: 1,
      col: 0,
    },
  },
};

type CrosswordProps = {
  socket: SocketIOClient.Emitter;
  user: User;
  initialBoardState: string;
};

export default function Crossword({
  socket,
  user,
  initialBoardState,
}: CrosswordProps) {
  // InitialBoardState is only needed on first load, and will always come in
  // via the first render
  const [guessState, setGuessState] = useState(initialBoardState);
  const onLetterUpdate = (data) => {
    console.log("emitting guess:  ", data);
    socket.emit("guess", JSON.stringify(data));
  };

  useEffect(() => {
    // Listen for board state updates from other users
    socket.on("guess-state", (data) => {
      console.log("guess state recieved: ", data.state);
      setGuessState(data.state);
    });
    return () => socket.off("guess-state");
  }, [socket]);

  return (
    <>
      <div>
        User: {user.name} {user.uuid}
      </div>
      <CrosswordModule
        data={data}
        useStorage={false}
        onLetterUpdate={onLetterUpdate}
        guessState={guessState}
      />
    </>
  );
}
