import React from "react";

import { QueryClient } from "@zenflux/react-commander/query/client";

import { useCommandRunner, useCommandHook, useCommandWithRef } from "@zenflux/react-commander/use-commands";

import { ChannelsQueryModule } from "@zenflux/app-budget-allocation/src/api/channels-query-module.ts";

import { Tab, Tabs } from "@zenflux/app-budget-allocation/src/components/ui/tabs";

import { Button } from "@zenflux/app-budget-allocation/src/components/ui/button";

import Layout from "@zenflux/app-budget-allocation/src/ui-layout/layout";

import AddChannel from "@zenflux/app-budget-allocation/src/components/add-channel/add-channel";

import "@zenflux/app-budget-allocation/src/app.scss";

import type { LayoutProps } from "@zenflux/app-budget-allocation/src/ui-layout/layout";

const BudgetAllocation = React.lazy( () => import( "@zenflux/app-budget-allocation/src/budget-allocation" ) ),
    BudgetOverview = React.lazy( () => import( "@zenflux/app-budget-allocation/src/budget-overview" ) );

const client = new QueryClient( "http://localhost:3002" );

client.registerModule( ChannelsQueryModule );

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

    const tabsRef = React.useRef<HTMLDivElement>( null );

    const runAddChannel = useCommandRunner( "App/AddChannel" );
    const selectCommand = useCommandWithRef("UI/Tabs/Select", tabsRef);

    useCommandHook( "App/AddChannel", () => {
        if ( location.hash === "#overview" ) {
            selectCommand?.run({ key: "allocation" });

            setTimeout( () => {
                runAddChannel( {} );
            }, 1200 );
        }
    } );

    useCommandHook( "UI/Tabs/Select", ( _result, args ) => {
        location.hash = `#${ args?.key }`;
    }, tabsRef );

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
        defaultValue: location.hash.replace( "#", "" ),
    };

    return (
        <>
            <Button onClick={ async () => {
                window.onbeforeunload = null;

                await client.fetch( "POST", "v1/channels/reset", {}, ( response ) => response.json() );

                location.reload();
            } } className="absolute top-0 right-0 border-none" variant="bordered" disableAnimation={ true }
            radius={ "none" }>
                Reset Demo
            </Button>

            <Layout { ... layoutProps }>
                <Tabs ref={ tabsRef } { ... tabsProps }> {
                    tabsProps.items.map( ( tab ) => (
                        <Tab key={ tab.id } title={ tab.title }>
                            { tab.content }
                        </Tab>
                    ) )
                }
                </Tabs>
            </Layout>
        </>
    );
}

export default App;

