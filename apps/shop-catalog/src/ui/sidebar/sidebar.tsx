import React from "react";

import "@zenflux/app-shop-catalog/src/ui/sidebar/sidebar.scss";

import type { DClassNamesProps } from "@zenflux/app-shop-catalog/src/definitions";

interface SidebarProps extends DClassNamesProps {
    isOpen?: boolean;

    children: React.ReactNode;
}

export default function Sidebar( { isOpen, children, classNames = [] }: SidebarProps ) {
    classNames = [
        "sidebar",
            isOpen ? "sidebar--open" : "sidebar--closed",
        ... classNames
    ];

    return <div className={ classNames.join( " " ) }>
        { children }
    </div>;
}
