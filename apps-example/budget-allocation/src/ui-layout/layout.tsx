import React from "react";

import Header from "@zenflux/app-budget-allocation/src/ui-layout/header";

export interface LayoutProps {
    children?: React.ReactNode;
    header : {
        end: React.ReactNode;
    }
}

export default function Layout( props: LayoutProps ) {
    return (
        <div className="layout max-w-[1440px] mx-auto">
            <Header { ... props.header } />

            <div className="content">
                { props.children }
            </div>
        </div>
    );
}

