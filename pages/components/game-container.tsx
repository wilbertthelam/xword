import { useEffect, useState } from "react";
import Head from "next/head";
import { useStyletron } from "styletron-react";
import { v4 as uuidv4 } from "uuid";
import { Modal, Button } from "semantic-ui-react";
import { Input } from "semantic-ui-react";
import Crossword from "./crossword";
import SocketIOClient from "socket.io-client";

// Key used to map the logged in userUUID in local storage
const userKey = "xword-user-key";

export type User = {
  name: string;
  uuid: string;
};

type GameControllerProps = {
  socket: SocketIOClient.Emitter;
  initialBoardState: string;
};

function loadUserUUID() {
  //@ts-ignore window is not actually undefined
  // I don't care enough to find a window interface
  const { localStorage } = window;
  if (!localStorage) {
    return;
  }

  // Retrieve and return game key
  const storedUserUUID = localStorage.getItem(userKey);
  if (storedUserUUID) {
    return storedUserUUID;
  }

  // Generate new uuid if one does not exist yet,
  // and store in local storage
  const newStoredUserUUID = uuidv4();
  localStorage.setItem(userKey, newStoredUserUUID);
  return newStoredUserUUID;
}

export default function GameContainer({
  socket,
  initialBoardState,
}: GameControllerProps) {
  const [css] = useStyletron();
  const [user, setUser] = useState({
    name: "",
    uuid: loadUserUUID(),
  });
  const [users, setUsers] = useState([]);
  useEffect(() => {
    socket.on("users", (data) => {
      console.log("users: ", data.state);
      setUsers(data.state);
    });
  });

  // Decide whether to show or not show the user name prompt
  const usernamePrompt = !user.name ? (
    <UsernamePrompt setUser={setUser} socket={socket} />
  ) : undefined;

  const usersList = users.map((item: User) => {
    const identifierText = user.uuid === item.uuid ? " (you)" : "";
    return (
      <div key={item.uuid}>
        {item.name} {identifierText}
      </div>
    );
  });

  return (
    <>
      <Head>
        <title>MUPX Room</title>
      </Head>
      {usernamePrompt}
      <div
        className={css({
          width: "300px",
        })}
      >
        <div>This will be the xword room</div>
        <Crossword
          socket={socket}
          user={user}
          initialBoardState={initialBoardState}
        />
        <div>Scrubs currently in game: {usersList} </div>
      </div>
    </>
  );
}

// Prompt modal that asks a user for a username
function UsernamePrompt({ setUser, socket }) {
  const [modalOpen, setModalOpen] = useState(true);
  const [name, setName] = useState("");

  const submitUsername = () => {
    let user;
    // Update the user state with the new/existing uuid
    setUser((prevState) => {
      user = { ...prevState, ...{ name } };
      return user;
    });
    setName("");
    setModalOpen(false);

    // After creating user, send server the current user information mapped to this socket
    if (user.name) {
      socket.emit("register-user", { user });
    }
  };

  return (
    <Modal open={modalOpen} dimmer={"blurring"} size={"tiny"}>
      <Modal.Content>
        <Modal.Description>
          <Input
            fluid
            placeholder="What's your name?"
            onChange={(event) => setName(event.target.value)}
            action={{
              color: "teal",
              labelPosition: "right",
              icon: "checkmark",
              content: "Let's play",
              onClick: submitUsername,
            }}
            focus
            onKeyUp={(event) => {
              // On enter key
              if (event.keyCode === 13) {
                submitUsername();
              }
            }}
          />
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
}
