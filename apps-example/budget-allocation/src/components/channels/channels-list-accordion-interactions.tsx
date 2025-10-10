import EventEmitter from "events";

import React from "react";

import commandsManager from "@zenflux/react-commander/commands-manager";

import {
    useComponent,
    useCommandMatch,
    useCommandState,
    useChildCommandHook,
    useChildCommandRunner
} from "@zenflux/react-commander/use-commands";

import type { Channel } from "@zenflux/app-budget-allocation/src/query/channels-domain";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

const scheduler = new EventEmitter();

function _onEditRequest(
    channel: Channel,
    setSelected: ( selected: { [ key: string ]: boolean } ) => void,
    runAccordionItem: ReturnType<typeof useChildCommandRunner>,
) {
    setSelected( { [ channel.meta.id ]: true } );

    const enabled = runAccordionItem( channel.meta.id, "UI/AccordionItem/EditableTitle", { state: true } );
    if ( enabled ) return;

    scheduler.once( `enable-editable-title-${ channel.meta.id }`, () =>
        runAccordionItem( channel.meta.id, "UI/AccordionItem/EditableTitle", { state: true } )
    );
}

function _onRemoveRequest(
    channel: Channel,
    getChannelsListState: ReturnType<typeof useCommandState<ChannelListState>>[ 0 ],
    setChannelsListState: ReturnType<typeof useCommandState<ChannelListState>>[ 1 ]
) {
    const newList = getChannelsListState().channels.filter( ( c ) => c.meta.id !== channel.meta.id );

    setChannelsListState( {
        ... getChannelsListState(),
        channels: newList,
    } );
}

function onAddRequest(
    getChannelsListState: ReturnType<typeof useCommandState<ChannelListState>>[ 0 ],
    setChannelsListState: ReturnType<typeof useCommandState<ChannelListState>>[ 1 ],
    channelsCommands: ReturnType<typeof useComponent>
) {
    const id = `channel-${ Math.random().toString( 16 ).slice( 2 ) }`;

    const newChannel: Channel = {
        meta: {
            id,
            name: "New Channel #" + ( getChannelsListState().channels.length + 1 ),
            icon: `https://api.dicebear.com/7.x/icons/svg?seed=${ performance.now() }`,
            createdAt: new Date().getTime(),
        },
        frequency: "annually",
        baseline: "0",
        allocation: "equal",
        breaks: [],
    };

    const currentState = getChannelsListState();

    setChannelsListState( {
        ... currentState,
        channels: [ ... currentState.channels, newChannel ]
    } );

    setTimeout( () => {
        channelsCommands.run( "App/ChannelsList/EditRequest", { channel: newChannel } );
    }, 100 );
}

export function useChannelsListAccordionInteractions() {
    const [ getChannelsListState, setChannelsListState, isMounted ] = useCommandState<ChannelListState>( "App/ChannelsList" );

    const setSelected = React.useCallback( ( selected: { [ key: string ]: boolean } ) =>
        setChannelsListState( { selected } ), [ setChannelsListState ] );

    const channelsCommands = useComponent( "App/ChannelsList" );

    const addChannelCommands = useCommandMatch( "App/AddChannel" );

    useChildCommandHook(
        "UI/AccordionItem",
        "UI/AccordionItem/OnTitleChanged",
        ( _result, args: any ) => {
            channelsCommands.run( "App/ChannelsList/SetName", {
                id: args.itemKey,
                name: args.title,
            } );
        }
    );

    const runAccordionItem = useChildCommandRunner(
        "UI/AccordionItem",
        ( ctx ) => ctx.props.itemKey
    );

    const mountedValue = isMounted();

    React.useEffect( () => {
        channelsCommands.hook( "App/ChannelsList/EditRequest", ( r, args: any ) =>
            _onEditRequest( args.channel, setSelected, runAccordionItem ) );

        channelsCommands.hook( "App/ChannelsList/RemoveRequest", ( r, args: any ) =>
            _onRemoveRequest( args.channel, getChannelsListState, setChannelsListState ) );

        return () => {
            commandsManager.unhookWithinComponent( channelsCommands.getId() );
        };
    }, [ channelsCommands, getChannelsListState, setChannelsListState, runAccordionItem, setSelected, mountedValue ] );

    React.useEffect( () => {
        if ( ! addChannelCommands || addChannelCommands.length === 0 ) return;

        const addChannelCommandId = {
            commandName: "App/AddChannel",
            componentName: "App/AddChannel",
            componentNameUnique: addChannelCommands[ 0 ].componentNameUnique,
        };

        const ownerId = channelsCommands.getId();
        const handle = commandsManager.hookScoped( addChannelCommandId, ownerId, () =>
            onAddRequest( getChannelsListState, setChannelsListState, channelsCommands )
        );

        return () => {
            commandsManager.unhookHandle( handle );
        };
    }, [ addChannelCommands, channelsCommands, getChannelsListState, setChannelsListState, mountedValue ] );
}
