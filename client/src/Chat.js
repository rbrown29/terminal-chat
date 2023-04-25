import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  const handleTyping = (event) => {
    setCurrentMessage(event.target.value);

    if (!typingTimeout) {
      socket.emit("user_typing", { room, username });
      setTypingTimeout(
        setTimeout(() => {
          socket.emit("user_stopped_typing", { room, username });
          setTypingTimeout(null);
        }, 2000)
      );
    } else {
      clearTimeout(typingTimeout);
      setTypingTimeout(
        setTimeout(() => {
          socket.emit("user_stopped_typing", { room, username });
          setTypingTimeout(null);
        }, 2000)
      );
    }
  };


  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("user_joined", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("user_typing", (data) => {
      setTypingUser(data.username);
    });

    socket.on("user_stopped_typing", (data) => {
      setTypingUser("");
    });

    socket.on("user_left", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("room_users", (users) => {
      setMessageList((list) => [
        ...list,
        {
          message: `Users in the room: ${users
            .map((user) => user.username)
            .join(", ")}`,
          time:
            new Date(Date.now()).getHours() +
            ":" +
            new Date(Date.now()).getMinutes(),
          author: "System",
        },
      ]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("room_users");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };

  }, [socket]);


  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Terminal Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, index) => {
            return (
              <div
                key={index}
                className="message"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder={typingUser ? "" : "Message..."}
          onChange={handleTyping}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
        {typingUser && <p className="typing-indicator">{typingUser} is typing...</p>}
      </div>
    </div>
  );
}

export default Chat;
