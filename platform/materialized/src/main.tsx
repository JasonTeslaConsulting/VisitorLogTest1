import React from "react";
import { createRoot } from "react-dom/client";
import App from "@framework/App.tsx";
import "./index.css";
import { appConfig } from "@framework/app/appConfig.ts";

async function main() {
  const result = await appConfig.initialize();
  if (!result.success) {
    console.error(result.errorMessage);
    document.body.innerHTML = `<h2>Failed to load app configuration</h2>`;
    return;
  }

  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

main();
