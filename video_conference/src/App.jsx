import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Video from "./Components/Videos";
import LobbyScreen from "./Components/Create";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:roomId" element={<Video />} />
      </Routes>
    </Router>
  );
}

export default App;
