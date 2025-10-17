import { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager";

import { CHANNEL_LIST_STATE_DATA } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { transformChannelFromListApi, transformChannelFromItemApi } from "@zenflux/app-budget-allocation/src/query/channels-domain";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type { Channel, ChannelItemApiResponse } from "@zenflux/app-budget-allocation/src/query/channels-domain";

export class ChannelItemQuery extends QueryModuleBase<Channel> {
    private autosave: ReturnType<typeof queryCreateAutoSaveManager<Channel, Channel & { key: string }>>;

    public constructor( core: QueryClient ) {
        super( core );

        this.autosave = queryCreateAutoSaveManager<Channel, Channel & { key: string }>( {
            getKey: ( state ) => state.meta.id,
            pickToSave: ( state ) => {
                const payload = pickEnforcedKeys( state, CHANNEL_LIST_STATE_DATA ) as Channel;
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

    protected registerEndpoints(): void {
        this.defineEndpoint<ChannelItemApiResponse, Channel>( "App/ChannelItem", {
            method: "GET",
            path: "v1/channels/:key",
            prepareData: ( apiResponse ) => transformChannelFromItemApi( apiResponse )
        } );

        this.register( "POST", "App/ChannelItem", "v1/channels/:key" );
    }

    protected async requestHandler( _element: DCommandFunctionComponent, request: Record<string, unknown> ): Promise<Record<string, unknown>> {
        const meta = request.meta as { id: string };

        return { key: meta.id };
    }

    protected async responseHandler( element: DCommandFunctionComponent, response: Response ): Promise<unknown> {
        return await response.json();
    }

    protected async onMount( context: DCommandSingleComponentContext, resource: Channel ) {
    }

    protected async onUnmount( context: DCommandSingleComponentContext ) {
        const state = context.getState<Channel>();

        if ( state?.meta?.id ) {
            await this.autosave.queryFlushKey( state.meta.id );
        } else {
            await this.autosave.queryFlush();
        }
    }

    protected onUpdate( _context: DCommandSingleComponentContext, state: {
        currentState: Readonly<Channel>,
        prevState: Readonly<Channel>,
        currentProps: Readonly<{ meta: Channel["meta"] }>,
        prevProps: Readonly<{ meta: Channel["meta"] }>,
        snapshot: never
    } ) {
        if ( ! state.currentState.meta || ! state.currentState.meta.id ) return;

        void this.autosave.queryUpsert( state.currentState );
    }
}

