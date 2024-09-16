import React from "react";
import ReactDOM from "react-dom/client";

import App from "@zenflux/app-budget-allocation/src/app";

import "@zenflux/app-budget-allocation/src/index.scss";

ReactDOM.createRoot( document.getElementById( "root" )! ).render(
    // <React.StrictMode>
        <App/>
    // </React.StrictMode>,
);

