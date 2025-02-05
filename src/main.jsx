import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { GroupProvider } from "./context/GroupContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";

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
