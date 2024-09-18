import React from "react";

import "@zenflux/app-shop-catalog/src/ui/layout/layout.scss";

interface LayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
}

export default function Layout({ children, header }: LayoutProps) {
    return (
            <div className="layout">
                <div className="header">
                    { header }
                </div>
                <div className="content">
                    { children }
                </div>
            </div>
    );

}
