/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @jest-environment node
 */
'use strict';

const React = require( 'react' );

const ReactNoop = require( '@zenflux/react-noop-renderer' );

const Scheduler = require( '@zenflux/react-scheduler/mock' );

const { startTransition, useDeferredValue } = React;

const {
    waitFor,
    waitForAll,
    waitForThrow,
    waitForPaint,
    unstable_waitForExpired,
    assertLog,
    act,
} = require( '@zenflux/react-internal-test-utils' );

describe( 'react-internal-test-utils', () => {
    describe( 'waitFor', () => {
        it( "Should throw error if sequence of events did not occur", async () => {
            await expect( waitFor( [ 'foo', 'bar' ] ) )
                .rejects
                .toThrow( "Expected sequence of events did not occur" );
        } )
    } );

    describe( 'waitForAll', () => {
        it( "Should throw error if sequence of events did not occur", async () => {
            await expect( waitForAll( [ 'foo', 'bar' ] ) )
                .rejects
                .toThrow( "Expected sequence of events did not occur" );
        } )
    } );

    describe( 'waitForThrow', () => {
        it( "Should error if expected unknown error was not thrown", async () => {
            const expected = () => {
                throw "foo";
            };

            await expect( waitForThrow( expected, "bar" ) )
                .rejects
                .toThrow( "Expected something to throw, but nothing did." );
        } );

        it( "Should throw error if expected error is not the same as thrown", async () => {
            const root = ReactNoop.createRoot();

            const BadRender = () => {
                throw new Error( "foo" );
            };

            root.render( <BadRender/> );

            await expect( waitForThrow( "something-else" ) )
                .rejects
                .toThrow( "Expected error was not thrown." );
        } );

        it( "Should throw error if throw entity is not error object and not the same as thrown", async () => {
            const root = ReactNoop.createRoot();

            const BadRender = () => {
                throw "foo";
            };

            root.render( <BadRender/> );

            await expect( waitForThrow( "something-else" ) )
                .rejects
                .toThrow( "Expected error was not thrown." );
        } );
    } );

    describe( 'unstable_waitForExpired', () => {
        it( "Should error if sequence of events did not occur", async () => {
            await expect( unstable_waitForExpired( [ 'foo', 'bar' ] ) )
                .rejects
                .toThrow( "Expected sequence of events did not occur" );
        } )
    } );

    describe( 'waitForPaint', () => {
        it( "Should error if sequence of events did not occur", async () => {
            await expect( waitForPaint( [ 'foo', 'bar' ] ) )
                .rejects
                .toThrow( "Expected sequence of events did not occur" );
        } )
    } );

    describe( 'waitForDiscrete', () => {
        it( "Should error if sequence of events did not occur", async () => {
            await expect( waitForPaint( [ 'foo', 'bar' ] ) )
                .rejects
                .toThrow( "Expected sequence of events did not occur" );
        } )
    } );

    describe( 'assertLog', () => {
        it( "Should error if sequence of events did not occur", async () => {
            const Yield = ( { id } ) => {
                Scheduler.log( id );
                return id;
            };

            function App() {
                return (
                    <div>
                        <Yield id="A"/>
                        <Yield id="B"/>
                        <Yield id="C"/>
                    </div>
                );
            }

            const root = ReactNoop.createRoot();

            await expect( async () => {
                await act( () => {
                    root.render( <App/> );
                } );
                assertLog( [ "A", "Z" ] );
            } )
                .rejects
                .toThrow( "Expected sequence of events did not occur" );
        } )
    } );
} );
