import React from "react";

import type { InputProps } from "@nextui-org/input";

import type { EnforceKeys } from "@zenflux/app-budget-allocation/src/utils";
import type { ChannelMetaData, ChannelState } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

export const META_DATA_KEYS: EnforceKeys<ChannelMetaData> = {
    id: true,
    icon: true,
    name: true,
    createdAt: true,
};

export const CHANNEL_LIST_STATE_DATA: EnforceKeys<ChannelState> = {
    allocation: true,
    baseline: true,
    frequency: true,

    breaks: true,

    // Visual
    breakElements: false,

    // Saved separately
    meta: false
};

export const CHANNEL_LIST_STATE_DATA_WITH_META: EnforceKeys<ChannelState> = {
    allocation: true,
    baseline: true,
    frequency: true,

    breaks: true,

    // Visual
    breakElements: false,

    // Saved separately
    meta: true
};

export const DEFAULT_CHANNEL_BREAK_INPUT_PROPS: InputProps = {
    classNames: {
        base: "input",
        mainWrapper: "wrapper",
        inputWrapper: "trigger",
        label: "currency",
    },
    type: "string",
    variant: "bordered",
    radius: "none",
    labelPlacement: "outside",
    placeholder: "0",
    startContent: (
        <div className="pointer-events-none flex items-center ">
            <span className="currency-sign text-slate-700 text-sm font-medium leading-[21px]">$</span>
        </div>
    ),
};
