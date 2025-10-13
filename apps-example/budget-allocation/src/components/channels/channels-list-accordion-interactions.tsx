import EventEmitter from "eventemitter3";

import React from "react";

import {
    useComponent,
    useCommandState,
    useChildCommandHook,
    useChildCommandRunner,
    useLocalCommandHook,
} from "@zenflux/react-commander/use-commands";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

const scheduler = new EventEmitter();

export function useChannelsListAccordionInteractions() {
    const [ getChannelsListState, setChannelsListState ] = useCommandState<ChannelListState>( "App/ChannelsList" );

    const setSelected = React.useCallback( ( selected: { [ key: string ]: boolean } ) =>
        setChannelsListState( { selected } ), [ setChannelsListState ] );

    const component = useComponent( "App/ChannelsList" );

    useChildCommandHook(
        "UI/AccordionItem",
        "UI/AccordionItem/OnTitleChanged",
        ( _result, args: any ) => {
            component.run( "App/ChannelsList/SetName", {
                id: args.itemKey,
                name: args.title,
            } );
        }
    );

    const runAccordionItem = useChildCommandRunner(
        "UI/AccordionItem",
        ( ctx ) => ctx.props.itemKey
    );

    useLocalCommandHook( "App/ChannelsList/EditRequest", ( r, args: any ) => {
        const { channel } = args;

        setSelected( { [ channel.meta.id ]: true } );

        const enabled = runAccordionItem( channel.meta.id, "UI/AccordionItem/EditableTitle", { state: true } );

        if ( enabled ) return;

        scheduler.once( `enable-editable-title-${ channel.meta.id }`, () =>
            runAccordionItem( channel.meta.id, "UI/AccordionItem/EditableTitle", { state: true } )
        );
    } );

    useLocalCommandHook( "App/ChannelsList/RemoveRequest", ( r, args: any ) => {
        const { channel } = args;

        const newList = getChannelsListState().channels.filter( ( c ) => c.meta.id !== channel.meta.id );

        setChannelsListState( {
            ... getChannelsListState(),
            channels: newList,
        } );
    } );
}
