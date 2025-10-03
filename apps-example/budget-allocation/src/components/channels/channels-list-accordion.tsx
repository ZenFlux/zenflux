import React from "react";

import { useComponent, useCommandState } from "@zenflux/react-commander/use-commands";

import { useChannelsListAccordionInteractions } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion-interactions";

import Accordion from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion";
import AccordionItem from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components/channel/channel-item-accordion";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";

import type { AccordionItemProps } from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

export function toAccordionItem(
    channel: Channel,
    channelsCommands: ReturnType<typeof useComponent>,
    index: number,
): React.ReactComponentElement<typeof AccordionItem> {
    const accordionProps: Omit<AccordionItemProps, "collapsedState" | "setCollapsedState"> = {
        itemKey: channel.meta.id,

        onRender: () => {},

        children: <ChannelItemAccordion $data={ channel } key={ channel.meta.id }/>,
        heading: {
            title: channel.meta.name,
            icon: channel.meta.icon,
        },
        menu: {
            edit: {
                label: "Edit",
                action: () => channelsCommands.run(
                    "App/ChannelsList/EditRequest",
                    { channel }
                ),
            },
            remove: {
                label: "Remove",
                color: "danger",
                action: () => channelsCommands.run(
                    "App/ChannelsList/RemoveRequest",
                    { channel }
                ),
            },
        },
    };

    const { children, ... withoutChildren } = accordionProps;

    return <AccordionItem { ... withoutChildren }
        key={ "channel-" + channel.meta.id + "-accordion-item-" + index.toString() }>
        { children }
    </AccordionItem>;
}

export const ChannelsListAccordion: React.FC = () => {
    const [ getChannelsListState, setChannelsListState ] = useCommandState<ChannelListState>( "App/ChannelsList" );

    const channelsCommands = useComponent( "App/ChannelsList" );

    const channelsListState = getChannelsListState();

    const setSelected = ( selected: { key: boolean } ) => {
        setChannelsListState( { selected } );
    };

    useChannelsListAccordionInteractions();

    return (
        <Accordion selected={ channelsListState.selected } setSelected={ setSelected }>
            { channelsListState.channels.map( ( i, index ) => toAccordionItem( i, channelsCommands, index ) ) }
        </Accordion>
    );
};

export default ChannelsListAccordion;
