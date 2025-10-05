import commandsManager from "@zenflux/react-commander/commands-manager";

import { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager";
import { queryDiffById } from "@zenflux/react-commander/query/list-diff";

import { CHANNEL_LIST_STATE_DATA_WITH_META } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { transformChannelFromApi } from "@zenflux/app-budget-allocation/src/api/channels-domain";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type {
    Channel,
    ChannelListApiResponse
} from "@zenflux/app-budget-allocation/src/api/channels-domain";

interface ChannelsListState extends Record<string, Channel[] | Record<string, boolean>> {
    channels: Channel[];
    selected: Record<string, boolean>;
}

interface ChannelsListSavePayload {
    key: string;
    channels: Channel[];
    [ key: string ]: string | Channel[];
}

export class ChannelsListQuery extends QueryModuleBase<Channel> {
    private autosave: ReturnType<typeof queryCreateAutoSaveManager<ChannelsListState, ChannelsListSavePayload>>;

    public constructor( core: QueryClient ) {
        super( core );
        this.registerEndpoints();

        this.autosave = queryCreateAutoSaveManager<ChannelsListState, ChannelsListSavePayload>( {
            getKey: () => "channels-list",
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

    private registerEndpoints(): void {
        this.defineEndpoint<ChannelListApiResponse[], Channel[]>( "App/ChannelsList", {
            method: "GET",
            path: "v1/channels",
            prepareData: ( apiResponse ) => apiResponse.map( ( item ) => transformChannelFromApi( {
                meta: item.meta,
                frequency: item.frequency,
                baseline: item.baseline,
                allocation: item.allocation,
                breaks: item.breaks,
            } ) )
        } );

        this.register( "POST", "App/ChannelsListSave", "v1/channels/list" );
        this.register( "POST", "App/ChannelsReset", "v1/channels/reset" );
    }

    protected async requestHandler( element: DCommandFunctionComponent, request: Record<string, unknown> ): Promise<Record<string, unknown>> {
        return request;
    }

    protected async responseHandler( element: DCommandFunctionComponent, response: Response ): Promise<unknown> {
        return await response.json();
    }

    protected onMount( context: DCommandSingleComponentContext ) {
        this.onChannelsListMount( context );
    }

    protected onUnmount( context: DCommandSingleComponentContext ) {
        this.onChannelsListUnmount( context );
    }

    protected onUpdate( context: DCommandSingleComponentContext, state: {
        currentState: Readonly<ChannelsListState>,
        prevState: Readonly<ChannelsListState>,
        currentProps: Readonly<Record<string, string>>,
        prevProps: Readonly<Record<string, string>>,
        snapshot: never
    } ) {
        const { currentState, prevState } = state;

        if ( currentState.channels !== prevState.channels ) {
            this.onChannelsChanged( prevState.channels, currentState.channels );
        }
    }

    private onChannelsListMount( context: DCommandSingleComponentContext ) {
        const commands = commandsManager.get( "UI/Accordion", true );

        if ( ! commands ) return;

        const onSelectionAttached = commands[ "UI/Accordion/onSelectionAttached" ],
            onSelectionDetached = commands[ "UI/Accordion/onSelectionDetached" ];

        const saveChannelsCallback = async () => {
            const state = context.getState<ChannelsListState>();

            this.autosave.queryUpsert( state );

            await this.autosave.queryFlush();
        };

        onSelectionAttached.global().globalHook( saveChannelsCallback );
        onSelectionDetached.global().globalHook( saveChannelsCallback );
    }

    private async onChannelsListUnmount( _context: DCommandSingleComponentContext ) {
        await this.autosave.queryFlush();

        const commands = commandsManager.get( "UI/Accordion", true );

        if ( ! commands ) return;

        const onSelectionAttached = commands[ "UI/Accordion/onSelectionAttached" ],
            onSelectionDetached = commands[ "UI/Accordion/onSelectionDetached" ];

        onSelectionAttached.global().globalUnhook();
        onSelectionDetached.global().globalUnhook();
    }

    private onChannelsChanged( prevChannels: Channel[], currentChannels: Channel[] ) {
        for ( let i = 0 ; i < currentChannels.length ; i++ ) {
            if ( ! prevChannels[ i ] || ! currentChannels[ i ] ) continue;
            if ( prevChannels[ i ].meta !== currentChannels[ i ].meta ) {
                this.onChannelsMetaDataChanged(
                    currentChannels[ i ].meta.id,
                    currentChannels[ i ].meta,
                    prevChannels[ i ].meta
                );
            }
        }

        const { added, removed } = queryDiffById( prevChannels, currentChannels, c => c.meta.id );

        for ( const ch of added ) {
            this.onChannelAdded( ch );
        }
        if ( added.length > 0 ) return;

        for ( const ch of removed ) {
            this.onChannelRemoved( ch.meta.id );
        }
        if ( removed.length > 0 ) return;
    }

    private onChannelAdded( newChannel: Channel ) {
        void this.router.save( {
            key: newChannel.meta.id,
            ... newChannel,
        } as Channel & { key: string } );
    }

    private onChannelRemoved( key: string ) {
        void this.router.remove( key );
    }

    private onChannelsMetaDataChanged( key: string, currentMeta: Channel["meta"], _prevMeta: Channel["meta"] ) {
        void this.router.save( { key, meta: currentMeta } as Channel & { key: string } );
    }
}

