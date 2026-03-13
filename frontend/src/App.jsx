import { useState } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import UserDashboard from "./UserDashboard";
import SignUp from "./SignUp";
import ResultsPage from "./ResultsPage";

function App() {
  const [screen, setScreen] = useState("landing");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [dashboardInitialTab, setDashboardInitialTab] = useState(null);

  const handleNoteSelect = (id) => {
    setSelectedNoteId(id);
    setScreen("note_results");
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
          onGoToSignUp={() => setScreen("signup")}
        />
      )}

      {screen === "dashboard" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onNoteSelect={handleNoteSelect}
          initialTab={dashboardInitialTab}
          onInitialTabConsumed={() => setDashboardInitialTab(null)}
        />
      )}

      {screen === "dashboard_upload" && (
        <UserDashboard
          showUploadPage={true}
          showProcessingPage={false}
          showResultsPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onProcess={() => setScreen("processing")}
          onNoteSelect={handleNoteSelect}
        />
      )}

      {screen === "processing" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={true}
          showResultsPage={false}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onFinishProcessing={() => setScreen("results")}
          onNoteSelect={handleNoteSelect}
        />
      )}

      {screen === "results" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={true}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
          onNoteSelect={handleNoteSelect}
        />
      )}

      {screen === "signup" && (
        <SignUp
          onBack={() => setScreen("login")}
          onSignUpSuccess={() => setScreen("dashboard")}
        />
      )}

      {screen === "note_results" && (
        <ResultsPage
          noteId={selectedNoteId}
          onBack={() => {
            setDashboardInitialTab("notes");
            setScreen("dashboard");
          }}
          onNewScan={() => setScreen("dashboard_upload")}
          onLogout={() => setScreen("landing")}
        />
      )}
    </>
  );
}

export default App;

