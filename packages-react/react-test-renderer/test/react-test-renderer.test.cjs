/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment jsdom
 */

'use strict';

let ReactDOM;
let React;
let ReactCache;
let ReactTestRenderer;
let waitForAll;

describe( 'ReactTestRenderer', () => {
    beforeEach( () => {
        jest.resetModules();

        if ( globalThis.globalThis.__Z_CUSTOM_LOADER__ !== undefined ) {
            delete globalThis.React;

            globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-test-renderer"] = true;
        }

        ReactDOM = require( 'react-dom' );

        React = require( 'react' );
        ReactCache = require( '@zenflux/react-cache' );
        ReactTestRenderer = require( '@zenflux/react-test-renderer' );
        const InternalTestUtils = require( '@zenflux/react-internal-test-utils' );
        waitForAll = InternalTestUtils.waitForAll;
    } );

    it( 'should warn if used to render a ReactDOM portal', () => {
        const container = document.createElement( 'div' );
        expect( () => {
            let error;
            try {
                ReactTestRenderer.create( ReactDOM.createPortal( 'foo', container ) );
            } catch ( e ) {
                error = e;
            }
            // After the update throws, a subsequent render is scheduled to
            // unmount the whole tree. This update also causes an error, so React
            // throws an AggregateError.
            const errors = error.errors;
            expect( errors.length ).toBe( 2 );
            expect( errors[ 0 ].message.includes( 'indexOf is not a function' ) ).toBe(
                true,
            );
            expect( errors[ 1 ].message.includes( 'indexOf is not a function' ) ).toBe(
                true,
            );
        } ).toErrorDev( 'An invalid container has been provided.', {
            withoutStack: true,
        } );
    } );

    describe( 'timed out Suspense hidden subtrees should not be observable via toJSON', () => {
        let AsyncText;
        let PendingResources;
        let TextResource;

        beforeEach( () => {
            PendingResources = {};
            debugger
            TextResource = ReactCache.unstable_createResource(
                text =>
                    new Promise( resolve => {
                        PendingResources[ text ] = resolve;
                    } ),
                text => text,
            );

            AsyncText = ( { text } ) => {
                const value = TextResource.read( text );
                return value;
            };
        } );

        it( 'for root Suspense components', async () => {
            const App = ( { text } ) => {
                return (
                    <React.Suspense fallback="fallback">
                        <AsyncText text={ text }/>
                    </React.Suspense>
                );
            };

            const root = ReactTestRenderer.create( <App text="initial"/> );
            PendingResources.initial( 'initial' );
            await waitForAll( [] );
            expect( root.toJSON() ).toEqual( 'initial' );

            root.update( <App text="dynamic"/> );
            expect( root.toJSON() ).toEqual( 'fallback' );

            PendingResources.dynamic( 'dynamic' );
            await waitForAll( [] );
            expect( root.toJSON() ).toEqual( 'dynamic' );
        } );

        it( 'for nested Suspense components', async () => {
            const App = ( { text } ) => {
                return (
                    <div>
                        <React.Suspense fallback="fallback">
                            <AsyncText text={ text }/>
                        </React.Suspense>
                    </div>
                );
            };

            const root = ReactTestRenderer.create( <App text="initial"/> );
            PendingResources.initial( 'initial' );
            await waitForAll( [] );
            expect( root.toJSON().children ).toEqual( [ 'initial' ] );

            root.update( <App text="dynamic"/> );
            expect( root.toJSON().children ).toEqual( [ 'fallback' ] );

            PendingResources.dynamic( 'dynamic' );
            await waitForAll( [] );
            expect( root.toJSON().children ).toEqual( [ 'dynamic' ] );
        } );
    } );
} );
