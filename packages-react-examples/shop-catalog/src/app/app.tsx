import "@zenflux/app-shop-catalog/src/app/app.scss";
import Layout from "@zenflux/app-shop-catalog/src/ui/layout/layout";
import Navbar from "@zenflux/app-shop-catalog/src/ui/navbar/navbar";
import Catalog from "@zenflux/app-shop-catalog/src/components/catalog/catalog";

function App() {
    const Header = () => <Navbar/>;

    return (
            <Layout header={<Header />}>
                <Catalog />
            </Layout>
    );
}

export default App;
