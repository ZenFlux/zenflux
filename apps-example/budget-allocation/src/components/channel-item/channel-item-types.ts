import type React from "react";

import type {
    ChannelBudgetFrequencyProps,
    BudgetAllocationType
} from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings";

export type ChannelFrequency = ChannelBudgetFrequencyProps[ "frequency" ];
export type ChannelAllocation = BudgetAllocationType;

export enum UpdateSource {
    FROM_UNKNOWN,
    FROM_BUDGET_SETTINGS ,
    FROM_BUDGET_BREAKS,
    FROM_BUDGET_OVERVIEW,
}

export interface ChannelState extends React.ComponentState {
    frequency: ChannelFrequency;
    baseline: string;
    allocation: ChannelAllocation;

    meta?: ChannelMetaData;
    breaks?: ChannelBreaks;
}

export interface ChannelItemTableState extends ChannelState {
    editing: boolean[];
}

export interface ChannelMetaData {
    id: string;
    icon: string;
    name: string;
    createdAt: number,
}

export interface ChannelBreakData {
    date: Date,
    value: string,
}

export type ChannelBreaks = ChannelBreakData[];

