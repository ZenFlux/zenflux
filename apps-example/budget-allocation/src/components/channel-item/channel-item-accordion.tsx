import React from "react";

import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommandState } from "@zenflux/react-commander/hooks";

import {
    ChannelBudgetFrequency,
    ChannelBudgetBaseline,
    ChannelBudgetAllocation
} from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings";

import { ChannelBreakdowns } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-breakdowns";

import * as commands from "@zenflux/app-budget-allocation/src/components/channel-item/commands";

import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

import type { Channel } from "@zenflux/app-budget-allocation/src/query/channels-domain";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

export const ChannelItemAccordion: DCommandFunctionComponent<{ meta: Channel[ "meta" ]; $data?: Channel }, ChannelState> = () => {
    const ChannelBudgetSettings = () => {
        // Subscribe to all budget settings for automatic re-rendering
        const [ state ] = useCommandState<ChannelState, {
            frequency: ChannelState[ "frequency" ];
            baseline: ChannelState[ "baseline" ];
            allocation: ChannelState[ "allocation" ]
        }>(
            "App/ChannelItem",
            ( state ) => ( {
                frequency: state.frequency,
                baseline: state.baseline,
                allocation: state.allocation
            } )
        );

        return (
            <div className="grid gap-[350px]" style={ { gridTemplateColumns: "repeat(3, 0px)" } }>
                <ChannelBudgetFrequency frequency={ state.frequency }/>
                <ChannelBudgetBaseline frequency={ state.frequency } baseline={ state.baseline } allocation={ state.allocation }/>
                <ChannelBudgetAllocation allocation={ state.allocation }/>
            </div>
        );
    };

    return (
        <div className="channel-item-accordion">
            <ChannelBudgetSettings/>

            <div className="channel-budget-breakdowns mt-[50px] p-[24px] min-w-[1200px] min-h-[300px] bg-[#F5F6FA] bg-gradient-to-r from-[50%] to-[#B2BBD580] rounded border border-slate-300 border-opacity-50">
                <div className="header">
                    <p className="fs-2">Budget Breakdown</p>
                    <p className="description text-slate-400 text-sm leading-[21px] font-thin">By default, your budget will be equally divided throughout the year. You
                        can manually change the budget allocation, either now or later.</p>

                    <ChannelBreakdowns/>
                </div>
            </div>
        </div>
    );
};

const $$ = withCommands<{ meta: Channel[ "meta" ] }, ChannelState>( "App/ChannelItem", ChannelItemAccordion, {
    frequency: "annually",
    baseline: "0",
    allocation: "equal",
    breaks: [],
    breakElements: [],
}, [
    commands.SetAllocation,
    commands.SetBaseline,
    commands.SetBreakdown,
    commands.SetFrequency,
] );

export default $$;
