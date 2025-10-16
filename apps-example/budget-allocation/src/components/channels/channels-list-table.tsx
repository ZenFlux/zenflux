import React from "react";

import { useCommandStateSelector } from "@zenflux/react-commander/use-commands";

import ChannelItemTable from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-table.tsx";

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
        <div className="pt-[45px]">
            {
                0 === channelsRenderer.length && (
                    <div className="pt-[15px] ps-[40px] text-slate-400 text-[11px] font-bold uppercase leading-none text-center">
                        There are { channelsListState.channels.length } channels, but none of them have any budget allocation.
                    </div>
                ) ||
                channelsRenderer.map( ( channel, index ) => {
                    return (
                        <div key={index} className="h-[130px] flex flex-row items-center">
                            <div className="w-[220px] h-full">
                                <div className="pt-[15px] ps-[40px] text-slate-400 text-[11px] font-bold uppercase leading-none">
                                    Channel #{ index + 1 }
                                </div>

                                <div className="pt-[30px] ps-[35px] text-slate-800 text-sm font-medium font-sans leading-[21px]">
                                    <img src={ channel.meta.icon } alt={ channel.meta.name } className="inline-block mr-[10px] w-[36px] h-[36px]"/>
                                    <span>{ channel.meta.name }</span>
                                </div>
                            </div>
                            <div className="w-[80px] h-full border-e border-slate-300 bg-[linear-gradient(to_right,rgba(169,181,210,0.01),rgba(112,126,167,0.134))] opacity-50"/>

                            <ChannelItemTable $data={ channel } key={ channel.meta.id }/>
                        </div>
                    );
                } )
            }
        </div>
    );
};

export default ChannelsListTable;
