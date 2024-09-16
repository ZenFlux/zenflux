import { formatNumericStringWithCommas } from "@zenflux/app-budget-allocation/src/utils";

import { CommandBudgetBase } from "@zenflux/app-budget-allocation/src/components/channel/commands/command-budget-base";

import type { CommandArgs } from "@zenflux/react-commander/types";

export class SetBaseline extends CommandBudgetBase {
    public static getName() {
        return "App/ChannelItem/SetBaseline";
    }

    protected async apply( args: CommandArgs ) {
        const { value } = args;

        const formatted = formatNumericStringWithCommas( value );

        if ( null === formatted ) {
            return; // Halt
        }

        await this.setState( { baseline: formatted } );

        return args.source;
    }
}
