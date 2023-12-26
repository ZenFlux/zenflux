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

let React;
let ReactDOM;
let ReactDOMClient;
let Scheduler;
let mockDevToolsHook;
let allSchedulerTags;
let allSchedulerTypes;
let onCommitRootShouldYield;
let act;
let waitFor;
let waitForAll;
let assertLog;

describe( 'updaters', () => {
    beforeEach( () => {
        jest.resetModules();

        if ( globalThis.globalThis.__Z_CUSTOM_LOADER__ !== undefined ) {
            delete global.React;

            globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-reconciler"] = true;
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ "@zenflux/react-noop-renderer"] = true;
        }

        allSchedulerTags = [];
        allSchedulerTypes = [];

        onCommitRootShouldYield = true;

        mockDevToolsHook = {
            supportsFiber: true,
            inject: jest.fn( () => {} ),
            onCommitFiberRoot: ( rendererID, root, schedulerPriority, didError ) => {
                if ( onCommitRootShouldYield ) {
                    Scheduler.log( 'onCommitRoot' );
                }
                const schedulerTags = [];
                const schedulerTypes = [];
                root.memoizedUpdaters.forEach( fiber => {
                    schedulerTags.push( fiber.tag );
                    schedulerTypes.push( fiber.elementType );
                } );
                allSchedulerTags.push( schedulerTags );
                allSchedulerTypes.push( schedulerTypes );
            },
        };

        global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = mockDevToolsHook;

        global.__REACT_FEATURE_FLAGS__ = {
            enableUpdaterTracking: true,
            debugRenderPhaseSideEffectsForStrictMode: false
        };

        React = require( 'react' );
        Scheduler = require( '@zenflux/react-scheduler/mock' );

        // For `react-dom`
        jest.mock( 'scheduler', () =>
            jest.requireActual( '@zenflux/react-scheduler/mock' ) );

        ReactDOM = require( 'react-dom' );
        ReactDOMClient = require( 'react-dom/client' );

        const InternalTestUtils = require( '@zenflux/react-internal-test-utils' );

        act = InternalTestUtils.act;
        waitFor = InternalTestUtils.waitFor;
        waitForAll = InternalTestUtils.waitForAll;
        assertLog = InternalTestUtils.assertLog;
    } );

    it( 'should report the (host) root as the scheduler for root-level render', async () => {
        const { WorkTag } = require( '@zenflux/react-shared/src/react-internal-constants/work-tags' );

        const Parent = () => <Child/>;
        const Child = () => null;
        const container = document.createElement( 'div' );

        await act( () => {
            ReactDOM.render( <Parent/>, container );
        } );
        expect( allSchedulerTags ).toEqual( [ [ WorkTag.HostRoot ] ] );

        await act( () => {
            ReactDOM.render( <Parent/>, container );
        } );
        expect( allSchedulerTags ).toEqual( [ [ WorkTag.HostRoot ], [ WorkTag.HostRoot ] ] );
    } );

    it( 'should report a function component as the scheduler for a hooks update', async () => {
        let scheduleForA = null;
        let scheduleForB = null;

        const Parent = () => (
            <React.Fragment>
                <SchedulingComponentA/>
                <SchedulingComponentB/>
            </React.Fragment>
        );
        const SchedulingComponentA = () => {
            const [ count, setCount ] = React.useState( 0 );
            scheduleForA = () => setCount( prevCount => prevCount + 1 );
            return <Child count={ count }/>;
        };
        const SchedulingComponentB = () => {
            const [ count, setCount ] = React.useState( 0 );
            scheduleForB = () => setCount( prevCount => prevCount + 1 );
            return <Child count={ count }/>;
        };
        const Child = () => null;

        await act( () => {
            ReactDOM.render( <Parent/>, document.createElement( 'div' ) );
        } );
        expect( scheduleForA ).not.toBeNull();
        expect( scheduleForB ).not.toBeNull();
        expect( allSchedulerTypes ).toEqual( [ [ null ] ] );

        await act( () => {
            scheduleForA();
        } );
        expect( allSchedulerTypes ).toEqual( [ [ null ], [ SchedulingComponentA ] ] );

        await act( () => {
            scheduleForB();
        } );
        expect( allSchedulerTypes ).toEqual( [
            [ null ],
            [ SchedulingComponentA ],
            [ SchedulingComponentB ],
        ] );
    } );

    it( 'should report a class component as the scheduler for a setState update', async () => {
        const Parent = () => <SchedulingComponent/>;

        class SchedulingComponent extends React.Component {
            state = {};

            render() {
                instance = this;
                return <Child/>;
            }
        }

        const Child = () => null;
        let instance;
        await act( () => {
            ReactDOM.render( <Parent/>, document.createElement( 'div' ) );
        } );
        expect( allSchedulerTypes ).toEqual( [ [ null ] ] );

        expect( instance ).not.toBeNull();
        await act( () => {
            instance.setState( {} );
        } );
        expect( allSchedulerTypes ).toEqual( [ [ null ], [ SchedulingComponent ] ] );
    } );

    it( 'should cover cascading updates', async () => {
        let triggerActiveCascade = null;
        let triggerPassiveCascade = null;

        const Parent = () => <SchedulingComponent/>;
        const SchedulingComponent = () => {
            const [ cascade, setCascade ] = React.useState( null );
            triggerActiveCascade = () => setCascade( 'active' );
            triggerPassiveCascade = () => setCascade( 'passive' );
            return <CascadingChild cascade={ cascade }/>;
        };
        const CascadingChild = ( { cascade } ) => {
            const [ count, setCount ] = React.useState( 0 );
            Scheduler.log( `CascadingChild ${ count }` );
            React.useLayoutEffect( () => {
                if ( cascade === 'active' ) {
                    setCount( prevCount => prevCount + 1 );
                }
                return () => {
                };
            }, [ cascade ] );
            React.useEffect( () => {
                if ( cascade === 'passive' ) {
                    setCount( prevCount => prevCount + 1 );
                }
                return () => {
                };
            }, [ cascade ] );
            return count;
        };

        const root = ReactDOMClient.createRoot( document.createElement( 'div' ) );
        await act( async () => {
            root.render( <Parent/> );
            await waitFor( [ 'CascadingChild 0', 'onCommitRoot' ] );
        } );
        expect( triggerActiveCascade ).not.toBeNull();
        expect( triggerPassiveCascade ).not.toBeNull();
        expect( allSchedulerTypes ).toEqual( [ [ null ] ] );

        await act( async () => {
            triggerActiveCascade();
            await waitFor( [
                'CascadingChild 0',
                'onCommitRoot',
                'CascadingChild 1',
                'onCommitRoot',
            ] );
        } );
        expect( allSchedulerTypes ).toEqual( [
            [ null ],
            [ SchedulingComponent ],
            [ CascadingChild ],
        ] );

        await act( async () => {
            triggerPassiveCascade();
            await waitFor( [
                'CascadingChild 1',
                'onCommitRoot',
                'CascadingChild 2',
                'onCommitRoot',
            ] );
        } );
        expect( allSchedulerTypes ).toEqual( [
            [ null ],
            [ SchedulingComponent ],
            [ CascadingChild ],
            [ SchedulingComponent ],
            [ CascadingChild ],
        ] );

        // Verify no outstanding flushes
        await waitForAll( [] );
    } );

    it( 'should cover suspense pings', async () => {
        let data = null;
        let resolver = null;
        let promise = null;
        const fakeCacheRead = () => {
            if ( data === null ) {
                promise = new Promise( resolve => {
                    resolver = resolvedData => {
                        data = resolvedData;
                        resolve( resolvedData );
                    };
                } );
                throw promise;
            } else {
                return data;
            }
        };
        const Parent = () => (
            <React.Suspense fallback={ <Fallback/> }>
                <Suspender/>
            </React.Suspense>
        );
        const Fallback = () => null;
        let setShouldSuspend = null;
        const Suspender = ( { suspend } ) => {
            const tuple = React.useState( false );
            setShouldSuspend = tuple[ 1 ];
            if ( tuple[ 0 ] === true ) {
                return fakeCacheRead();
            } else {
                return null;
            }
        };

        await act( () => {
            ReactDOM.render( <Parent/>, document.createElement( 'div' ) );
            assertLog( [ 'onCommitRoot' ] );
        } );
        expect( setShouldSuspend ).not.toBeNull();
        expect( allSchedulerTypes ).toEqual( [ [ null ] ] );

        await act( () => {
            setShouldSuspend( true );
        } );
        assertLog( [ 'onCommitRoot' ] );
        expect( allSchedulerTypes ).toEqual( [ [ null ], [ Suspender ] ] );

        expect( resolver ).not.toBeNull();
        await act( () => {
            resolver( 'abc' );
            return promise;
        } );
        assertLog( [ 'onCommitRoot' ] );
        expect( allSchedulerTypes ).toEqual( [ [ null ], [ Suspender ], [ Suspender ] ] );

        // Verify no outstanding flushes
        await waitForAll( [] );
    } );

    it( 'should cover error handling', async () => {
        let triggerError = null;

        const Parent = () => {
            const [ shouldError, setShouldError ] = React.useState( false );
            triggerError = () => setShouldError( true );
            return shouldError ? (
                <ErrorBoundary>
                    <BrokenRender/>
                </ErrorBoundary>
            ) : (
                <ErrorBoundary>
                    <Yield value="initial"/>
                </ErrorBoundary>
            );
        };

        class ErrorBoundary extends React.Component {
            state = { error: null };

            componentDidCatch( error ) {
                this.setState( { error } );
            }

            render() {
                if ( this.state.error ) {
                    return <Yield value="error"/>;
                }
                return this.props.children;
            }
        }

        const Yield = ( { value } ) => {
            Scheduler.log( value );
            return null;
        };
        const BrokenRender = () => {
            throw new Error( 'Hello' );
        };

        const root = ReactDOMClient.createRoot( document.createElement( 'div' ) );
        await act( () => {
            root.render( <Parent shouldError={ false }/> );
        } );
        assertLog( [ 'initial', 'onCommitRoot' ] );
        expect( triggerError ).not.toBeNull();

        allSchedulerTypes.splice( 0 );
        onCommitRootShouldYield = true;

        await act( () => {
            triggerError();
        } );
        assertLog( [ 'onCommitRoot', 'error', 'onCommitRoot' ] );
        expect( allSchedulerTypes ).toEqual( [ [ Parent ], [ ErrorBoundary ] ] );

        // Verify no outstanding flushes
        await waitForAll( [] );
    } );

    it( 'should distinguish between updaters in the case of interleaved work', async () => {
        const { WorkTag } = require( '@zenflux/react-shared/src/react-internal-constants/work-tags' );

        let triggerLowPriorityUpdate = null;
        let triggerSyncPriorityUpdate = null;

        const SyncPriorityUpdater = () => {
            const [ count, setCount ] = React.useState( 0 );
            triggerSyncPriorityUpdate = () => setCount( prevCount => prevCount + 1 );
            Scheduler.log( `SyncPriorityUpdater ${ count }` );
            return <Yield value={ `HighPriority ${ count }` }/>;
        };
        const LowPriorityUpdater = () => {
            const [ count, setCount ] = React.useState( 0 );
            triggerLowPriorityUpdate = () => {
                React.startTransition( () => {
                    setCount( prevCount => prevCount + 1 );
                } );
            };
            Scheduler.log( `LowPriorityUpdater ${ count }` );
            return <Yield value={ `LowPriority ${ count }` }/>;
        };
        const Yield = ( { value } ) => {
            Scheduler.log( `Yield ${ value }` );
            return null;
        };

        const root = ReactDOMClient.createRoot( document.createElement( 'div' ) );
        root.render(
            <React.Fragment>
                <SyncPriorityUpdater/>
                <LowPriorityUpdater/>
            </React.Fragment>,
        );

        // Render everything initially.
        await waitForAll( [
            'SyncPriorityUpdater 0',
            'Yield HighPriority 0',
            'LowPriorityUpdater 0',
            'Yield LowPriority 0',
            'onCommitRoot',
        ] );
        expect( triggerLowPriorityUpdate ).not.toBeNull();
        expect( triggerSyncPriorityUpdate ).not.toBeNull();
        expect( allSchedulerTags ).toEqual( [ [ WorkTag.HostRoot ] ] );

        // Render a partial update, but don't finish.
        await act( async () => {
            triggerLowPriorityUpdate();
            await waitFor( [ 'LowPriorityUpdater 1' ] );
            expect( allSchedulerTags ).toEqual( [ [ WorkTag.HostRoot ] ] );

            // Interrupt with higher priority work.
            ReactDOM.flushSync( triggerSyncPriorityUpdate );
            assertLog( [
                'SyncPriorityUpdater 1',
                'Yield HighPriority 1',
                'onCommitRoot',
            ] );
            expect( allSchedulerTypes ).toEqual( [ [ null ], [ SyncPriorityUpdater ] ] );

            // Finish the initial partial update
            triggerLowPriorityUpdate();
            await waitForAll( [
                'LowPriorityUpdater 2',
                'Yield LowPriority 2',
                'onCommitRoot',
            ] );
        } );
        expect( allSchedulerTags ).toEqual( [
            [ WorkTag.HostRoot ],
            [ WorkTag.FunctionComponent ],
            [ WorkTag.FunctionComponent ],
        ] );
        expect( allSchedulerTypes ).toEqual( [
            [ null ],
            [ SyncPriorityUpdater ],
            [ LowPriorityUpdater ],
        ] );

        // Verify no outstanding flushes
        await waitForAll( [] );
    } );
} );
