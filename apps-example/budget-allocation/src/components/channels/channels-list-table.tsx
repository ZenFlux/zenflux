import React from "react";

import { useCommandStateSelector } from "@zenflux/react-commander/use-commands";

import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-table.tsx";

import "@zenflux/app-budget-allocation/src/components/channels/_channels-list-table.scss";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types.ts";

export const ChannelsListTable: React.FC = () => {
    const [ channelsListState ] = useCommandStateSelector<ChannelListState, ChannelListState>(
        "App/ChannelsList",
        (state) => state
    );

    const channelsRenderer = channelsListState.channels.filter(
        ( channel ) => channel.breaks && channel.breaks.length > 0
    );

    console.log( channelsListState );

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
                                    <img src={ channel.meta.icon } alt={ channel.meta.name }/>
                                    <span>{ channel.meta.name }</span>
                                </div>
                            </div>
                            <div className="channel-list-table-separator"/>

                            <ChannelItemTable $data={ channel } key={ channel.meta.id }/>
                        </div>
                    );
                } )
            }
        </div>
    );
};

export default ChannelsListTable;
