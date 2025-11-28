import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Helmet Provider MUST wrap the entire application for SEO */}
    
      <BrowserRouter>
        <App />
      </BrowserRouter>
    
  </React.StrictMode>
);
