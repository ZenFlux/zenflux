import type { ChannelsListAccordion } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion";

import type React from "react";

import type { ChannelItemAccordionComponent } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

export type ChannelsListViewAccordionComponent = React.ReactComponentElement<typeof ChannelsListAccordion>;

export interface ChannelListProps {
    children: ChannelItemAccordionComponent[] | ChannelItemAccordionComponent;
    view: "accordion" | "table";
}

export interface ChannelListState extends React.ComponentState {
    channels: ChannelItemAccordionComponent[];
    selected: { [ key: string ]: boolean };
}
