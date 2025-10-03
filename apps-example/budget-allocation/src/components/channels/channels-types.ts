import type { ChannelsListAccordion } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion";

import type React from "react";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";

export type ChannelsListViewAccordionComponent = React.ReactComponentElement<typeof ChannelsListAccordion>;

export interface ChannelListProps {
    view: "accordion" | "table";
}

export interface ChannelListState extends React.ComponentState {
    channels: Channel[];
    selected: { [ key: string ]: boolean };
}
