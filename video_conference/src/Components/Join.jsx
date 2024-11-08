import { useState } from "react";

function Join() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !roomId) {
      alert("Please enter both your name and the Room ID.");
      return;
    }

    // Store name and roomId in localStorage
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("name", name);

    // Redirect to the room
    window.location.href = `/room/${roomId}`;
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Join Call</h1>
        <label>Name</label>
        <input
          onChange={(e) => setName(e.target.value)} // Update state on input change
          value={name} // Bind input to state
          type="text"
          placeholder="Enter your name"
          required
        />
        <label>Enter RoomID</label>
        <input
          onChange={(e) => setRoomId(e.target.value)} // Update state on input change
          value={roomId} // Bind input to state
          type="text"
          placeholder="Room ID"
          required
        />
        <button type="submit">Join Call</button>
      </form>
    </div>
  );
}

export default Join;
