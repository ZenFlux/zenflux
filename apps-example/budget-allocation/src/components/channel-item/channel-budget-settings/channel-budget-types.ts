// Allocation
export type BudgetAllocationType = "equal" | "manual";

export type ChannelBudgetAllocationProps = {
    allocation: BudgetAllocationType;
};

// Frequency
export type ChannelBudgetFrequencyPossibleValues = "annually" | "monthly" | "quarterly";

export type ChannelBudgetFrequencyProps = {
    frequency: ChannelBudgetFrequencyPossibleValues,
};

// Baseline
export type ChannelBudgetBaselineProps = {
    frequency: ChannelBudgetFrequencyProps[ "frequency" ],
    allocation: ChannelBudgetAllocationProps[ "allocation" ],
    baseline: string | undefined,
};
