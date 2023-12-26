let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;

describe( 'ReactClassSetStateCallback', () => {
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
        Scheduler = require( '@zenflux/react-scheduler/mock' );
        act = require( '@zenflux/react-internal-test-utils' ).act;

        const InternalTestUtils = require( '@zenflux/react-internal-test-utils' );
        assertLog = InternalTestUtils.assertLog;
    } );

    function Text( { text } ) {
        Scheduler.log( text );
        return text;
    }

    test( 'regression: setState callback (2nd arg) should only fire once, even after a rebase', async () => {
        let app;

        class App extends React.Component {
            state = { step: 0 };

            render() {
                app = this;
                return <Text text={ this.state.step }/>;
            }
        }

        const root = ReactNoop.createRoot();
        await act( () => {
            root.render( <App/> );
        } );
        assertLog( [ 0 ] );

        await act( () => {
            if ( gate( flags => flags.enableUnifiedSyncLane ) ) {
                React.startTransition( () => {
                    app.setState( { step: 1 }, () => Scheduler.log( 'Callback 1' ) );
                } );
            } else {
                app.setState( { step: 1 }, () => Scheduler.log( 'Callback 1' ) );
            }
            ReactNoop.flushSync( () => {
                app.setState( { step: 2 }, () => Scheduler.log( 'Callback 2' ) );
            } );
        } );
        assertLog( [ 2, 'Callback 2', 2, 'Callback 1' ] );
    } );
} );
