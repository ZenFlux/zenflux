import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import {
    INTERNAL_ON_LOAD,
    INTERNAL_ON_MOUNT,
    INTERNAL_ON_UNMOUNT,
    INTERNAL_ON_UPDATE,
    INTERNAL_ON_CONTEXT_STATE_UPDATED,
    INTERNAL_PROPS
} from "../_internal/constants";

import { wrapPromiseSuspendable } from "@zenflux/react-commander/query/utils";

import type { QueryClient } from "@zenflux/react-commander/query/client";

import type { QueryModuleBase } from "@zenflux/react-commander/query/module-base";
import type { DQueryComponentProps } from "@zenflux/react-commander/query/definitions";

export class QueryComponent<
    TData = Record<string, unknown>,
    TProps = Record<string, unknown>,
    TResource extends object = object,
    TState = React.ComponentState
> extends React.PureComponent<DQueryComponentProps<TData, TProps, TResource, TState>> {
    private static client: QueryClient;

    private readonly client: QueryClient;

    private readonly queryModule: QueryModuleBase<TResource>;

    public static setClient( query: QueryClient ) {
        this.client = query;
    }

    public constructor( props: DQueryComponentProps<TData, TProps, TResource> ) {
        super( props );

        this.client = ( this.constructor as typeof QueryComponent ).client;

        if ( ! this.props.module ) {
            throw new Error( "Parent <Query.Component> should have 'module' prop" );
        }

        this.queryModule = this.client.getModule<TResource>( this.props.module );

    }

    public render() {
        // The resource will start loading
        const resource = wrapPromiseSuspendable( (async () => {
            const data = await this.queryModule.getData<TData, TProps & { $data: TData }, TState>( this.props.component, this.props.props as Record<string, unknown> );

            return {
                element: React.createElement( this.props.component, this.props.props as TProps & { $data: TData  /* TODO remove */ } ),
                data,
            };
        })() );

        // The API Wrapper Component
        const Component = () => {
            const response = resource.read();

            const internalProps = {
                ... response.element.props,

                // Hooking lifecycle methods
                [ INTERNAL_PROPS ]: {
                    handlers: {
                        [ INTERNAL_ON_LOAD ]: ( context: any ) => this.queryModule.onLoadInternal( context ),
                        [ INTERNAL_ON_MOUNT ]: ( context: any ) => this.queryModule.onMountInternal( context, response.data ),
                        [ INTERNAL_ON_UNMOUNT ]: ( context: any ) => this.queryModule.onUnmountInternal( context, response.data ),
                        [ INTERNAL_ON_UPDATE ]: ( context: any, state: any ) => this.queryModule.onUpdateInternal( context, state ),
                        [ INTERNAL_ON_CONTEXT_STATE_UPDATED ]: ( context: any, hasChanged: boolean ) =>
                            this.queryModule.onContextStateUpdatedInternal( context, hasChanged ),
                    }
                }
            };

            const mount = () => {
                return (
                    <response.element.type { ... internalProps }>
                        {/* { data.children.map( ( child: React.ReactElement, index: number ) => (
                            <child.type key={ index } { ... child.props }>
                                { child.props.children }
                            </child.type>
                        ) ) } */}
                    </response.element.type>
                );
            };

            return mount();
        };

        return (
            <React.Suspense fallback={ this.props.fallback ?? undefined }>
                <Component/>
            </React.Suspense>
        );
    }
}
;
