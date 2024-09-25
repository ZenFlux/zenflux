import React from "react";

import "@zenflux/app-shop-catalog/src/ui/navbar/navbar.scss";

interface NavbarProps {
    brandName?: string;
    end?: React.ReactNode;
}

export default function Navbar( { brandName, end }: NavbarProps ) {
    return (
            <div className="navbar">
                <nav>
                    { brandName && <div className="navbar__brand">
                        <h1>{ brandName }</h1>
                    </div>}
                    { end && <div className="navbar__end">{ end }</div>}
                </nav>
            </div>
    );
}
