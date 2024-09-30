import React from "react";

import "@zenflux/app-shop-catalog/src/ui/layout/layout.scss";

export interface LayoutProps {
    id?: string;
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
    overlay?: {
        isVisible?: boolean;
        classNames?: string[];
        onClick?: ( e?: React.MouseEvent ) => void;
    };

    children: React.ReactNode;
}

function Layout( { id, header, sidebar, overlay, children }: LayoutProps ) {
    return (
            <div { ... { id } } className="layout">
                { header && <header className="layout__header">
                    { header }
                </header> }

                { sidebar && <aside className="layout__sidebar">
                    { sidebar }
                </aside> }

                <main className="layout__content">
                    { children }
                </main>

                { overlay && <div
                        onClick={ overlay.onClick ?? (() => {}) }
                        className={ `${ [
                                "layout__overlay",
                                overlay.isVisible ? "layout__overlay--visible" : "layout__overlay--invisible",
                            ... overlay.classNames ?? []
                        ].join( " " ) }` }
                >
                </div> }
            </div>
    );

}

export default React.memo( Layout );
