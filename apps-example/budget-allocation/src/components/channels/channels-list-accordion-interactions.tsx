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

import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components//channel/channel-item-accordion.tsx";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

import type { ChannelItemAccordionComponent } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

const scheduler = new EventEmitter();

// On channel list, request edit title name
function _onEditRequest(
    channel: ChannelItemAccordionComponent,
    setSelected: ( selected: { [ key: string ]: boolean } ) => void,
    runAccordionItem: ReturnType<typeof useChildCommandRunner>,
) {
    // Select the channel (trigger accordion item selection)
    setSelected( { [ channel.props.meta.id ]: true } );

    const enabled = runAccordionItem( channel.props.meta.id, "UI/AccordionItem/EditableTitle", { state: true } );
    if ( enabled ) return;

    scheduler.once( `enable-editable-title-${ channel.props.meta.id }`, () =>
        runAccordionItem( channel.props.meta.id, "UI/AccordionItem/EditableTitle", { state: true } )
    );
}

function _onRemoveRequest(
    channel: ChannelItemAccordionComponent,
    getChannelsListState: ReturnType<typeof useCommandState<ChannelListState>>[ 0 ],
    setChannelsListState: ReturnType<typeof useCommandState<ChannelListState>>[ 1 ]
) {
    const newList = getChannelsListState().channels.filter( ( c ) => c.props.meta.id !== channel.props.meta.id );

    // Remove the channel from the list
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

    // Create a new channel object
    const newChannelProps = {
        meta: {
            id,
            name: "New Channel #" + ( getChannelsListState().channels.length + 1 ),
            icon: `https://api.dicebear.com/7.x/icons/svg?seed=${ performance.now() }`,
            createdAt: new Date().getTime(),
        },

        onRender: () => channelsCommands.run( "App/ChannelsList/EditRequest", { channel: newChannelComponent } ),
    };

    // Create a new ChannelItem component with the new channel object as props
    const newChannelComponent = <ChannelItemAccordion{ ... newChannelProps }
        key={ newChannelProps.meta.id }/>;

    const currentState = getChannelsListState();

    // Add the new ChannelItem component to the channelsState array
    setChannelsListState( {
        ... currentState,
        channels: [ ... currentState.channels, newChannelComponent ]
    } );
}

export function channelsListAccordionInteractions() {
    const [ getChannelsListState, setChannelsListState, isMounted ] = useCommandState<ChannelListState>( "App/ChannelsList" );

    const setSelected = ( selected: { [ key: string ]: boolean } ) => setChannelsListState( { selected } );

    const channelsCommands = useComponent( "App/ChannelsList" );

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

    React.useEffect( () => {
        channelsCommands.hook( "App/ChannelsList/EditRequest", ( r, args: any ) =>
            _onEditRequest( args.channel, setSelected, runAccordionItem ) );

        channelsCommands.hook( "App/ChannelsList/RemoveRequest", ( r, args: any ) =>
            _onRemoveRequest( args.channel, getChannelsListState, setChannelsListState ) );

        return () => {
            commandsManager.unhookWithinComponent( channelsCommands.getId() );
        };
    }, [ isMounted() ] );

    React.useEffect( () => {
        const addChannelCommands = useCommandMatch( "App/AddChannel" );
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
    }, [ isMounted() ] );
}
