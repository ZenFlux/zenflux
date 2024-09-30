import React from "react";

import "@zenflux/app-shop-catalog/src/ui/navbar/navbar.scss";

interface NavbarProps {
    brand?: string;
    end?: React.ReactNode;
}

export default function Navbar( { brand, end }: NavbarProps ) {
    return (
            <div className="navbar">
                <nav>
                    { brand && <div className="navbar__brand">
                        <h1>{ brand }</h1>
                    </div>}
                    { end && <div className="navbar__end">{ end }</div>}
                </nav>
            </div>
    );
}
