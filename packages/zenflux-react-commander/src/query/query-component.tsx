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
    TResource extends Record<string, unknown> = Record<string, unknown>
> extends React.PureComponent<DQueryComponentProps<TData, TProps, TResource>> {
    private static client: QueryClient;

    private readonly client: QueryClient;

    private readonly queryModule: QueryModuleBase<TResource>;

    private readonly element;

    public static setClient( query: QueryClient ) {
        this.client = query;
    }

    public constructor( props: DQueryComponentProps<TData, TProps, TResource> ) {
        super( props );

        this.client = ( this.constructor as typeof QueryComponent ).client;

        if ( ! this.props.module ) {
            throw new Error( "Parent <Query.Component> should have 'module' prop" );
        }

        this.queryModule = this.client.getModule( this.props.module );

        const chainProps = props.props || {};

        this.element = async () => {
            const $data = await this.queryModule.getData<TData>( this.props.component, chainProps as Record<string, unknown> );

            return React.createElement( this.props.component, { $data, ... chainProps } as TProps & { $data: TData } );
        };
    }

    public render() {
        if ( Array.isArray( this.props.children ) ) {
            throw new Error( "Query.Component should have only one child" );
        }

        const getComponentPromise = async () => {
            const parent = await this.element();

            if ( ! this.props.children ) {
                return {
                    element: parent,
                    children: [] as React.ReactElement[],
                };
            }

            const childrenType = this.props.children.props.component;
            const childrenModule = this.props.children.props.module;

            const parentData = ( parent.props as TProps & { $data: TData } ).$data;

            const childQueryModule = childrenModule ? this.client.getModule( childrenModule ) : this.queryModule;

            const dataArray = Array.isArray( parentData ) ? parentData : [ parentData ];

            const children = await Promise.all( dataArray.map( async ( childData ) => {
                const child$data = await childQueryModule.getData( childrenType, childData as Record<string, unknown> );

                return React.createElement( childrenType, { $data: child$data } );
            } ) );

            return {
                element: parent,
                children,
            };
        };

        // The resource will start loading
        const resource = wrapPromiseSuspendable( getComponentPromise() );

        // The API Wrapper Component
        const Component = () => {
            const data = resource.read();

            const internalProps = {
                ... data.element.props,

                // Hooking lifecycle methods
                [ INTERNAL_PROPS ]: {
                    handlers: {
                        [ INTERNAL_ON_LOAD ]: ( context: any ) => this.queryModule.onLoadInternal( context ),
                        [ INTERNAL_ON_MOUNT ]: ( context: any ) => this.queryModule.onMountInternal( context, response.data ),
                        [ INTERNAL_ON_UNMOUNT ]: ( context: any ) => this.queryModule.onUnmountInternal( context, response.data ),
                        [ INTERNAL_ON_UPDATE ]: ( context: any, state: any ) => this.queryModule.onUpdateInternal( context, state ),
                        [ INTERNAL_ON_CONTEXT_STATE_UPDATED ]: ( context: any, hasChanged: boolean ) => this.queryModule.onContextStateUpdatedInternal( context, hasChanged ),
                    }
                }
            };

            const mount = () => {
                return (
                    <data.element.type { ... internalProps }>
                        { data.children.map( ( child: React.ReactElement, index: number ) => (
                            <child.type key={ index } { ... child.props } { ... internalProps }>
                                { child.props.children }
                            </child.type>
                        ) ) }
                    </data.element.type>
                );
            };

            return mount();
        };

        return (
            <React.Suspense fallback={ this.props.fallback || <p>Loading</p> }>
                <Component/>
            </React.Suspense>
        );
    }
}
;
