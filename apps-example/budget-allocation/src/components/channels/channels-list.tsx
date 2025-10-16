import React from "react";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { getQueryModule } from "@zenflux/react-commander/query/provider";

import { ChannelsListQuery } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-query";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";
import type { ChannelListProps, ChannelListState } from "@zenflux/app-budget-allocation/src/components/channels/channels-types";
import type { Channel } from "@zenflux/app-budget-allocation/src/query/channels-domain";

const AccordionChannelsList = React.lazy( () => import( "@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion" ) );

const TableChannelsList = React.lazy( () => import( "@zenflux/app-budget-allocation/src/components/channels/channels-list-table" ) );

export const ChannelsList: DCommandFunctionComponent<ChannelListProps & { $data?: Channel[] }, ChannelListState> = ( props ) => {
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
    class AddRequest extends CommandBase {
        public static getName() {
            return "App/ChannelsList/AddRequest";
        }

        public async apply() {
            const queryModule = getQueryModule( ChannelsListQuery );

            const channel = await queryModule.request( "App/ChannelsList/AddChannel" );

            this.setState( { channels: [ ... this.state.channels, channel ] } );

            return channel;
        }
    },
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

