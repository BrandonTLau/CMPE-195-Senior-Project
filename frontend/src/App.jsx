import { useState } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import UserDashboard from "./UserDashboard";
import { runOcr } from "./api/ocrClient";

function App() {
  const [screen, setScreen] = useState("landing");

  // OCR job state
  const [processingState, setProcessingState] = useState({
    status: "idle", // idle | processing | error
    message: "",
    error: "",
  });

  const [ocrResult, setOcrResult] = useState(null);

  const resetOcrState = () => {
    setOcrResult(null);
    setProcessingState({ status: "idle", message: "", error: "" });
  };

  const handleNewScan = () => {
    resetOcrState();
    setScreen("dashboard_upload");
  };

  const handleProcessFile = async (file) => {
    if (!file) return;

    setOcrResult(null);
    setProcessingState({
      status: "processing",
      message: "Uploading and running OCR…",
      error: "",
    });

    // Show processing screen
    setScreen("processing");

    try {
      const data = await runOcr(file);
      setOcrResult(data);
      setProcessingState({ status: "idle", message: "", error: "" });
      setScreen("results");
    } catch (err) {
      setProcessingState({
        status: "error",
        message: "",
        error: String(err?.message || err),
      });
      // Stay on processing screen
      setScreen("processing");
    }
  };

  return (
    <>
      {screen === "landing" && (
        <LandingPage
          onStart={() => setScreen("login")}
          onSignIn={() => setScreen("login")}
        />
      )}

      {screen === "login" && (
        <LoginPage
          onBack={() => setScreen("landing")}
          onLoginSuccess={() => setScreen("dashboard")}
        />
      )}

      {/* Dashboard Home */}
      {screen === "dashboard" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={false}
          onLogout={() => {
            resetOcrState();
            setScreen("landing");
          }}
          onNewScan={handleNewScan}
        />
      )}

      {/* Dashboard Upload (embedded) */}
      {screen === "dashboard_upload" && (
        <UserDashboard
          showUploadPage={true}
          showProcessingPage={false}
          showResultsPage={false}
          onLogout={() => {
            resetOcrState();
            setScreen("landing");
          }}
          onNewScan={handleNewScan}
          onProcess={handleProcessFile}
        />
      )}

      {/* Dashboard Processing (embedded) */}
      {screen === "processing" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={true}
          showResultsPage={false}
          onLogout={() => {
            resetOcrState();
            setScreen("landing");
          }}
          onNewScan={handleNewScan}
          onCancelProcessing={() => setScreen("dashboard_upload")}
          processingState={processingState}
        />
      )}

      {/* Dashboard Results (embedded) */}
      {screen === "results" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={true}
          onLogout={() => {
            resetOcrState();
            setScreen("landing");
          }}
          onNewScan={handleNewScan}
          ocrResult={ocrResult}
        />
      )}
    </>
  );
}

export default App;
