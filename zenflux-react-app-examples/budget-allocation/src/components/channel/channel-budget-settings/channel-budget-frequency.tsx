import React from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zenflux/app-budget-allocation/src/components/ui/select";

import { useCommanderCommand } from "@zenflux/react-commander/use-commands";

import { Info } from "@zenflux/react-ui/src/symbols";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { SelectProps } from "@zenflux/app-budget-allocation/src/components/ui/select";

import type {
    ChannelBudgetFrequencyPossibleValues,
    ChannelBudgetFrequencyProps
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-types";

const DEFAULT_FREQUENCIES: Record<ChannelBudgetFrequencyPossibleValues, string> = {
    annually: "Annually",
    monthly: "Monthly",
    quarterly: "Quarterly",
};

const DEFAULT_PROPS: Partial<SelectProps> = {
    className: "select",
};

export function getChannelBudgetFrequencyLabel( frequency: ChannelBudgetFrequencyPossibleValues ) {
    return DEFAULT_FREQUENCIES[ frequency! ];
}

export function ChannelBudgetFrequency( props: ChannelBudgetFrequencyProps ) {
    const { frequency } = props;

    const command = useCommanderCommand( "App/ChannelItem/SetFrequency" );

    return (
        <div className="channel-budget-frequency">
            <Info>Budget Frequency</Info>
            <Select value={ frequency } onValueChange={ ( value ) => command.run( { value, source: UpdateSource.FROM_BUDGET_SETTINGS } ) } { ... DEFAULT_PROPS }>
                <SelectTrigger className="trigger">
                    <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                    { Object.keys( DEFAULT_FREQUENCIES ).map( key => (
                        <SelectItem key={ key } value={ key }>{ getChannelBudgetFrequencyLabel( key as any ) }</SelectItem>
                    ) ) }
                </SelectContent>
            </Select>
        </div>
    );
}
