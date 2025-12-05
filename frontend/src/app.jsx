// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";


import StudioDashboard from "./pages/StudioDashboard/StudioDashboard";
import AssistantPage from "./pages/Assistantdetails/AssistantPage";
import AppShell from "./layout/AppShell";
import StudioWorkspace from "./pages/StudioWorkspace";
import HomePage from "./pages/HomePage";
import AssistantEditor from "./pages/AssistantEditor/AssistantEditor";



const App = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<StudioDashboard />} />
          <Route path="/assistants/:assistantId" element={<AssistantPage />} />
          <Route path="/studio" element={<StudioWorkspace />} />
          <Route path="/assistant-editor/:assistantId" element={<AssistantEditor />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
    
  );
};

export default App;
