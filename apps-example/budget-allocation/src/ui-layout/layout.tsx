import React from "react";

import "@zenflux/app-budget-allocation/src/ui-layout/_layout.scss";

import Header from "@zenflux/app-budget-allocation/src/ui-layout/header";

export interface LayoutProps {
    children?: React.ReactNode;
    header : {
        end: React.ReactNode;
    }
}

export default function Layout( props: LayoutProps ) {
    return (
        <div className="layout">
            <Header { ... props.header } />

            <div className="content">
                { props.children }
            </div>
        </div>
    );
}

