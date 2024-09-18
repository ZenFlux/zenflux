"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
require("@zenflux/app-budget-allocation/src/ui-layout/_layout.scss");
var header_1 = require("@zenflux/app-budget-allocation/src/ui-layout/header");
function Layout(props) {
    return (<div className="layout">
            <header_1.default {...props.header}/>

            <div className="content">
                {props.children}
            </div>
        </div>);
}
exports.default = Layout;
