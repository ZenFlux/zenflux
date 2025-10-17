import React from "react";

import { useCommand } from "@zenflux/react-commander/hooks";

import { Button as ButtonComponent } from "@zenflux/app-budget-allocation/src/components/ui/button";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

interface ButtonProps extends React.ComponentProps<typeof ButtonComponent> {
    emoji: React.ReactNode;
    label: string;
    onClickCommand: string
}

export const Button: DCommandFunctionComponent<ButtonProps> = ({ label, emoji, onClickCommand, ...props }) => {
    const [ isLoading, setIsLoading ] = React.useState( false );

    const command = useCommand( onClickCommand );

    const Label = () => <div className="flex flex-row justify-around w-full gap-2">
        <span className="flex items-center justify-center text-2xl relative top-[-2px]">{ emoji }</span>
        <span className="flex items-center justify-center hover:underline">{ label }</span>
    </div>;

    return (
        <ButtonComponent { ...props } onClick={ async () =>  {
            setIsLoading( true );

            await command.run();

            setIsLoading( false );
        } }
        className="button"
        variant="bordered"
        disabled={ isLoading }
        radius={ "none" }
        >
            { isLoading ? "Loading..." : <Label/> }
        </ButtonComponent>
    );
};

