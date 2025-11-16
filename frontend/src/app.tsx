// frontend/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";


import StudioDashboard from "./pages/StudioDashboard/StudioDashboard";
import AssistantPage from "./pages/Assistantdetails/AssistantPage"; // we'll create this next
import AppShell from "./layout/AppShell";


const App: React.FC = () => {
  return (
    <AppShell>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudioDashboard />} />
        <Route path="/assistants/:assistantId" element={<AssistantPage />} />
      </Routes>
    </BrowserRouter>
    </AppShell>
    
  );
};

export default App;

