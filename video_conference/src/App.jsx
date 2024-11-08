import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Video from "./Components/Videos";
import LobbyScreen from "./Components/Create";
import Join from "./Components/Join";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/join" element={<Join />} />
        <Route path="/room/:roomId" element={<Video />} />
      </Routes>
    </Router>
  );
}

export default App;
