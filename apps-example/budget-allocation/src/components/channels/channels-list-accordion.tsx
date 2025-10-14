import React from "react";

import { useComponent, useCommandStateSelector } from "@zenflux/react-commander/use-commands";

import { QueryComponent } from "@zenflux/react-commander/query/component";

import Accordion from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion";
import AccordionItem from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";
import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-accordion";

import { useChannelsListAccordionInteractions } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion-interactions";

import { ChannelItemQuery } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-query";

import type { Channel, ChannelItemApiResponse } from "@zenflux/app-budget-allocation/src/query/channels-domain";
import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";
import type { AccordionItemProps } from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

function toAccordionItem(
    channel: Channel,
    channelsCommands: ReturnType<typeof useComponent>,
    index: number,
): React.ReactComponentElement<typeof AccordionItem> {
    const accordionProps: Omit<AccordionItemProps, "collapsedState" | "setCollapsedState"> = {
        itemKey: channel.meta.id,

        onRender: () => {},

        children: (
            <QueryComponent<ChannelItemApiResponse, { meta: Channel["meta"] }, ChannelItemApiResponse>
                fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
                module={ ChannelItemQuery }
                component={ ChannelItemAccordion }
                props={ { meta: channel.meta } }
            />
        ),
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

    return <AccordionItem
        unmount
        key={ "channel-" + channel.meta.id + "-accordion-item-" + index.toString() }
        { ... withoutChildren }
    >
        { children }
    </AccordionItem>;
}

export const ChannelsListAccordion: React.FC = () => {
    const [ state, setState ] = useCommandStateSelector<ChannelListState, ChannelListState>( "App/ChannelsList",
        ( state ) => ({
            channels: state.channels,
            selected: state.selected,
        })
    );

    const channelsCommands = useComponent( "App/ChannelsList" );

    const setSelected: React.Dispatch<React.SetStateAction<{ [ key: string ]: boolean }>> = ( value ) => {
        const next = typeof value === "function"
            ? value( state.selected || {} )
            : value;

        setState( { selected: next } );
    };

    useChannelsListAccordionInteractions();

    return (
        <Accordion selected={ state.selected } setSelected={ setSelected }>
            { state.channels.map( ( i, index ) => toAccordionItem( i, channelsCommands, index ) ) }
        </Accordion>
    );
};

export default ChannelsListAccordion;
