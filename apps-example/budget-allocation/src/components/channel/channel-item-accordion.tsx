import React from "react";

import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommandState } from "@zenflux/react-commander/use-commands";

import "@zenflux/app-budget-allocation/src/components/channel/_channel-item-accordion.scss";

import {
    ChannelBudgetFrequency,
    ChannelBudgetBaseline,
    ChannelBudgetAllocation
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings";

import { ChannelBreakdowns } from "@zenflux/app-budget-allocation/src/components/channel/channel-breakdowns";

import * as commands from "@zenflux/app-budget-allocation/src/components/channel/commands";

import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

export const ChannelItemAccordion: DCommandFunctionComponent<{ $data: Channel }, ChannelState> = () => {
    const [ getState ] = useCommandState<ChannelState>( "App/ChannelItem" );

    const { frequency, baseline, allocation } = getState();

    return (
        <div className="channel-item-accordion">
            <div className="channel-budget-settings">
                <ChannelBudgetFrequency frequency={ frequency }/>
                <ChannelBudgetBaseline frequency={ frequency } baseline={ baseline } allocation={ allocation }/>
                <ChannelBudgetAllocation allocation={ allocation }/>
            </div>

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

const $$ = withCommands<{ $data: Channel }, ChannelState>( "App/ChannelItem", ChannelItemAccordion, {
    frequency: "annually",
    baseline: "0",
    allocation: "equal",
}, [
    commands.SetAllocation,
    commands.SetBaseline,
    commands.SetBreakdown,
    commands.SetFrequency,
] );

export default $$;
