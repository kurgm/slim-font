import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App.tsx";

ReactDOM.createRoot(document.getElementById("react_root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export { setRenderedText } from "./App.tsx";
