import { useState } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import UserDashboard from "./UserDashboard";
import ProcessingPage from "./ProcessingPage";
import ResultsPage from "./ResultsPage";

function App() {
  const [screen, setScreen] = useState("landing");

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

      
      {screen === "dashboard" && (
        <UserDashboard
          showUploadPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
        />
      )}

      
      {screen === "dashboard_upload" && (
        <UserDashboard
          showUploadPage={true}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onProcess={() => setScreen("processing")}
        />
      )}

      
      {screen === "processing" && (
        <ProcessingPage onFinish={() => setScreen("results")} />
      )}

      
      {screen === "results" && (
        <ResultsPage onBack={() => setScreen("dashboard")} />
      )}
    </>
  );
}

export default App;
