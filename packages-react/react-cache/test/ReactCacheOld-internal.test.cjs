/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ReactCache;
let createResource;
let React;
let ReactFeatureFlags;
let ReactTestRenderer;
let Scheduler;
let Suspense;
let TextResource;
let textResourceShouldFail;
let waitForAll;
let assertLog;
let waitForThrow;
let act;

describe( 'ReactCache', () => {
    beforeEach( () => {
        jest.resetModules();

        if ( globalThis.globalThis.__Z_CUSTOM_LOADER__ !== undefined ) {
            delete global.React;

            globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-test-renderer"] = true;
        }

        React = require( 'react' );
        ReactTestRenderer = require( '@zenflux/react-test-renderer' );

        React = require( 'react' );
        ReactCache = require( '@zenflux/react-cache' );
        createResource = ReactCache.unstable_createResource;
        ReactTestRenderer = require( '@zenflux/react-test-renderer' );
        Scheduler = require( '@zenflux/react-scheduler/mock' );

        Suspense = React.Suspense;

        const InternalTestUtils = require( '@zenflux/react-internal-test-utils' );
        waitForAll = InternalTestUtils.waitForAll;
        assertLog = InternalTestUtils.assertLog;
        waitForThrow = InternalTestUtils.waitForThrow;
        act = InternalTestUtils.act;

        TextResource = createResource(
            ( [ text, ms = 0 ] ) => {
                let listeners = null;
                let status = 'pending';
                let value = null;
                return {
                    then( resolve, reject ) {
                        switch ( status ) {
                            case 'pending': {
                                if ( listeners === null ) {
                                    listeners = [ { resolve, reject } ];
                                    setTimeout( () => {
                                        if ( textResourceShouldFail ) {
                                            Scheduler.log( `Promise rejected [${ text }]` );
                                            status = 'rejected';
                                            value = new Error( 'Failed to load: ' + text );
                                            listeners.forEach( listener => listener.reject( value ) );
                                        } else {
                                            Scheduler.log( `Promise resolved [${ text }]` );
                                            status = 'resolved';
                                            value = text;
                                            listeners.forEach( listener => listener.resolve( value ) );
                                        }
                                    }, ms );
                                } else {
                                    listeners.push( { resolve, reject } );
                                }
                                break;
                            }
                            case 'resolved': {
                                resolve( value );
                                break;
                            }
                            case 'rejected': {
                                reject( value );
                                break;
                            }
                        }
                    },
                };
            },
            ( [ text, ms ] ) => text,
        );

        textResourceShouldFail = false;
    } );

    function Text( props ) {
        Scheduler.log( props.text );
        return props.text;
    }

    function AsyncText( props ) {
        const text = props.text;
        try {
            TextResource.read( [ props.text, props.ms ] );
            Scheduler.log( text );
            return text;
        } catch ( promise ) {
            if ( typeof promise.then === 'function' ) {
                Scheduler.log( `Suspend! [${ text }]` );
            } else {
                Scheduler.log( `Error! [${ text }]` );
            }
            throw promise;
        }
    }

    it( 'throws a promise if the requested value is not in the cache', async () => {
        function App() {
            return (
                <Suspense fallback={ <Text text="Loading..."/> }>
                    <AsyncText ms={ 100 } text="Hi"/>
                </Suspense>
            );
        }

        ReactTestRenderer.create( <App/>, {
            unstable_isConcurrent: true,
        } );

        await waitForAll( [ 'Suspend! [Hi]', 'Loading...' ] );

        jest.advanceTimersByTime( 100 );
        assertLog( [ 'Promise resolved [Hi]' ] );
        await waitForAll( [ 'Hi' ] );
    } );

    it( 'throws an error on the subsequent read if the promise is rejected', async () => {
        function App() {
            return (
                <Suspense fallback={ <Text text="Loading..."/> }>
                    <AsyncText ms={ 100 } text="Hi"/>
                </Suspense>
            );
        }

        const root = ReactTestRenderer.create( <App/>, {
            unstable_isConcurrent: true,
        } );

        await waitForAll( [ 'Suspend! [Hi]', 'Loading...' ] );

        textResourceShouldFail = true;
        let error;
        try {
            await act( () => jest.advanceTimersByTime( 100 ) );
        } catch ( e ) {
            error = e;
        }
        expect( error.message ).toMatch( 'Failed to load: Hi' );
        assertLog( [ 'Promise rejected [Hi]', 'Error! [Hi]', 'Error! [Hi]' ] );

        // Should throw again on a subsequent read
        root.update( <App/> );
        await waitForThrow( 'Failed to load: Hi' );
        assertLog( [ 'Error! [Hi]', 'Error! [Hi]' ] );
    } );

    // Not working in the original source
    it.skip( 'warns if non-primitive key is passed to a resource without a hash function', async () => {
        const BadTextResource = createResource( ( [ text, ms = 0 ] ) => {
            return new Promise( ( resolve, reject ) =>
                setTimeout( () => {
                    resolve( text );
                }, ms ),
            );
        } );

        function App() {
            Scheduler.log( 'App' );
            return BadTextResource.read( [ 'Hi', 100 ] );
        }

        ReactTestRenderer.create(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <App/>
            </Suspense>,
            {
                unstable_isConcurrent: true,
            },
        );

        if ( __DEV__ ) {
            await expect( async () => {
                await waitForAll( [ 'App', 'Loading...' ] );
            } ).toErrorDev( [
                'Invalid key type. Expected a string, number, symbol, or ' +
                'boolean, but instead received: [ \'Hi\',100\n\n' +
                'To use non-primitive values as keys, you must pass a hash ' +
                'function as the second argument to createResource().',
            ] );
        } else {
            await waitForAll( [ 'App', 'Loading...' ] );
        }
    } );

    it( 'evicts least recently used values', async () => {
        ReactCache.unstable_setGlobalCacheLimit( 3 );

        // Render 1, 2, and 3
        const root = ReactTestRenderer.create(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <AsyncText ms={ 100 } text={ 1 }/>
                <AsyncText ms={ 100 } text={ 2 }/>
                <AsyncText ms={ 100 } text={ 3 }/>
            </Suspense>,
            {
                unstable_isConcurrent: true,
            },
        );
        await waitForAll( [ 'Suspend! [1]', 'Loading...' ] );
        jest.advanceTimersByTime( 100 );
        assertLog( [ 'Promise resolved [1]' ] );
        await waitForAll( [ 1, 'Suspend! [2]' ] );

        jest.advanceTimersByTime( 100 );
        assertLog( [ 'Promise resolved [2]' ] );
        await waitForAll( [ 1, 2, 'Suspend! [3]' ] );

        await act( () => jest.advanceTimersByTime( 100 ) );
        assertLog( [ 'Promise resolved [3]', 1, 2, 3 ] );

        expect( root ).toMatchRenderedOutput( '123' );

        // Render 1, 4, 5
        root.update(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <AsyncText ms={ 100 } text={ 1 }/>
                <AsyncText ms={ 100 } text={ 4 }/>
                <AsyncText ms={ 100 } text={ 5 }/>
            </Suspense>,
        );

        await waitForAll( [ 1, 'Suspend! [4]', 'Loading...' ] );

        await act( () => jest.advanceTimersByTime( 100 ) );
        assertLog( [
            'Promise resolved [4]',
            1,
            4,
            'Suspend! [5]',
            'Promise resolved [5]',
            1,
            4,
            5,
        ] );

        expect( root ).toMatchRenderedOutput( '145' );

        // We've now rendered values 1, 2, 3, 4, 5, over our limit of 3. The least
        // recently used values are 2 and 3. They should have been evicted.

        root.update(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <AsyncText ms={ 100 } text={ 1 }/>
                <AsyncText ms={ 100 } text={ 2 }/>
                <AsyncText ms={ 100 } text={ 3 }/>
            </Suspense>,
        );

        await waitForAll( [
            // 1 is still cached
            1,
            // 2 and 3 suspend because they were evicted from the cache
            'Suspend! [2]',
            'Loading...',
        ] );

        await act( () => jest.advanceTimersByTime( 100 ) );
        assertLog( [
            'Promise resolved [2]',
            1,
            2,
            'Suspend! [3]',
            'Promise resolved [3]',
            1,
            2,
            3,
        ] );
        expect( root ).toMatchRenderedOutput( '123' );
    } );

    it( 'preloads during the render phase', async () => {
        function App() {
            TextResource.preload( [ 'B', 1000 ] );
            TextResource.read( [ 'A', 1000 ] );
            TextResource.read( [ 'B', 1000 ] );
            return <Text text="Result"/>;
        }

        const root = ReactTestRenderer.create(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <App/>
            </Suspense>,
            {
                unstable_isConcurrent: true,
            },
        );

        await waitForAll( [ 'Loading...' ] );

        await act( () => jest.advanceTimersByTime( 1000 ) );
        assertLog( [ 'Promise resolved [B]', 'Promise resolved [A]', 'Result' ] );
        expect( root ).toMatchRenderedOutput( 'Result' );
    } );

    it( 'if a thenable resolves multiple times, does not update the first cached value', async () => {
        let resolveThenable;
        const BadTextResource = createResource(
            ( [ text, ms = 0 ] ) => {
                let listeners = null;
                const value = null;
                return {
                    then( resolve, reject ) {
                        if ( value !== null ) {
                            resolve( value );
                        } else {
                            if ( listeners === null ) {
                                listeners = [ resolve ];
                                resolveThenable = v => {
                                    listeners.forEach( listener => listener( v ) );
                                };
                            } else {
                                listeners.push( resolve );
                            }
                        }
                    },
                };
            },
            ( [ text, ms ] ) => text,
        );

        function BadAsyncText( props ) {
            const text = props.text;
            try {
                const actualText = BadTextResource.read( [ props.text, props.ms ] );
                Scheduler.log( actualText );
                return actualText;
            } catch ( promise ) {
                if ( typeof promise.then === 'function' ) {
                    Scheduler.log( `Suspend! [${ text }]` );
                } else {
                    Scheduler.log( `Error! [${ text }]` );
                }
                throw promise;
            }
        }

        const root = ReactTestRenderer.create(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <BadAsyncText text="Hi"/>
            </Suspense>,
            {
                unstable_isConcurrent: true,
            },
        );

        await waitForAll( [ 'Suspend! [Hi]', 'Loading...' ] );

        resolveThenable( 'Hi' );
        // This thenable improperly resolves twice. We should not update the
        // cached value.
        resolveThenable( 'Hi muahahaha I am different' );

        root.update(
            <Suspense fallback={ <Text text="Loading..."/> }>
                <BadAsyncText text="Hi"/>
            </Suspense>,
            {
                unstable_isConcurrent: true,
            },
        );

        assertLog( [] );
        await waitForAll( [ 'Hi' ] );
        expect( root ).toMatchRenderedOutput( 'Hi' );
    } );

    it( 'throws if read is called outside render', () => {
        expect( () => TextResource.read( [ 'A', 1000 ] ) ).toThrow(
            "read and preload may only be called from within a component's render",
        );
    } );

    it( 'throws if preload is called outside render', () => {
        expect( () => TextResource.preload( [ 'A', 1000 ] ) ).toThrow(
            "read and preload may only be called from within a component's render",
        );
    } );
} );
