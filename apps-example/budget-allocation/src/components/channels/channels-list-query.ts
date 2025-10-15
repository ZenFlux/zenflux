import commandsManager from "@zenflux/react-commander/commands-manager";

import { QueryListModuleBase } from "@zenflux/react-commander/query/module-base";

import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager";
import { queryDiffById } from "@zenflux/react-commander/query/list-diff";

import { CHANNEL_LIST_STATE_DATA_WITH_META } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { transformChannelFromListApi, transformChannelFromListWithBreaksApi } from "@zenflux/app-budget-allocation/src/query/channels-domain";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { DCommandArgs, DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type {
    Channel,
    ChannelListApiResponse
} from "@zenflux/app-budget-allocation/src/query/channels-domain";

interface ChannelsListState extends Record<string, Channel[] | Record<string, boolean>> {
    channels: Channel[];
    selected: Record<string, boolean>;
}

interface ChannelsListSavePayload {
    key: string;
    channels: Channel[];
    [ key: string ]: string | Channel[];
}

export class ChannelsListQuery extends QueryListModuleBase<Channel> {
    private autosave: ReturnType<typeof queryCreateAutoSaveManager<ChannelsListState, ChannelsListSavePayload>>;

    public constructor( client: QueryClient ) {
        super( client );

        this.autosave = queryCreateAutoSaveManager<ChannelsListState, ChannelsListSavePayload>( {
            getKey: ( _state ) => "channels-list",
            pickToSave: ( state ) => {
                const channels = state.channels.map( ( channel ) =>
                    pickEnforcedKeys( channel, CHANNEL_LIST_STATE_DATA_WITH_META ) as Channel
                );

                return {
                    key: "channels-list",
                    channels
                };
            },
            save: async ( input ) => {
                const payload: Record<string, string | Channel[]> = {
                    key: input.key,
                    channels: input.channels
                };

                await this.api.fetch( "POST", "v1/channels/list", payload, async ( response ) => {
                    return await response.json();
                } );
            },
            debounceMs: 800,
            intervalMs: 5000,
        } );
    }

    public static getName(): string {
        return "channels";
    }

    protected getResourceName(): string {
        return "channels";
    }

    protected registerEndpoints(): void {
        this.defineEndpoint<ChannelListApiResponse[], Channel[]>( "App/ChannelsList", {
            method: "GET",
            path: "v1/channels",
            prepareData: ( apiResponse ) => apiResponse.map( ( item ) => transformChannelFromListApi( item ) )
        } );

        this.register( "POST", "App/ChannelsList/AddChannel", "v1/channels/create" );
        this.register( "POST", "App/ChannelsList/SetName", "v1/channels/set-name" );

        this.register( "POST", "App/ChannelsListSave", "v1/channels/list" );
        this.register( "POST", "App/ChannelsReset", "v1/channels/reset" );
    }

    protected async requestHandler( element: DCommandFunctionComponent, request: Record<string, unknown> ): Promise<Record<string, unknown>> {
        return request;
    }

    protected async responseHandler( element: DCommandFunctionComponent, response: Response ): Promise<unknown> {
        return await response.json();
    }

    protected onMount( context: DCommandSingleComponentContext, resource?: ChannelsListState["channels"] ) {
        context.setState( {
            ... context.getState<ChannelsListState>(),
            channels: resource
        } );

        const accordion = commandsManager.get( "UI/Accordion", true );

        if ( accordion ) {
        const onSelectionAttached = accordion[ "UI/Accordion/onSelectionAttached" ],
            onSelectionDetached = accordion[ "UI/Accordion/onSelectionDetached" ];

        const saveChannelsCallback = async () => {
            const state = context.getState<ChannelsListState>();

            this.autosave.queryUpsert( state );

            await this.autosave.queryFlush();
        };

        onSelectionAttached.global().globalHook( saveChannelsCallback );
            onSelectionDetached.global().globalHook( saveChannelsCallback );
        }

        const channelsList = commandsManager.get( "App/ChannelsList", true );

        if ( channelsList ) {
            const setNameCommand = channelsList[ "App/ChannelsList/SetName" ];

            const setNameHandler = async ( _result?: void, args?: DCommandArgs ) => {
                if ( ! args?.id || ! args?.name ) return;

                await this.request( "App/ChannelsList/SetName", {
                    id: args.id as string,
                    name: args.name as string
                } );
            };

            setNameCommand.global().globalHook( setNameHandler );
        }
    }

    protected onUnmount( context: DCommandSingleComponentContext ) {
        void this.autosave.queryFlush();

        const accordion = commandsManager.get( "UI/Accordion", true );

        if ( accordion ) {
            const onSelectionAttached = accordion[ "UI/Accordion/onSelectionAttached" ],
                onSelectionDetached = accordion[ "UI/Accordion/onSelectionDetached" ];

            onSelectionAttached.global().globalUnhook();
            onSelectionDetached.global().globalUnhook();
        }
        
        const channelsList = commandsManager.get( "App/ChannelsList", true );

        if ( channelsList ) {
            const setNameCommand = channelsList[ "App/ChannelsList/SetName" ];
        
            setNameCommand.global().globalUnhook();
        }
    }
}

export class ChannelsListWithBreaksQuery extends ChannelsListQuery {
    public static getName(): string {
        return "channels-with-breaks";
    }

    protected registerEndpoints(): void {
        this.defineEndpoint<ChannelListApiResponse[], Channel[]>( "App/ChannelsList", {
            method: "GET",
            path: "v1/channels/with-breaks",
            prepareData: ( apiResponse ) => apiResponse.map( ( item ) => transformChannelFromListWithBreaksApi( item ) )
        } );

        this.register( "POST", "App/ChannelsListSave", "v1/channels/list" );
        this.register( "POST", "App/ChannelsReset", "v1/channels/reset" );
    }
}
