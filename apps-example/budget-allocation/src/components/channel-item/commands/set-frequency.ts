import { CommandBudgetBase } from "@zenflux/app-budget-allocation/src/components/channel-item/commands/command-budget-base";

import type { DCommandArgs } from "@zenflux/react-commander/definitions";

export class SetFrequency extends CommandBudgetBase {
    public static getName() {
        return "App/ChannelItem/SetFrequency";
    }

    protected async apply( args: DCommandArgs ) {
        const { value } = args;

        await this.setState( { frequency: value } );

        return args.source;
    }
}
