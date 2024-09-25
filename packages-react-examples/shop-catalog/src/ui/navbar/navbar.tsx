import CartIcon from "@zenflux/app-shop-catalog/src/ui/icons/shopping-cart-icon";

import "@zenflux/app-shop-catalog/src/ui/navbar/navbar.scss";

export default function Navbar() {
    return (
            <div className="navbar">
                <nav>
                    <div className="navbar__brand">
                        <h1>Shop Catalog</h1>
                    </div>

                    <div className="navbar__end">
                        <div className="navbar__cart">
                            <CartIcon/>
                        </div>
                    </div>
                </nav>
            </div>
    );
}
