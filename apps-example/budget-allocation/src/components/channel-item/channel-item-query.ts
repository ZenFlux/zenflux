import { QueryItemModuleBase } from "@zenflux/react-commander/query/module-base";

import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager";

import { CHANNEL_LIST_STATE_DATA, CHANNEL_LIST_STATE_DATA_WITH_META } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type { Channel, ChannelItemApiResponse } from "@zenflux/app-budget-allocation/src/query/channels-domain";

export class ChannelItemQuery extends QueryItemModuleBase<ChannelItemApiResponse> {
    private autosave: ReturnType<typeof queryCreateAutoSaveManager<Channel, Channel & { key: string }>>;

    public constructor( client: QueryClient ) {
        super( client );
        this.registerEndpoints();

        this.autosave = queryCreateAutoSaveManager<Channel, Channel & { key: string }>( {
            getKey: ( state ) => state.meta.id,
            pickToSave: ( state ) => {
                const payload = pickEnforcedKeys( state, CHANNEL_LIST_STATE_DATA ) as Channel;
                return { key: state.meta.id, ... payload };
            },
            save: async ( input ) => {
                await this.router.save( input as ChannelItemApiResponse & { key: string } );
            },
            debounceMs: 800,
            intervalMs: 5000,
        } );
    }

    public static getName(): string {
        return "Query/ChannelItemQuery";
    }

    protected getResourceName(): string {
        return "channels";
    }

    protected registerEndpoints(): void {
        this.defineEndpoint<ChannelItemApiResponse, Channel>( "App/ChannelItem", {
            method: "GET",
            path: "v1/channels/:key",
        } );

        this.register( "POST", "App/ChannelItem", "v1/channels/:key" );
    }

    protected async requestHandler( _element: DCommandFunctionComponent, request: Record<string, unknown> ): Promise<Record<string, unknown>> {
        const meta = request.meta as { id: string };

        return { key: meta.id };
    }

    protected async responseHandler( element: DCommandFunctionComponent, response: Response ): Promise<unknown> {
        const result = await response.json();

        return pickEnforcedKeys( result, CHANNEL_LIST_STATE_DATA_WITH_META );
    }

    protected onMount( context: DCommandSingleComponentContext, resource?: ChannelItemApiResponse ) {
        if ( resource ) {
            context.setState( {
                ... context.getState(),
                ... this.transformChannelFromApi( resource ),
            } );
        }
    }

    protected onUnmount( context: DCommandSingleComponentContext, resource: ChannelItemApiResponse ) {
        if ( resource?.meta?.id ) {
            this.autosave.queryFlushKey( resource.meta.id );
        } else {
            this.autosave.queryFlush();
        }
    }

    protected onContextStateUpdated( context: DCommandSingleComponentContext ) {
        this.autosave.queryUpsert( context.getState() );
    }

    private transformChannelFromApi( apiResponse: ChannelItemApiResponse ): Channel {
        const breaks = apiResponse.breaks?.map( ( breakItem ) => ( {
            date: new Date( breakItem.date ),
            value: breakItem.value,
        } ) );

        return {
            meta: apiResponse.meta,
            frequency: apiResponse.frequency,
            baseline: apiResponse.baseline,
            allocation: apiResponse.allocation,
            breaks,
        };
    }

}

