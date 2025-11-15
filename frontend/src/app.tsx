// frontend/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudioDashboard from "./pages/StudioDashboard";
import AssistantPage from "./pages/AssistantPage"; // we'll create this next

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudioDashboard />} />
        <Route path="/assistants/:assistantId" element={<AssistantPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
