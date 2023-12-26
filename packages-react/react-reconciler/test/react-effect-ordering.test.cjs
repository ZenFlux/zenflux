/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let useEffect;
let useLayoutEffect;
let assertLog;

describe( 'ReactEffectOrdering', () => {
    beforeEach( () => {
        jest.resetModules();
        jest.useFakeTimers();

        if ( globalThis.globalThis.__Z_CUSTOM_LOADER__ !== undefined ) {
            delete global.React;

            globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-reconciler"] = true;
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-noop-renderer"] = true;
        }

        React = require( 'react' );
        ReactNoop = require( '@zenflux/react-noop-renderer' );
        Scheduler = require( '@zenflux/react-scheduler/mock' );

        const InternalTestUtils = require( '@zenflux/react-internal-test-utils' );

        useEffect = React.useEffect;
        useLayoutEffect = React.useLayoutEffect;

        act = InternalTestUtils.act;
        assertLog = InternalTestUtils.assertLog;
    } );

    test( 'layout unmounts on deletion are fired in parent -> child order', async () => {
        const root = ReactNoop.createRoot();

        function Parent() {
            useLayoutEffect( () => {
                return () => Scheduler.log( 'Unmount parent' );
            } );
            return <Child/>;
        }

        function Child() {
            useLayoutEffect( () => {
                return () => Scheduler.log( 'Unmount child' );
            } );
            return 'Child';
        }

        await act( () => {
            root.render( <Parent/> );
        } );
        expect( root ).toMatchRenderedOutput( 'Child' );
        await act( () => {
            root.render( null );
        } );
        assertLog( [ 'Unmount parent', 'Unmount child' ] );
    } );

    test( 'passive unmounts on deletion are fired in parent -> child order', async () => {
        const root = ReactNoop.createRoot();

        function Parent() {
            useEffect( () => {
                return () => Scheduler.log( 'Unmount parent' );
            } );
            return <Child/>;
        }

        function Child() {
            useEffect( () => {
                return () => Scheduler.log( 'Unmount child' );
            } );
            return 'Child';
        }

        await act( () => {
            root.render( <Parent/> );
        } );
        expect( root ).toMatchRenderedOutput( 'Child' );
        await act( () => {
            root.render( null );
        } );
        assertLog( [ 'Unmount parent', 'Unmount child' ] );
    } );
} );
