import { formatNumericStringWithCommas } from "@zenflux/app-budget-allocation/src/utils";

import { CommandBudgetBase } from "@zenflux/app-budget-allocation/src/components/channel-item/commands/command-budget-base";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { DCommandArgs } from "@zenflux/react-commander/definitions";
import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

type BudgetMutableState = Pick<ChannelState, "allocation" | "breaks">;

export class SetBreakdown<TState extends BudgetMutableState = BudgetMutableState> extends CommandBudgetBase<TState> {
    public static getName() {
        return "App/ChannelItem/SetBreakdown";
    }

    protected async apply( args: DCommandArgs ) {
        const { index, value } = args;

        const formatted = formatNumericStringWithCommas( value );

        if ( null === formatted ) {
            return; // Halt
        }

        const breaks = this.state.breaks?.map( ( breakItem, i ) => {
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

        await this.setState( {
            ... this.state,
            breaks,
            allocation
        } );

        return args.soruce;
    }
}
