import type React from "react";

import type { ChannelItemAccordion } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-accordion.tsx";

import type {
    ChannelBudgetFrequencyProps,
    BudgetAllocationType
} from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings";
import type { DCommandArgs } from "@zenflux/react-commander/definitions";

export type ChannelItemAccordionComponent = React.ReactComponentElement<typeof ChannelItemAccordion>;

export type ChannelFrequency = ChannelBudgetFrequencyProps["frequency"];
export type ChannelAllocation = BudgetAllocationType;

export type NumericString = string;
export type BaselineString = NumericString;
export type ChannelId = string;
export type ChannelName = string;
export type UnixTimestampMs = number;

export enum UpdateSource {
    FROM_UNKNOWN,
    FROM_BUDGET_SETTINGS ,
    FROM_BUDGET_BREAKS,
    FROM_BUDGET_OVERVIEW,
}

export interface ChannelState extends React.ComponentState {
    frequency: ChannelFrequency;
    baseline: BaselineString;
    allocation: ChannelAllocation;

    meta?: ChannelMetaData;
    breaks?: ChannelBreaks;
}

export interface ChannelMetaData {
    id: ChannelId;
    icon: string;
    name: ChannelName;
    createdAt: UnixTimestampMs,
}

export interface ChannelBreakData {
    date: Date,
    value: NumericString,
}

export type ChannelBreaks = ChannelBreakData[];
export type ChannelBreakElements = React.JSX.Element[];

export const EMPTY_BREAKS: ChannelBreaks = [];
export const EMPTY_BREAK_ELEMENTS: ChannelBreakElements = [];

export interface ChannelItemProps {
    meta: ChannelMetaData;
}

export interface ChannelItemPropsAccordion extends ChannelItemProps {
    onRender: () => void;
}

export type ChannelBreakdownSlice = {
    allocation: ChannelAllocation;
    frequency: ChannelFrequency;
    baseline: BaselineString;
    breaks: ChannelBreaks;
};

export interface CommandAdapter {
    hook: ( commandName: string, callback: ( result?: unknown, args?: DCommandArgs ) => void ) => void;
    unhook: ( commandName: string ) => void;
    getState: <T>() => T;
}
