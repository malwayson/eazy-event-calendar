import React from "react";
import ReactDOM from "react-dom/client";
import { CalendarDemo } from "../demo/example";
import "./styles/calendar.css";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <CalendarDemo />
    </React.StrictMode>,
  );
}
