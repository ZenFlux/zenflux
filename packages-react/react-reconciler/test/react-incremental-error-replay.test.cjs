/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;
let waitForAll;
let waitForThrow;

describe( 'ReactIncrementalErrorReplay', () => {
    beforeEach( () => {
        jest.resetModules();

        if ( globalThis.globalThis.__Z_CUSTOM_LOADER__ !== undefined ) {
            delete global.React;

            globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-reconciler"] = true;
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-noop-renderer"] = true;
        }

        React = require( 'react' );
        ReactNoop = require( '@zenflux/react-noop-renderer' );

        const InternalTestUtils = require( '@zenflux/react-internal-test-utils' );
        waitForAll = InternalTestUtils.waitForAll;
        waitForThrow = InternalTestUtils.waitForThrow;
    } );

    it( 'should fail gracefully on error in the host environment', async () => {
        ReactNoop.render( <errorInBeginPhase/> );
        await waitForThrow( 'Error in host config.' );
    } );

    it( "should ignore error if it doesn't throw on retry", async () => {
        let didInit = false;

        function badLazyInit() {
            const needsInit = ! didInit;
            didInit = true;
            if ( needsInit ) {
                throw new Error( 'Hi' );
            }
        }

        class App extends React.Component {
            render() {
                badLazyInit();
                return <div/>;
            }
        }

        ReactNoop.render( <App/> );
        await waitForAll( [] );
    } );
} );
