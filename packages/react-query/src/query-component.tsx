import React from "react";

import {
    INTERNAL_ON_LOAD,
    INTERNAL_ON_MOUNT,
    INTERNAL_ON_UNMOUNT,
    INTERNAL_ON_UPDATE,
    INTERNAL_PROPS
} from "@zenflux/react-commander/constants";

import { wrapPromiseSuspendable } from "@zenflux/react-query/src/query-utils";

import type { QueryClient } from "@zenflux/react-query/src/query-client";

import type { QueryModuleBase } from "@zenflux/react-query/src/query-module-base";
import type { DQueryComponentProps } from "@zenflux/react-query/src/query-definitions";

export class QueryComponent extends React.PureComponent<DQueryComponentProps> {
    private static client: QueryClient;

    private readonly client: QueryClient;

    private readonly queryModule: QueryModuleBase;

    private readonly element;

    public static setClient( query: QueryClient ) {
        this.client = query;
    }

    public constructor( props: DQueryComponentProps ) {
        super( props );

        this.client = ( this.constructor as typeof QueryComponent ).client;

        if ( ! this.props.module ) {
            throw new Error( "Parent <Query.Component> should have 'module' prop" );
        }

        this.queryModule = this.client.getModule( this.props.module );

        const chainProps = props.props || {};

        this.element = async () => {
            const props = await this.queryModule.getProps( this.props.component, this );

            return React.createElement( this.props.component, { ... props, ... chainProps } );
        };
    }

    public render() {
        if ( Array.isArray( this.props.children ) ) {
            throw new Error( "Query.Component should have only one child" );
        }

        const getComponentPromise = async () => {
            const childrenType = this.props.children!.props.component;
            const parent = await this.element();

            const children = await Promise.all( parent.props.children.map( async ( child: any ) => {
                const childProps = await this.queryModule.getProps( childrenType, this, child );

                return React.createElement( childrenType, childProps );
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
                        [ INTERNAL_ON_LOAD ]: ( context: any ) => this.queryModule.onLoadInternal( this, context ),
                        [ INTERNAL_ON_MOUNT ]: ( context: any ) => this.queryModule.onMountInternal( this, context ),
                        [ INTERNAL_ON_UNMOUNT ]: ( context: any ) => this.queryModule.onUnmountInternal( this, context ),
                        [ INTERNAL_ON_UPDATE ]: ( context: any, state: any ) => this.queryModule.onUpdateInternal( this, context, state ),
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
