import CartIcon from "@zenflux/app-shop-catalog/src/ui/icons/shopping-cart-icon";

import "@zenflux/app-shop-catalog/src/ui/navbar/navbar.scss";

export default function Navbar() {
    return (
            <div className="navbar">
                <nav>
                    <div className="navbar-brand">
                        <h1>Shop Catalog</h1>
                    </div>

                    <div className="navbar-end">
                        <div className="navbar-cart">
                            <CartIcon/>
                        </div>
                    </div>
                </nav>
            </div>
    );
}
