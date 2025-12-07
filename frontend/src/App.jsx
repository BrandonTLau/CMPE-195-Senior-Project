import { useState } from "react";
import LandingPage from "./LandingPage";
import UploadPage from "./UploadPage";
import ProcessingScreen from "./ProcessingPage"; 
import ResultsScreen from "./ResultsPage";

function App() {
  const [screen, setScreen] = useState("landing");

  return (
    <>
      {/* Landing Page */}
      {screen === "landing" && (
        <LandingPage onStart={() => setScreen("upload")} />
      )}

      {/* Upload Page */}
      {screen === "upload" && (
        <UploadPage
          onBack={() => setScreen("landing")}
          onProcess={() => setScreen("processing")}
        />
      )}

      {/* Processing Page */}
      {screen === "processing" && (
        <ProcessingScreen
          onSkip={() => setScreen("results")}
          onAutoFinish={() => setScreen("results")}
        />
      )}

      {/* Results Page */}
      {screen === "results" && (
        <ResultsScreen
          onBack={() => setScreen("processing")}
        />
      )}
    </>
  );
}

export default App;
