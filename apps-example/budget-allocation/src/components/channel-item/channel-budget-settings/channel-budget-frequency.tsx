import { useCommand } from "@zenflux/react-commander/use-commands";

import { Info } from "@zenflux/react-ui/src/symbols";

import { Select, SelectItem } from "@zenflux/app-budget-allocation/src/components/ui/select";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type {
    ChannelBudgetFrequencyPossibleValues,
    ChannelBudgetFrequencyProps
} from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings/channel-budget-types";

const DEFAULT_FREQUENCIES: Record<ChannelBudgetFrequencyPossibleValues, string> = {
    annually: "Annually",
    monthly: "Monthly",
    quarterly: "Quarterly",
};

const DEFAULT_PROPS = {
    variant: "flat",
    classNames: {
        base: "select",
        trigger: "trigger",
    },
    "aria-labelledby": "channel-budget-frequency-label",
} as const;

export function getChannelBudgetFrequencyLabel( frequency: ChannelBudgetFrequencyPossibleValues ) {
    return DEFAULT_FREQUENCIES[ frequency! ];
}

export function ChannelBudgetFrequency( props: ChannelBudgetFrequencyProps ) {
    const { frequency } = props;

    const command = useCommand( "App/ChannelItem/SetFrequency" );

    const selectProps = {
        ... DEFAULT_PROPS,
        selectedKeys: [ frequency ] as any,
        onChange: ( e: { target: { value: string } } ) => command.run( { value: e.target.value, source: UpdateSource.FROM_BUDGET_SETTINGS } )
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
