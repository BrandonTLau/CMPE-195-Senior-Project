import { useState } from "react";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import UserDashboard from "./UserDashboard";
import SignUp from "./SignUp";

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
        />
      )}

      
      {screen === "results" && (
        <UserDashboard
          showUploadPage={false}
          showProcessingPage={false}
          showResultsPage={true}
          onLogout={() => setScreen("landing")}
          onNewScan={() => setScreen("dashboard_upload")}
        />
      )}

      {screen === "signup" && (
        <SignUp
        onBack={() => setScreen("login")}
        onSignUpSuccess={() => setScreen("dashboard")}
        />
      )}


    </>
  );
}

export default App;
