import { v4 as uuid } from "uuid";
function LobbyScreen() {
  function handleSubmit(e) {
    e.preventDefault();
    const roomId = uuid();
    console.log(roomId);
    localStorage.setItem("roomId", roomId);
    window.location.href = `/room/${roomId}`;
  }
  return (
    <>
      <h1>Hello</h1>
      <div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="">Name</label>
          <input type="text" placeholder="Enter your Name" />
          <button>Create Call</button>
        </form>
      </div>
    </>
  );
}

export default LobbyScreen;
