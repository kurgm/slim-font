import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

createRoot(document.getElementById("react_root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
