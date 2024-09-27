import React from "react";

import CartIcon from "@zenflux/app-shop-catalog/src/assets/icons/shopping-cart-icon";

import Layout from "@zenflux/app-shop-catalog/src/ui/layout/layout";

import Navbar from "@zenflux/app-shop-catalog/src/ui/navbar/navbar";

import Catalog from "@zenflux/app-shop-catalog/src/components/catalog/catalog";

import Sidebar from "@zenflux/app-shop-catalog/src/ui/sidebar/sidebar";

import "@zenflux/app-shop-catalog/src/app/app.scss";

import type { LayoutProps } from "@zenflux/app-shop-catalog/src/ui/layout/layout";

function AppHeader( { onCartClick }: { onCartClick: () => void } ) {
    return (
            <Navbar
                    brand="shop-catalog"
                    end={ (
                            <div onClick={ onCartClick }
                                 className="cart scale-x-[-1] select-none cursor-pointer">
                                <CartIcon classNames={ [
                                    "w-[100%] h-auto",
                                    "transition-all duration-300",
                                    "hover:scale-110"
                                ] }/>
                            </div>
                    ) }
            />
    );
}

function AppSidebar( { isOpen }: { isOpen: boolean } ) {
    return (
            <Sidebar isOpen={ isOpen } classNames={ [
                "bg-white",
                "transform-translate-x-full transition-transform",
                "duration-300 ease-in-out"
            ] }>
                <h1>Hi</h1>
            </Sidebar>
    );
}

function App() {
    const [ sidebarState, setSidebarState ] = React.useState( false );

    const toggleSidebarState = () => setSidebarState( ! sidebarState );

    const CatalogMemo = React.useMemo( () => <Catalog />, [ true ] );

    const layoutProps: Omit<LayoutProps, "children"> = {
        id: "app",
        header: <AppHeader onCartClick={ toggleSidebarState }/>,
        sidebar: <AppSidebar isOpen={ sidebarState }/>,
        overlay: {
            isVisible: sidebarState,
            onClick: toggleSidebarState,
            classNames: [
                "fixed",
                "w-full h-full",
                "top-0 left-0 right-0 bottom-0",
                "bg-white bg-opacity-60",
                "transition-opacity duration-500 ease-in-out"
            ]
        }
    };

    return (
            <Layout { ... layoutProps }>
                {CatalogMemo}
            </Layout>
    );
}

export default App;

