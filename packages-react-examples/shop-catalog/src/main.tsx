import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@zenflux/app-shop-catalog/src/app/app";

import "@zenflux/app-shop-catalog/src/index.scss";

createRoot( document.getElementById( "root" )! ).render(
        <StrictMode>
            <App/>
        </StrictMode>,
);
