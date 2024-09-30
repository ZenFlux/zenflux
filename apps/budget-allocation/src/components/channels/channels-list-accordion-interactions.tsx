import EventEmitter from "events";

import React from "react";

import commandsManager from "@zenflux/react-commander/commands-manager";

import {
    useCommanderComponent,
    useAnyComponentCommands,
    useCommanderState,
    useCommanderChildrenComponents
} from "@zenflux/react-commander/use-commands";

import ChannelItemAccordion from "@zenflux/app-budget-allocation/src/components//channel/channel-item-accordion.tsx";

import type { ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

import type { ChannelItemAccordionComponent } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

const scheduler = new EventEmitter();

// On channel list, request edit title name
function onEditRequest(
    channel: ChannelItemAccordionComponent,
    setSelected: ( selected: { [ key: string ]: boolean } ) => void,
    channelsCommands: ReturnType<typeof useCommanderComponent>,
    accordionItemCommands: ReturnType<typeof useCommanderChildrenComponents>,
) {
    // Select the channel (trigger accordion item selection)
    setSelected( { [ channel.props.meta.id ]: true } );

    const correspondingCommand = accordionItemCommands.find( ( command ) => {
        return command.getInternalContext().props.itemKey === channel.props.meta.id;
    } );

    const tryToEnableEdit = ( correspondingCommand: any ) => {
        // Try tell accordion to enter edit mode
        correspondingCommand?.run( "UI/AccordionItem/EditableTitle", { state: true } );

        return correspondingCommand;
    };

    if ( tryToEnableEdit( correspondingCommand ) ) return;

    scheduler.once( `enable-editable-title-${ channel.props.meta.id }`, tryToEnableEdit );
}

function onRemoveRequest(
    channel: ChannelItemAccordionComponent,
    getChannelsListState: ReturnType<typeof useCommanderState<ChannelListState>>[ 0 ],
    setChannelsListState: ReturnType<typeof useCommanderState<ChannelListState>>[ 1 ]
) {
    const newList = getChannelsListState().channels.filter( ( c ) => c.props.meta.id !== channel.props.meta.id );

    // Remove the channel from the list
    setChannelsListState( {
        ... getChannelsListState(),
        channels: newList,
    } );
}

function onAddRequest(
    getChannelsListState: ReturnType<typeof useCommanderState<ChannelListState>>[ 0 ],
    setChannelsListState: ReturnType<typeof useCommanderState<ChannelListState>>[ 1 ],
    channelsCommands: ReturnType<typeof useCommanderComponent>
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
    const [ getChannelsListState, setChannelsListState, isMounted ] = useCommanderState<ChannelListState>( "App/ChannelsList" );

    const setSelected = ( selected: { [ key: string ]: boolean } ) => setChannelsListState( { selected } );

    const channelsCommands = useCommanderComponent( "App/ChannelsList" );

    useCommanderChildrenComponents( "UI/AccordionItem", ( accordionItemCommands ) => {
        if ( ! accordionItemCommands.length ) return;

        // Hook on title changed, run command within the channel list, to inform about the change
        accordionItemCommands.forEach( ( command ) => {
            if ( ! command.isAlive() ) return;

            command.hook( "UI/AccordionItem/OnTitleChanged", ( result, args ) => {
                channelsCommands.run( "App/ChannelsList/SetName", {
                    id: args!.itemKey,
                    name: args!.title,
                } );
            } );

            // This will ensure that the accordion item will enter edit mode, if the channel list requested it
            const key = `enable-editable-title-${ command.getInternalContext().props.itemKey }`;
            if ( scheduler.eventNames().includes( key ) ) {
                scheduler.emit( key, command );
                scheduler.removeAllListeners( key );
            }
        } );

        channelsCommands.hook( "App/ChannelsList/EditRequest", ( r, args: any ) =>
            onEditRequest( args.channel, setSelected, channelsCommands, accordionItemCommands ) );

        channelsCommands.hook( "App/ChannelsList/RemoveRequest", ( r, args: any ) =>
            onRemoveRequest( args.channel, getChannelsListState, setChannelsListState ) );

        return () => {
            accordionItemCommands.forEach( ( command ) => {
                command.unhook( "UI/AccordionItem/OnTitleChanged" );
            } );

            commandsManager.unhookWithinComponent( channelsCommands.getId() );
        };
    } );

    React.useEffect( () => {
        const addChannelCommands = useAnyComponentCommands( "App/AddChannel" );
        const addChannelCommandId = {
            commandName: "App/AddChannel",
            componentName: "App/AddChannel",
            componentNameUnique: addChannelCommands[ 0 ].componentNameUnique,
        };

        commandsManager.hook( addChannelCommandId, () =>
            onAddRequest( getChannelsListState, setChannelsListState, channelsCommands )
        );

        return () => {
            commandsManager.unhookWithinComponent( addChannelCommandId.componentNameUnique );
        };
    }, [ isMounted() ] );
}
