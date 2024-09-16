import React from "react";

import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommanderState } from "@zenflux/react-commander/use-commands";

import "@zenflux/app-budget-allocation/src/components/channel/_channel-item-accordion.scss";

import {
    ChannelBudgetFrequency,
    ChannelBudgetBaseline,
    ChannelBudgetAllocation
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings";

import { ChannelBreakdowns } from "@zenflux/app-budget-allocation/src/components/channel/channel-breakdowns";

import * as commands from "@zenflux/app-budget-allocation/src/components/channel/commands";

import type { ChannelItemPropsAccordion, ChannelState } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { CommandFunctionComponent } from "@zenflux/react-commander/types";

export const ChannelItemAccordion: CommandFunctionComponent<ChannelItemPropsAccordion, ChannelState> = () => {
    const [ getState ] = useCommanderState<ChannelState>( "App/ChannelItem" );

    const { frequency, baseline, allocation } = getState();

    return (
        <div className="channel-item-accordion">
            <div className="channel-budget-settings">
                <ChannelBudgetFrequency frequency={ frequency }/>
                <ChannelBudgetBaseline frequency={ frequency } baseline={ baseline } allocation={ allocation }/>
                <ChannelBudgetAllocation allocation={ allocation }/>
            </div>

            <div className="channel-budget-breakdowns">
                <div className="header">
                    <p className="fs-2">Budget Breakdown</p>
                    <p className="description">By default, your budget will be equally divided throughout the year. You
                        can manually change the budget allocation, either now or later.</p>

                    <ChannelBreakdowns/>
                </div>
            </div>
        </div>
    );
};

const $$ = withCommands<ChannelItemPropsAccordion, ChannelState>( "App/ChannelItem", ChannelItemAccordion, {
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
