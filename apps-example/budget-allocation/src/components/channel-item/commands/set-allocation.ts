import { CommandBudgetBase } from "@zenflux/app-budget-allocation/src/components/channel-item/commands/command-budget-base";

import type { DCommandArgs } from "@zenflux/react-commander/definitions";

export class SetAllocation extends CommandBudgetBase {
    public static getName() {
        return "App/ChannelItem/SetAllocation";
    }

    protected async apply( args: DCommandArgs ) {
        const { value } = args;

        await this.setState( { allocation: value } );

        return args.source;
    }
}
