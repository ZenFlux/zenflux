import { CommandBase } from "@zenflux/react-commander/command-base";

import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { CommandArgs } from "@zenflux/react-commander/types";

export abstract class CommandBudgetBase<TState = ChannelState> extends CommandBase<TState> {
    protected validateArgs( args: CommandArgs ) {
        const { source, value } = args;

        if ( ! source ) {
            throw new Error( "`args.source` is required or invalid" );
        }

        if ( typeof value !== "string" ) {
            throw new Error( "`args.value` has to be string" );
        }
    }
}
