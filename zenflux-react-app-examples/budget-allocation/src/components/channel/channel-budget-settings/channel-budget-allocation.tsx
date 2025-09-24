import { useCommanderCommand } from "@zenflux/react-commander/use-commands";

import { Info } from "@zenflux/react-ui/src/symbols";

import ButtonGroup from "@zenflux/app-budget-allocation/src/components/ui/button-group";
import { Button } from "@zenflux/app-budget-allocation/src/components/ui/button";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { ButtonProps } from "@zenflux/app-budget-allocation/src/components/ui/button";

import type {
    BudgetAllocationType,
    ChannelBudgetAllocationProps
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-types";

const DEFAULT_BUDGET_ALLOCATIONS: Record<BudgetAllocationType, string> = {
    "equal": "Equal",
    "manual": "Manual"
};

export function getChannelBudgetAllocationLabel( budgetAllocation: BudgetAllocationType ) {
    return DEFAULT_BUDGET_ALLOCATIONS[ budgetAllocation ];
}

const DEFAULT_PROPS: Partial<ButtonProps> = {
    className: "button"
};

export function ChannelBudgetAllocationButton( props: ButtonProps & {
    current: BudgetAllocationType,
    allocation: BudgetAllocationType;
} ) {
    const { current, allocation, ... buttonProps } = props;

    const command = useCommanderCommand( "App/ChannelItem/SetAllocation" );

    return (
        <Button
            { ... DEFAULT_PROPS }
            { ... buttonProps }
            data-active={ allocation === current }
            disabled={ allocation === current }
            onClick={ () => command.run( { value: current, source: UpdateSource.FROM_BUDGET_SETTINGS } ) }
        >
            { getChannelBudgetAllocationLabel( current ) }
        </Button>
    );
}

export function ChannelBudgetAllocation( props: ChannelBudgetAllocationProps ) {
    return (
        <div className="channel-budget-allocation">
            <Info>Budget Allocation</Info>
            <ButtonGroup variant="flat" className="button-group">
                { Object.keys( DEFAULT_BUDGET_ALLOCATIONS ).map( ( key ) => (
                    <ChannelBudgetAllocationButton
                        key={ key }
                        current={ key as BudgetAllocationType }
                        { ... props }
                    />
                ) ) }
            </ButtonGroup>
        </div>
    );
}
