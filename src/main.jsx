import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { GroupProvider } from "./context/GroupContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <GroupProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GroupProvider>
    </AuthProvider>
  </StrictMode>
);
