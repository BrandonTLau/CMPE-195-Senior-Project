import { useState } from "react";
import UploadPage from "./UploadPage";
import LandingPage from "./LandingPage";

function App() {
  const [screen, setScreen] = useState("landing");

  return (
    <>
      {screen === "landing" && (
        <LandingPage onStart={() => setScreen("upload")} />
      )}

      {screen === "upload" && (
        <UploadPage onBack={() => setScreen("landing")} />
      )}
    </>
  );
}

export default App;

