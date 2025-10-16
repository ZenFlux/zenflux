
import type { InputProps } from "@zenflux/app-budget-allocation/src/components/ui/input";

import type { EnforceKeys } from "@zenflux/app-budget-allocation/src/utils";
import type { ChannelMetaData, ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

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
    className: "input",
    type: "text",
    variant: "transparent",
    radius: "none",
    placeholder: "0",
    withWrapper: false,
};
