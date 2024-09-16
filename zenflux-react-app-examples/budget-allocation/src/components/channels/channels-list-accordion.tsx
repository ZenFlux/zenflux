import React from "react";

import { useCommanderComponent, useCommanderState } from "@zenflux/react-commander/use-commands";

import { channelsListAccordionInteractions } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion-interactions";

import Accordion from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion";
import AccordionItem from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components/channel/channel-item-accordion";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

import type { ChannelItemAccordionComponent } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import type { AccordionItemProps } from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

export function toAccordionItem(
    channel: ChannelItemAccordionComponent,
    channelsCommands: ReturnType<typeof useCommanderComponent>,
    index: number,
): React.ReactComponentElement<typeof AccordionItem> {
    // Omit `collapsedState` and `setCollapsedState` those are extended by `renderExtendAccordionItem`
    const accordionProps: Omit<AccordionItemProps, "collapsedState" | "setCollapsedState"> = {
        itemKey: channel.props.meta.id,

        onRender: channel.props.onRender,

        children: <ChannelItemAccordion { ... channel.props } key={ channel.props.meta.id }/>,
        heading: {
            title: channel.props.meta.name,
            icon: channel.props.meta.icon,
        },
        menu: {
            edit: {
                label: "Edit",
                action: () => channelsCommands.run(
                    "App/ChannelsList/EditRequest",
                    { channel, }
                ),
            },
            remove: {
                label: "Remove",
                color: "danger",
                action: () => channelsCommands.run(
                    "App/ChannelsList/RemoveRequest",
                    { channel, }
                ),
            },
        },
    };

    const { children, ... withoutChildren } = accordionProps;

    return <AccordionItem children={ children } { ... withoutChildren }
                          key={ "channel-" + channel.props.meta.id + "-accordion-item-" + index.toString() }/>;
}

export const ChannelsListAccordion: React.FC = () => {
    const [ getChannelsListState, setChannelsListState ] = useCommanderState<ChannelListState>( "App/ChannelsList" );

    const channelsCommands = useCommanderComponent( "App/ChannelsList" );

    const channelsListState = getChannelsListState();

    const setSelected = ( selected: { key: boolean } ) => {
        setChannelsListState( { selected } );
    };

    channelsListAccordionInteractions();

    return (
        <Accordion selected={ channelsListState.selected } setSelected={ setSelected }>
            { channelsListState.channels.map( ( i, index ) => toAccordionItem( i, channelsCommands, index ) ) }
        </Accordion>
    );
};

export default ChannelsListAccordion;
