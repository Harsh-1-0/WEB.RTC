import React, { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";

const LobbyScreen = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    // Remove any stored name and roomId from localStorage
    localStorage.removeItem("name");
    localStorage.removeItem("roomId");
  }, []);

  const handleCreateCall = (e) => {
    e.preventDefault();
    const newRoomId = uuid();
    saveNameAndRedirect(newRoomId);
  };

  const handleJoinCall = (e) => {
    e.preventDefault();
    const inputRoomId = e.target.roomId.value.trim();
    const newRoomId = inputRoomId || uuid();
    saveNameAndRedirect(newRoomId);
  };
  
  const saveNameAndRedirect = (roomId) => {
    if (name) {
      localStorage.setItem("name", name);
    }
    localStorage.setItem("roomId", roomId);
    window.location.href = `/room/${roomId}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-8">Join or Create a Call</h1>
      <div className="space-y-4">
        <form onSubmit={handleCreateCall} className="flex flex-col space-y-2">
          <label htmlFor="name" className="text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            placeholder="Enter your Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Create Call
          </button>
        </form>

        <form onSubmit={handleJoinCall} className="flex flex-col space-y-2">
          <label htmlFor="roomId" className="text-gray-700">
            Room ID
          </label>
          <input
            type="text"
            id="roomId"
            name="roomId"
            placeholder="Enter Room ID"
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Join Call
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
