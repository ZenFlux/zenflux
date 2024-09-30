"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var app_1 = require("@zenflux/app-budget-allocation/src/app");
require("@zenflux/app-budget-allocation/src/index.scss");
client_1.default.createRoot(document.getElementById("root")).render(
// <React.StrictMode>
<app_1.default />
// </React.StrictMode>,
);
