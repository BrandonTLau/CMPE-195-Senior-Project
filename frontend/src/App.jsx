import { useState } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import UserDashboard from "./UserDashboard";

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

      {/* Dashboard Home */}
      {screen === "dashboard" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
        />
      )}

      {/* Dashboard Upload (embedded) */}
      {screen === "dashboard_upload" && (
        <UserDashboard
          showUploadPage={true}
          showProcessingPage={false}
          showResultsPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onProcess={() => setScreen("processing")}
        />
      )}

      {/* Dashboard Processing (embedded) */}
      {screen === "processing" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={true}
          showResultsPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onFinishProcessing={() => setScreen("results")}
        />
      )}

      {/* Dashboard Results (embedded) */}
      {screen === "results" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={true}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
        />
      )}
    </>
  );
}

export default App;
