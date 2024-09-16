import React from "react";

import {
    INTERNAL_ON_LOAD,
    INTERNAL_ON_MOUNT,
    INTERNAL_ON_UNMOUNT,
    INTERNAL_ON_UPDATE,
    INTERNAL_PROPS
} from "@zenflux/react-commander/constants";

import { wrapPromiseSuspendable } from "@zenflux/react-api/src/api-utils";

import type { APICore } from "@zenflux/react-api/src/api-core";

import type { APIModuleBase } from "@zenflux/react-api/src/api-module-base";
import type { APIComponentProps } from "@zenflux/react-api/src/api-types";

export class APIComponent extends React.PureComponent<APIComponentProps> {
    private static api: APICore;

    private readonly api: APICore;

    private readonly apiModule: APIModuleBase;

    private readonly element;

    public static setAPI( api: APICore ) {
        this.api = api;
    }

    public constructor( props: APIComponentProps ) {
        super( props );

        this.api = ( this.constructor as typeof APIComponent ).api;

        if ( ! this.props.module ) {
            throw new Error( "Parent <API.Component> should have 'module' prop" );
        }

        this.apiModule = this.api.getModule( this.props.module );

        const chainProps = props.chainProps || {};

        this.element = async () => {
            const props = await this.apiModule.getProps( this.props.type, this );

            return React.createElement( this.props.type, { ... props, ... chainProps } );
        };
    }

    public render() {
        if ( Array.isArray( this.props.children ) ) {
            throw new Error( "API.Component should have only one child" );
        }

        const getComponentPromise = async () => {
            const childrenType = this.props.children!.props.type;

            const parent = await this.element();

            const children = await Promise.all( parent.props.children.map( async ( child: any ) => {
                const childProps = await this.apiModule.getProps( child.type, this, child );

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
                        [ INTERNAL_ON_LOAD ]: ( context: any ) => this.apiModule.onLoadInternal( this, context ),
                        [ INTERNAL_ON_MOUNT ]: ( context: any ) => this.apiModule.onMountInternal( this, context ),
                        [ INTERNAL_ON_UNMOUNT ]: ( context: any ) => this.apiModule.onUnmountInternal( this, context ),
                        [ INTERNAL_ON_UPDATE ]: ( context: any, state: any ) => this.apiModule.onUpdateInternal( this, context, state ),
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
