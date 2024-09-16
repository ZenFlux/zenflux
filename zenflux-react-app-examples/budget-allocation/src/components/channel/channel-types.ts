import type React from "react";

import type { ChannelItemAccordion } from "@zenflux/app-budget-allocation/src/components//channel/channel-item-accordion.tsx";

import type {
    ChannelBudgetFrequencyProps,
    BudgetAllocationType
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings";

export type ChannelItemAccordionComponent = React.ReactComponentElement<typeof ChannelItemAccordion>;

export enum UpdateSource {
    FROM_UNKNOWN,
    FROM_BUDGET_SETTINGS ,
    FROM_BUDGET_BREAKS,
    FROM_BUDGET_OVERVIEW,
}

export interface ChannelState extends React.ComponentState {
    frequency: ChannelBudgetFrequencyProps["frequency"];
    baseline: string;
    allocation: BudgetAllocationType;

    meta?: ChannelMetaData;
    breaks?: ChannelBreakData[];

    breakElements?: any[];
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

export interface ChannelItemProps {
    meta: ChannelMetaData;
}

export interface ChannelItemPropsAccordion extends ChannelItemProps {
    onRender: () => void;
}
