import React from "react";
import ReactDOM from "react-dom/client";
import { CalendarDemo } from "../demo/example";
import "./styles/calendar.css";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <div className="demo-header">
        <h1>Eazy Event Calendar</h1>
        <p>
          A headless-first React calendar library with optional styled
          components.
        </p>
      </div>
      <CalendarDemo />
    </React.StrictMode>,
  );
}
