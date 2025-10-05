import { formatNumericStringWithCommas } from "@zenflux/app-budget-allocation/src/utils";

import { CommandBudgetBase } from "@zenflux/app-budget-allocation/src/components/channel-item/commands/command-budget-base";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { DCommandArgs } from "@zenflux/react-commander/definitions";

export class SetBreakdown extends CommandBudgetBase {
    public static getName() {
        return "App/ChannelItem/SetBreakdown";
    }

    protected async apply( args: DCommandArgs ) {
        const { index, value, setState = this.setState.bind( this ) } = args;

        const formatted = formatNumericStringWithCommas( value );

        if ( null === formatted ) {
            return; // Halt
        }

        const breaks = (this.state as Required<ChannelState>).breaks.map( ( breakItem, i ) => {
            if ( i === index ) {
                return {
                    ... breakItem,
                    value: formatted,
                };
            }

            return breakItem;
        } );

        const allocation = args.source === UpdateSource.FROM_BUDGET_OVERVIEW ?
            "manual" : this.state.allocation;

        await setState( {
            ... this.state,
            breaks,
            allocation
        } );

        return args.soruce;
    }
}
