import React from "react";

import { Select, SelectItem } from "@nextui-org/select";

import { useCommanderCommand } from "@zenflux/react-commander/use-commands";

import { Info } from "@zenflux/react-ui/src/symbols";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { SelectProps } from "@nextui-org/select";

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
    classNames: {
        base: "select",
        trigger: "trigger",
        mainWrapper: "wrapper",
        innerWrapper: "inner"
    },
    multiple: false,
    size: "sm",
    variant: "bordered",
    radius: "none",
    disallowEmptySelection: true,
    "aria-labelledby": "channel-budget-frequency-label",
};

export function getChannelBudgetFrequencyLabel( frequency: ChannelBudgetFrequencyPossibleValues ) {
    return DEFAULT_FREQUENCIES[ frequency! ];
}

export function ChannelBudgetFrequency( props: ChannelBudgetFrequencyProps ) {
    const { frequency } = props;

    const command = useCommanderCommand( "App/ChannelItem/SetFrequency" );

    const selectProps: Partial<SelectProps> = {
        ... DEFAULT_PROPS,

        selectedKeys: [ frequency ] as any,

        onChange: ( e ) => command.run( { value: e.target.value, source: UpdateSource.FROM_BUDGET_SETTINGS } )
    };

    return (
        <div className="channel-budget-frequency">
            <Info>Budget Frequency</Info>
            <Select { ... selectProps }>
                { Object.keys( DEFAULT_FREQUENCIES ).map( key => (
                    <SelectItem key={ key } value={ key }>{ getChannelBudgetFrequencyLabel( key as any ) }</SelectItem>
                ) ) }
            </Select>
        </div>
    );
}
