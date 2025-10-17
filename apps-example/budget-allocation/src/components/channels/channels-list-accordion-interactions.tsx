
import React, { useEffect } from "react";

import {
    useComponent,
    useCommandState,
    useChildCommandHook,
    useChildCommandRunner,
    useLocalCommandHook,
    useCommand
} from "@zenflux/react-commander/hooks";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

const waitingForEditableTitle = new Set<string>();

export function useChannelsListAccordionInteractions() {
    const [ getChannelsListState, setChannelsListState ] = useCommandState<ChannelListState>( "App/ChannelsList" );

    const setSelected = React.useCallback( ( selected: { [ key: string ]: boolean } ) =>
        setChannelsListState( { selected } ), [ setChannelsListState ] );

    const component = useComponent( "App/ChannelsList" );

    useChildCommandHook(
        "UI/AccordionItem",
        "UI/AccordionItem/EditTitle",
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

    const editRequest = useCommand( "App/ChannelsList/EditRequest" );

    useLocalCommandHook( "App/ChannelsList/AddRequest", ( r: any, args: any ) => {
        const id = r.meta.id;

        setSelected( { [ id ]: true } );

        editRequest.run( { channel: r } );
    } );

    useLocalCommandHook( "App/ChannelsList/EditRequest", ( r, args: any ) => {
        const { channel } = args;

        setSelected( { [ channel.meta.id ]: true } );

        const enabled = runAccordionItem( channel.meta.id, "UI/AccordionItem/EditableTitle", { state: true } );

        if ( enabled ) return;

        waitingForEditableTitle.add( channel.meta.id );
    } );

    useLocalCommandHook( "App/ChannelsList/RemoveRequest", ( r, args: any ) => {
        const { channel } = args;

        const newList = getChannelsListState().channels.filter( ( c ) => c.meta.id !== channel.meta.id );

        setChannelsListState( {
            ... getChannelsListState(),
            channels: newList,
        } );
    } );

    useEffect( () => {
        requestAnimationFrame( () => {
            for ( const id of waitingForEditableTitle.values() ) {
                const enabled = runAccordionItem( id, "UI/AccordionItem/EditableTitle", { state: true } );

                if ( enabled ) {
                    waitingForEditableTitle.delete( id );
                }
            }
        } );
    }, [waitingForEditableTitle.values()] );
}
