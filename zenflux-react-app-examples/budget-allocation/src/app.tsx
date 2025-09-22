import React, { useEffect } from "react";

import { API } from "@zenflux/react-api/src";

import { useCommandHook, useCommandRunner } from "@zenflux/react-commander/use-commands";

import { Tab, Tabs } from "@zenflux/app-budget-allocation/src/components/ui/tabs";

import { NextUIProvider } from "@nextui-org/system";
import { Button } from "@zenflux/app-budget-allocation/src/components/ui/button";

import Layout from "@zenflux/app-budget-allocation/src/ui-layout/layout";

import { APIChannelsModule } from "@zenflux/app-budget-allocation/src/api/api-channels-module";

import AddChannel from "@zenflux/app-budget-allocation/src/components/add-channel/add-channel";

import "@zenflux/app-budget-allocation/src/app.scss";

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

    const tabsProps = {
        items,
        classNames: {
            base: "tabs",
            tabList: "list",
            tab: "tab",
            cursor: "cursor",
        },
        selectedKey: selectedTab,
        onSelectionChange: ( id: React.Key ) => {
            if ( ! location.hash.includes( id.toString() ) ) {
                setSelectedTab( id.toString() );

                location.hash = id.toString();
            }
        }
    };

    return (
        <NextUIProvider>
            <Button onClick={ () => {
                // Do not let the rescue callback to run
                window.onbeforeunload = null;

                localStorage.clear();
                location.reload();
            } } className="absolute top-0 right-0 border-none" variant="bordered" disableAnimation={ true }
                    radius={ "none" }>Reset Demo</Button>

            <Layout { ... layoutProps }>
                <Tabs { ... tabsProps }> {
                    tabsProps.items.map( ( tab ) => (
                        <Tab key={ tab.id } title={ tab.title }>
                            { tab.content }
                        </Tab>
                    ) )
                }
                </Tabs>
            </Layout>
        </NextUIProvider>
    );
}

export default App;

