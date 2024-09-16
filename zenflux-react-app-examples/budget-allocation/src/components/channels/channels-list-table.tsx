import React from "react";

import { useCommanderState } from "@zenflux/react-commander/use-commands";

import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel/channel-item-table.tsx";

import "@zenflux/app-budget-allocation/src/components/channels/_channels-list-table.scss";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types.ts";

export const ChannelsListTable: React.FC = () => {
    const [ getChannelsListState ] = useCommanderState<ChannelListState>( "App/ChannelsList" );

    const channelsListState = getChannelsListState();

    const channelsRenderer = channelsListState.channels.filter(
        // @ts-ignore
        ( channel ) => channel.props.breaks?.length > 0
    );

    return (
        <div className="channel-list-table pt-[45px]">
            {
                0 === channelsRenderer.length && (
                    <div className="channel-list-table-heading-text text-center">
                        There are { channelsListState.channels.length } channels, but none of them have any budget allocation.
                    </div>
                ) ||
                channelsRenderer.map( ( channel, index ) => {
                    return (
                        <div key={index} className="channel-list-table-row">
                            <div className="channel-list-table-heading">
                                <div className="channel-list-table-heading-text">
                                    Channel #{ index + 1 }
                                </div>

                                <div className="channel-list-table-heading-title">
                                    <img src={ channel.props.meta.icon } alt={ channel.props.meta.name }/>
                                    <span>{ channel.props.meta.name }</span>
                                </div>
                            </div>
                            <div className="channel-list-table-separator"/>

                            <ChannelItemTable { ... channel.props } key={ channel.props.meta.id }/>
                        </div>
                    );
                } )
            }
        </div>
    );
};

export default ChannelsListTable;
