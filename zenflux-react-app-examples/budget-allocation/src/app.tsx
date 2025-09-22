import React, { useEffect } from "react";

import { API } from "@zenflux/react-api/src";

import { useCommandHook, useCommandRunner } from "@zenflux/react-commander/use-commands";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@zenflux/app-budget-allocation/src/components/ui/tabs";

import { Button } from "@zenflux/app-budget-allocation/src/components/ui/button";

import Layout from "@zenflux/app-budget-allocation/src/ui-layout/layout";

import { APIChannelsModule } from "@zenflux/app-budget-allocation/src/api/api-channels-module";

import AddChannel from "@zenflux/app-budget-allocation/src/components/add-channel/add-channel";

import "@zenflux/app-budget-allocation/src/app.scss";

// eslint-disable-next-line import/order
import "@zenflux/app-budget-allocation/src/api/api-fake-data";
import type { LayoutProps } from "@zenflux/app-budget-allocation/src/ui-layout/layout";

const BudgetAllocation = React.lazy( () => import( "@zenflux/app-budget-allocation/src/budget-allocation" ) ),
    BudgetOverview = React.lazy( () => import( "@zenflux/app-budget-allocation/src/budget-overview" ) );

API.register( APIChannelsModule );

function LazyLoader( props: { ContentComponent: typeof BudgetAllocation | typeof BudgetOverview } ) {
    const { ContentComponent } = props;

    return (
        <React.Suspense fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }>
            <ContentComponent/>
        </React.Suspense>
    );
};

function App() {
    const layoutProps: LayoutProps = {
        header: {
            end: <AddChannel/>,
        }
    };

    const [ selectedTab, setSelectedTab ] = React.useState( location.hash.replace( "#", "" ) );

    const runAddChannel = useCommandRunner( "App/AddChannel" );

    useEffect( () => {
        if ( location.hash === "#allocation/add-channel" ) {
            location.hash = "#allocation";
            setSelectedTab( "allocation" );

            setTimeout( () => {
                runAddChannel( {} );
            }, 1000 );
        }
    }, [ location.hash ] );

    useCommandHook( "App/AddChannel", () => {
        location.hash = "#allocation/add-channel";

        setSelectedTab( "allocation" );
    } );

    const items = [
        { id: "allocation", title: "Budget Allocation", content: <LazyLoader ContentComponent={ BudgetAllocation }/> },
        { id: "overview", title: "Budget Overview", content: <LazyLoader ContentComponent={ BudgetOverview }/> },
    ];

    return (
        <>
            <Button onClick={ () => {
                // Do not let the rescue callback to run
                window.onbeforeunload = null;

                localStorage.clear();
                location.reload();
            } } className="absolute top-0 right-0" variant="outline">Reset Demo</Button>

            <Layout { ... layoutProps }>
                <Tabs value={ selectedTab } onValueChange={ ( value ) => {
                    if ( ! location.hash.includes( value ) ) {
                        setSelectedTab( value );
                        location.hash = value;
                    }
                } } className="tabs">
                    <TabsList className="list">
                        { items.map( ( tab ) => (
                            <TabsTrigger key={ tab.id } value={ tab.id } className="tab">
                                { tab.title }
                            </TabsTrigger>
                        ) ) }
                    </TabsList>
                    { items.map( ( tab ) => (
                        <TabsContent key={ tab.id } value={ tab.id }>
                            { tab.content }
                        </TabsContent>
                    ) ) }
                </Tabs>
            </Layout>
        </>
    );
}

export default App;

