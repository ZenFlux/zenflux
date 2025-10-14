import React from "react";

import { useCommand } from "@zenflux/react-commander/use-commands";

import { Plus } from "@zenflux/react-ui/src/symbols";

import { Button } from "@zenflux/app-budget-allocation/src/components/ui/button";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

export const AddChannel: DCommandFunctionComponent<{}> = () => {
    const [ isLoading, setIsLoading ] = React.useState( false );

    const command = useCommand( "App/AddChannel" );

    return (
        <div>
            <Button onClick={ async () =>  {
                setIsLoading( true );

                await command.run();

                setIsLoading( false );
            } } className="add-channel min-w-[150px]" variant="bordered" disabled={ isLoading } radius={ "none" }>
                { isLoading ? "Loading..." : <>{ Plus }&nbsp;&nbsp;Add Channel</> }
            </Button>
        </div>
    );
};

