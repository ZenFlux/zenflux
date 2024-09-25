import React from "react";

import "@zenflux/app-shop-catalog/src/ui/layout/layout.scss";

interface LayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
}

export default function Layout({ children, header, sidebar }: LayoutProps) {
    return (
            <div className="layout">
                { header && <div className="layout__header">
                    { header }
                </div> }
                { sidebar && <div className="layout__sidebar">
                    { sidebar }
                </div> }
                <div className="layout__content">
                    { children }
                </div>
            </div>
    );

}
