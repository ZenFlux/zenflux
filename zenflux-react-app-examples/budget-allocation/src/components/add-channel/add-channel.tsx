import React from "react";

import { Button } from "@zenflux/app-budget-allocation/src/components/ui/button";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { useCommanderCommand } from "@zenflux/react-commander/use-commands";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { Plus } from "@zenflux/react-ui/src/symbols";

import type { CommandFunctionComponent } from "@zenflux/react-commander/types";

const AddChannel: CommandFunctionComponent<void> = () => {
    const command = useCommanderCommand( "App/AddChannel" );

    return (
        <div>
            <Button onClick={ () => command.run( {} ) } className="add-channel" variant="bordered"
                    radius={ "none" }>{ Plus } Add Channel</Button>
        </div>
    );
};

const $$ = withCommands( "App/AddChannel", AddChannel, [
    class AddChannel extends CommandBase {
        public static getName() {
            return "App/AddChannel";
        }
    }
] );

export default $$;

