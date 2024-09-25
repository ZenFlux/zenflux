import CartIcon from "@zenflux/app-shop-catalog/src/assets/icons/shopping-cart-icon";

import Layout from "@zenflux/app-shop-catalog/src/ui/layout/layout";
import Navbar from "@zenflux/app-shop-catalog/src/ui/navbar/navbar";
import Catalog from "@zenflux/app-shop-catalog/src/components/catalog/catalog";

import "@zenflux/app-shop-catalog/src/app/app.scss";

function App() {
    const Header = () => <Navbar
            brandName="shop-catalog"
            end={ (
                    <div id="app-navbar-cart">
                        <CartIcon/>
                    </div>
            ) }
    />;

    return (
            <Layout header={ <Header/> }>
                <Catalog/>
            </Layout>
    );
}

export default App;
