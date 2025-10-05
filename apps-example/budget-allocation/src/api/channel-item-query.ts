import { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager";

import { CHANNEL_LIST_STATE_DATA_WITH_META } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { transformChannelFromApi } from "@zenflux/app-budget-allocation/src/api/channels-domain";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type { Channel, ChannelItemApiResponse } from "@zenflux/app-budget-allocation/src/api/channels-domain";

export class ChannelItemQuery extends QueryModuleBase<Channel> {
    private autosave: ReturnType<typeof queryCreateAutoSaveManager<Channel, Channel & { key: string }>>;

    public constructor( core: QueryClient ) {
        super( core );
        this.registerEndpoints();

        this.autosave = queryCreateAutoSaveManager<Channel, Channel & { key: string }>( {
            getKey: ( state ) => state.meta.id,
            pickToSave: ( state ) => {
                const payload = pickEnforcedKeys( state, CHANNEL_LIST_STATE_DATA_WITH_META ) as Channel;
                return { key: state.meta.id, ... payload };
            },
            save: async ( input ) => {
                await this.router.save( input as Channel & { key: string } );
            },
            debounceMs: 800,
            intervalMs: 5000,
        } );
    }

    public static getName(): string {
        return "channel";
    }

    protected getResourceName(): string {
        return "channels";
    }

    private registerEndpoints(): void {
        this.defineEndpoint<ChannelItemApiResponse, Channel>( "App/ChannelItem", {
            method: "GET",
            path: "v1/channels/:key",
            prepareData: ( apiResponse ) => transformChannelFromApi( apiResponse )
        } );

        this.register( "POST", "App/ChannelItem", "v1/channels/:key" );
    }

    protected async requestHandler( element: DCommandFunctionComponent, request: Record<string, unknown> ): Promise<Record<string, unknown>> {
        if ( request.meta ) {
            const meta = request.meta as { id: string };
            return { key: meta.id };
        }

        return request;
    }

    protected async responseHandler( element: DCommandFunctionComponent, response: Response ): Promise<unknown> {
        return await response.json();
    }

    protected onMount( context: DCommandSingleComponentContext ) {
        this.onChannelItemMount( context );
    }

    protected onUnmount( context: DCommandSingleComponentContext ) {
        this.onChannelItemUnmount( context );
    }

    protected onUpdate( context: DCommandSingleComponentContext, state: {
        currentState: any,
        prevState: any,
        currentProps: any
    } ) {
        void this.autosave.queryUpsert( { ... state.currentProps, ... state.currentState } );
    }

    private async onChannelItemMount( context: DCommandSingleComponentContext ) {
        const key = context.props.meta.id as string;

        try {
            await this.router.queryPrefetchItem( key );
            const cached = this.router.queryGetCachedItem( key );

            if ( cached && context.isMounted() ) {
                context.setState( cached );
            }
        } catch ( error ) {
            console.warn( "An error occurred while fetching API data, the state will not be updated, this area considered to be safe", error );
        }
    }

    private async onChannelItemUnmount( context: DCommandSingleComponentContext ) {
        await this.autosave.queryFlushKey( context.props.meta.id );
    }
}

