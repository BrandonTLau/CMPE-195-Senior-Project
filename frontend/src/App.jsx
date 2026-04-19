import { useState } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import UserDashboard from "./UserDashboard";
import SignUp from "./SignUp";
import ResultsPage from "./ResultsPage";

function App() {
  const [screen, setScreen] = useState(() => sessionStorage.getItem('screen') || 'landing');
  const [selectedNoteId, setSelectedNoteId] = useState(() => sessionStorage.getItem('selectedNoteId') || null);
  const [dashboardInitialTab, setDashboardInitialTab] = useState(null);

  const navigate = (s) => {
    sessionStorage.setItem('screen', s);
    setScreen(s);
  };

  const handleNoteSelect = (id) => {
    sessionStorage.setItem('selectedNoteId', id);
    setSelectedNoteId(id);
    navigate("note_results");
  };

  return (
    <>
      {screen === "landing" && (
        <LandingPage
          onStart={() => navigate("login")}
          onSignIn={() => navigate("login")}
        />
      )}

      {screen === "login" && (
        <LoginPage
          onBack={() => navigate("landing")}
          onLoginSuccess={() => navigate("dashboard")}
          onGoToSignUp={() => navigate("signup")}
        />
      )}

      {screen === "dashboard" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={false}
          // logout to clear user tokens and info
          //onLogout={() => { sessionStorage.clear(); navigate("landing"); }}
          onLogout={() => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userEmail');
            setScreen('landing');
          }}
          onNewScan={() => navigate("dashboard_upload")}
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
          // logout to clear user tokens and info
          //onLogout={() => { sessionStorage.clear(); navigate("landing"); }}
          onLogout={() => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userEmail');
            setScreen('landing');
          }}
          onNewScan={() => navigate("dashboard_upload")}
          onProcess={() => navigate("results")}
          onNoteSelect={handleNoteSelect}
        />
      )}

      {screen === "results" && (
  <ResultsPage
    onBack={() => navigate("dashboard")}
    onNewScan={() => navigate("dashboard_upload")}
    // logout to clear user tokens and info
    //onLogout={() => { sessionStorage.clear(); navigate("landing"); }}
    onLogout={() => {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userEmail');
      setScreen('landing');
    }}
  />
)}

      {screen === "signup" && (
        <SignUp
          onBack={() => navigate("login")}
          onSignUpSuccess={() => navigate("dashboard")}
        />
      )}

      {screen === "note_results" && (
        <ResultsPage
          noteId={selectedNoteId}
          onBack={() => {
            setDashboardInitialTab("notes");
            navigate("dashboard");
          }}
          onNewScan={() => navigate("dashboard_upload")}
          // logout to clear user tokens and info
          //onLogout={() => { sessionStorage.clear(); navigate("landing"); }}
          onLogout={() => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userEmail');
            setScreen('landing');
          }}
        />
      )}
    </>
  );
}

export default App;
