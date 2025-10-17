import React from "react";

import { QueryClient } from "@zenflux/react-commander/query/client";

import { useCommand, useCommandHook, useCommandState } from "@zenflux/react-commander/hooks";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { QueryProvider } from "@zenflux/react-commander/query/provider";

import { ChannelItemQuery } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-query";
import { ChannelsListQuery, ChannelsListWithBreaksQuery } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-query";

import { Tab, Tabs } from "@zenflux/app-budget-allocation/src/components/ui/tabs";

import Layout from "@zenflux/app-budget-allocation/src/ui-layout/layout";
import { AddChannel } from "@zenflux/app-budget-allocation/src/components/add-channel/add-channel";
import { Reset } from "@zenflux/app-budget-allocation/src/components/add-channel/reset";

import "@zenflux/app-budget-allocation/src/app.scss";

import type { LayoutProps } from "@zenflux/app-budget-allocation/src/ui-layout/layout";

const BudgetAllocation = React.lazy( () => import( "@zenflux/app-budget-allocation/src/budget-allocation" ) ),
    BudgetOverview = React.lazy( () => import( "@zenflux/app-budget-allocation/src/budget-overview" ) );

const client = new QueryClient( "http://localhost:3002" );

client.registerModule( ChannelsListQuery );
client.registerModule( ChannelsListWithBreaksQuery );
client.registerModule( ChannelItemQuery );

function LazyLoader( props: { ContentComponent: typeof BudgetAllocation | typeof BudgetOverview } ) {
    const { ContentComponent } = props;

    return (
        <React.Suspense fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }>
            <ContentComponent/>
        </React.Suspense>
    );
};

interface AppState {
    isLoading: boolean;
    channels: any[];
}

export function App() {
    const layoutProps: LayoutProps = {
        header: {
            end: <div className="flex gap-2">
                <AddChannel/>
                <Reset/>
            </div>,
        }
    };

    const tabsRef = React.useRef<HTMLDivElement>( null );

    const [ getState, setState ] = useCommandState<AppState>( "App" );

    const appAddChannel = useCommand( "App/AddChannel", tabsRef );
    const uiTabsSelect = useCommand( "UI/Tabs/Select", tabsRef);

    const channelsListAddRequest = useCommand( "App/ChannelsList/AddRequest" );

    useCommandHook( "App/AddChannel", async () => {
        if ( location.hash === "#overview" ) {
            uiTabsSelect?.run({ key: "allocation" });

            setTimeout( () => {
                appAddChannel?.run();
            }, 1200 );

            return;
        }
        try {
            setState( {
                ... getState(),
                isLoading: true,
            } );

            await channelsListAddRequest?.run();
        } catch ( error ) {
            console.error( "Error adding channel", error );
        } finally {
            setState( {
                ... getState(),
                isLoading: false,
            } );
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
        <QueryProvider client={ client }>
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
        </QueryProvider>
    );
}

const $$ = withCommands<{}, AppState>( "App", App, {
    isLoading: false,
    channels: [],
}, [
    class AddChannel extends CommandBase {
        public static getName() {
            return "App/AddChannel";
        }
    }
] );

export default $$;

