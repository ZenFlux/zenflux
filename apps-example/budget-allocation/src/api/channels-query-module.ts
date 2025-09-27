import commandsManager from "@zenflux/react-commander/commands-manager";

import { QueryModuleBase } from "@zenflux/react-commander/query/module-base";

import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager";
import { queryDiffById } from "@zenflux/react-commander/query/list-diff";

import { CHANNEL_LIST_STATE_DATA_WITH_META } from "@zenflux/app-budget-allocation/src/components/channel/channel-constants";

import { pickEnforcedKeys } from "@zenflux/app-budget-allocation/src/utils";

import type { QueryComponent } from "@zenflux/react-commander/query/component";
import type { DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type { QueryClient } from "@zenflux/react-commander/query/client";

export class ChannelsQueryModule extends QueryModuleBase {
    private autosave: ReturnType<typeof queryCreateAutoSaveManager<Record<string, unknown>, { key: string } & Record<string, unknown>>>;

    public constructor( core: QueryClient ) {
        super( core );
        this.registerEndpoints();

        this.autosave = queryCreateAutoSaveManager<Record<string, unknown>, { key: string } & Record<string, unknown>>( {
            getKey: ( state ) => ( state as { meta: { id: string } } ).meta.id,
            pickToSave: ( state ) => {
                const s = state as { meta: { id: string } } & Record<string, unknown>;
                const payload = pickEnforcedKeys( s, CHANNEL_LIST_STATE_DATA_WITH_META ) as Record<string, unknown>;
                return { key: s.meta.id, ... payload } as { key: string } & Record<string, unknown>;
            },
            save: async ( input ) => {
                await this.router.save( input );
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
        this.register( "GET", "App/ChannelsList", "v1/channels" );
        this.register( "GET", "App/ChannelItem", "v1/channels/:key" );
        this.register( "POST", "App/ChannelItem", "v1/channels/:key" );
    }

    protected async requestHandler( component: QueryComponent, element: DCommandFunctionComponent, request: any ): Promise<any> {
        return request;
    }

    protected async responseHandler( component: QueryComponent, element: DCommandFunctionComponent, response: Response ): Promise<any> {
        const result = await response.json();

        return this.handleResponseBasedOnElementName( element.getName!(), result, component );
    }

    // Handle the mounting of the component. This involves different handling depending on the component name.
    protected onMount( component: QueryComponent, context: DCommandSingleComponentContext ) {
        switch ( context.componentName ) {
            case "App/ChannelsList":
                this.onChannelsListMount( component, context );
                break;
            case "App/ChannelItem":
                this.onChannelItemMount( component, context );
                break;
            default:
                throw new Error( `ChannelsQueryModule: onMount() - Unknown component: ${ context.componentName }` );
        }
    }

    protected onUnmount( component: QueryComponent, context: DCommandSingleComponentContext ) {
        switch ( context.componentName ) {
            case "App/ChannelsList":
                this.onChannelsListUnmount( component, context );
                break;
            case "App/ChannelItem":
                this.onChannelItemUnmount( component, context );
                break;
            default:
                throw new Error( `ChannelsQueryModule: onUnmount() - Unknown component: ${ context.componentName }` );
        }
    }

    // Handle the updating of the component. This involves different handling depending on the component name.
    protected onUpdate( component: QueryComponent, context: DCommandSingleComponentContext, state: {
        currentState: any,
        prevState: any,
        currentProps: any
    } ) {
        const { currentState, prevState } = state;
        switch ( context.componentName ) {
            case "App/ChannelsList":
                if ( currentState.channels !== prevState.channels ) {
                    this.onChannelsChanged( prevState.channels, currentState.channels );
                }
                break;
            case "App/ChannelItem":
                void this.autosave.queryUpsert( { ... state.currentProps, ... state.currentState } );
                break;
            default:
                throw new Error( `ChannelsQueryModule: onUpdate() - Unknown component: ${ context.componentName }` );
        }
    }

    // Handle the API response based on the element name. This allows different handling for different types of responses.
    private handleResponseBasedOnElementName( elementName: string, result: any, component: QueryComponent ) {
        switch ( elementName ) {
            case "App/ChannelsList":
                return this.handleChannelsListResponse( result, component );
            case "App/ChannelItem":
                return this.handleChannelItemResponse( result );
            default:
                return result;
        }
    }

    // Handle the response for the channels list. This involves mapping over the result and creating a new object for each item.
    private handleChannelsListResponse( result: any, component: QueryComponent ) {
        return {
            children: result.map( ( i: any ) => {
                const key = i.key;
                delete i.key;
                return {
                    key,
                    props: i,
                    type: component.props.children!.props.type,
                };
            } ),
        };
    }

    // Handle the response for an individual channel item. This involves creating a new object with the key and breaks properties modified.
    private handleChannelItemResponse( result: any ) {
        if ( result.breaks ) {
            result.breaks = result.breaks.map( ( i: any ) => ( {
                ... i,
                date: new Date( i.date ),
            } ) );
        }
        return result;
    }

    // Handle the mounting of the channels list. This involves setting up a timer to auto save channels every 5 seconds.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onChannelsListMount( component: QueryComponent, context: DCommandSingleComponentContext ) {
        const commands = commandsManager.get( "UI/Accordion", true );

        if ( ! commands ) return;

        const onSelectionAttached = commands[ "UI/Accordion/onSelectionAttached" ],
            onSelectionDetached = commands[ "UI/Accordion/onSelectionDetached" ];

        const saveChannelsCallback = () => {
            void this.autosave.queryFlush();
        };

        onSelectionAttached.global().globalHook( saveChannelsCallback );
        onSelectionDetached.global().globalHook( saveChannelsCallback );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onChannelsListUnmount( component: QueryComponent, context: DCommandSingleComponentContext ) {
        void this.autosave.queryFlush();

        const commands = commandsManager.get( "UI/Accordion", true );

        if ( ! commands ) return;

        const onSelectionAttached = commands[ "UI/Accordion/onSelectionAttached" ],
            onSelectionDetached = commands[ "UI/Accordion/onSelectionDetached" ];

        onSelectionAttached.global().globalUnhook();
        onSelectionDetached.global().globalUnhook();
    }

    // Handle the mounting of an individual channel item. This involves fetching the channel data from the API and updating the state if necessary.
    private async onChannelItemMount( component: QueryComponent, context: DCommandSingleComponentContext ) {
        const key = context.props.meta.id;

        try {
            await this.router.queryPrefetchItem( key );
            const cached = this.router.queryGetCachedItem( key );

            if ( cached && context.isMounted() ) {
                const normalized = this.handleChannelItemResponse( { ... cached } );
                context.setState( normalized );
            }
        } catch ( error ) {
            console.warn( "An error occurred while fetching API data, the state will not be updated, this area considered to be safe", error );
        }
    }

    private async onChannelItemUnmount( component: QueryComponent, context: DCommandSingleComponentContext ) {
        await this.autosave.queryFlushKey( context.props.meta.id );
    }

    // Handle when the channels change. This involves comparing the previous and current channels and updating the meta data if necessary.
    private onChannelsChanged( prevChannels: any[], currentChannels: any[] ) {
        for ( let i = 0 ; i < currentChannels.length ; i++ ) {
            if ( ! prevChannels[ i ] || ! currentChannels[ i ] ) continue;
            if ( prevChannels[ i ].props.meta !== currentChannels[ i ].props.meta ) {
                this.onChannelsMetaDataChanged(
                    currentChannels[ i ].props.meta.id!,
                    currentChannels[ i ].props.meta,
                    prevChannels[ i ].props.meta
                );
            }
        }

        const { added, removed } = queryDiffById( prevChannels, currentChannels, c => c.props.meta.id );

        for ( const ch of added ) {
            this.onChannelAdded( ch );
        }
        if ( added.length > 0 ) return;

        for ( const ch of removed ) {
            this.onChannelRemoved( ch.props.meta.id );
        }
        if ( removed.length > 0 ) return;
    }

    private onChannelAdded( newChannel: any ) {
        // Send a POST request to the API to create the new channel
        this.router.save( {
            key: newChannel.props.meta.id,
            meta: newChannel.props.meta,
        } );
    }

    private onChannelRemoved( key: string ) {
        void this.router.remove( key );
    }

    // Handle when the meta data of a channel changes. This involves sending a POST request to the API with the new meta data.
    private onChannelsMetaDataChanged( key: string, currentMeta: any, _prevMeta: any ) {
        this.router.save( { key, meta: currentMeta } as any );
    }
}

