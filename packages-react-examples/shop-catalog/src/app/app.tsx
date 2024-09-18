import "@zenflux/app-shop-catalog/src/app/app.scss";
import Layout from "@zenflux/app-shop-catalog/src/ui/layout/layout";
import Navbar from "@zenflux/app-shop-catalog/src/ui/navbar/navbar";

function App() {
    const Header = () => <Navbar/>;

    return (
            <Layout header={<Header />}>
                <h1></h1>
            </Layout>
    );
}

export default App;
