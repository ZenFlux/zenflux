import React from "react";

import { Input } from "@zenflux/app-budget-allocation/src/components/ui/input";

import { useCommanderCommand } from "@zenflux/react-commander/use-commands";

import { Info } from "@zenflux/react-ui/src/symbols";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import {
    getChannelBudgetFrequencyLabel
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-frequency";

import type {
    ChannelBudgetBaselineProps
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-types";

import type { InputProps } from "@zenflux/app-budget-allocation/src/components/ui/input";

const DEFAULT_PROPS: Partial<InputProps> = {
    className: "input",
    type: "text",
};

export function ChannelBudgetBaseline( props: ChannelBudgetBaselineProps ) {
    const { frequency, allocation, baseline } = props;

    const command = useCommanderCommand( "App/ChannelItem/SetBaseline" );

    const inputProps: InputProps = {
        ... DEFAULT_PROPS,
        disabled: allocation === "manual",
        value: ( baseline || 0 ).toString(),
        onChange: ( e ) => command.run( {
            value: e.target.value,
            source: UpdateSource.FROM_BUDGET_SETTINGS
        } )
    };

    const frequencyLabel = inputProps.disabled ? "Manual" :
        getChannelBudgetFrequencyLabel( frequency );

    return (
        <div className="channel-budget-baseline" data-disabled={ inputProps.disabled }>
            <Info>Baseline [{ frequencyLabel }] Budget</Info>
            <Input aria-labelledby="baseline" { ... inputProps }></Input>
        </div>
    );
}
