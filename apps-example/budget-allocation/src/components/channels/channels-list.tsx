import React from "react";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { META_DATA_KEYS } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

import type { ChannelListProps, ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";

import type { Channel } from "@zenflux/app-budget-allocation/src/api/channels-domain";

const AccordionChannelsList = React.lazy( () => import( "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion" ) );

const TableChannelsList = React.lazy( () => import( "@zenflux/app-budget-allocation/src/components/channels/channels-list-table" ) );

export const ChannelsList: DCommandFunctionComponent<ChannelListProps & { $data: Channel[] }, ChannelListState> = ( props, state ) => {
    const channels = props.$data;

    state.channels = channels.map( ( channel ) => {
        return {
            ... channel,
            meta: pickEnforcedKeys( channel.meta, META_DATA_KEYS )
        };
    } );

    switch ( props.view ) {
        case "accordion":
            return <AccordionChannelsList />;

        case "table":
            return <TableChannelsList />;

        default:
            throw new Error( `Unknown view: ${ props.view }` );
    }
};

const $$ = withCommands( "App/ChannelsList", ChannelsList, {
    channels: [],
    selected: {},
}, [
    class EditRequest extends CommandBase {
        public static getName() {
            return "App/ChannelsList/EditRequest";
        }
    },
    class Remove extends CommandBase {
        public static getName() {
            return "App/ChannelsList/RemoveRequest";
        }
    },
    class SetName extends CommandBase<ChannelListState> {
        public static getName() {
            return "App/ChannelsList/SetName";
        }

        public apply( args: { id: string, name: string } ) {
            const channels = [ ... this.state.channels ];

            const channelIndex = channels.findIndex( ( c ) => c.meta.id === args.id );

            if ( channelIndex !== -1 ) {
                channels[ channelIndex ] = {
                    ... channels[ channelIndex ],
                    meta: {
                        ... channels[ channelIndex ].meta,
                        name: args.name,
                    },
                };

                return this.setState( { channels } );
            }
        }
    }
] );

export default $$;

