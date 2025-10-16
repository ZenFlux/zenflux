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
import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

const ChannelContent = React.memo<{ channelId: string, meta: Channel["meta"] }>( ( { channelId, meta } ) => {
    return (
        <QueryComponent<ChannelItemApiResponse, { meta: Channel["meta"] }, ChannelItemApiResponse, ChannelState>
            key={ channelId }
            fallback={ <div className="loading">Loading <span className="dots">◌</span></div> }
            module={ ChannelItemQuery }
            component={ ChannelItemAccordion }
            props={ { meta } }
        />
    );
}, ( prevProps, nextProps ) => {
    const shouldNotRerender = prevProps.channelId === nextProps.channelId;

    return shouldNotRerender;
} );

ChannelContent.displayName = "ChannelContent";

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
            { state.channels.map( ( channel ) => {
                const heading = { title: channel.meta.name, icon: channel.meta.icon };
                const menu = {
                    edit: {
                        label: "Edit",
                        action: () => channelsCommands.run( "App/ChannelsList/EditRequest", { channel } )
                    },
                    remove: {
                        label: "Remove",
                        color: "danger" as const,
                        action: () => channelsCommands.run( "App/ChannelsList/RemoveRequest", { channel } )
                    },
                };

                return (
                    <AccordionItem
                        unmount
                        key={ channel.meta.id }
                        itemKey={ channel.meta.id }
                        heading={ heading }
                        menu={ menu }
                        onRender={ () => {
                        } }
                    >
                        <ChannelContent channelId={ channel.meta.id } meta={ channel.meta } />
                    </AccordionItem>
                );
            } ) }
        </Accordion>
    );
};

export default ChannelsListAccordion;
