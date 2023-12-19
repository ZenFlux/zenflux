const { format } = require( "node:util" );

const shouldIgnoreConsoleError = require( "./react-utils/should-ignore-console-error" );

// TODO: Consider consolidating this with `yieldValue`. In both cases, tests
// should not be allowed to exit without asserting on the entire log.
const patchConsoleMethod = ( methodName, unexpectedConsoleCallStacks ) => {
    const newMethod = function ( format, ...args ) {
        // Ignore uncaught errors reported by jsdom
        // and React addendums because they're too noisy.
        if ( methodName === 'error' && shouldIgnoreConsoleError( format, args ) ) {
            return;
        }

        // Capture the call stack now, so we can warn about it later.
        // The call stack has helpful information for the test author.
        // Don't throw yet though b'c it might be accidentally caught and suppressed.
        const stack = new Error().stack;
        unexpectedConsoleCallStacks.push( [
            stack.slice( stack.indexOf( '\n' ) + 1 ),
            format( format, ...args ),
        ] );
    };

    console[ methodName ] = newMethod;

    return newMethod;
};

const flushUnexpectedConsoleCalls = (
    mockMethod,
    methodName,
    expectedMatcher,
    unexpectedConsoleCallStacks
) => {
    if (
        console[ methodName ] !== mockMethod &&
        ! jest.isMockFunction( console[ methodName ] )
    ) {
        throw new Error(
            `Test did not tear down console.${ methodName } mock properly.`
        );
    }

    if ( unexpectedConsoleCallStacks.length > 0 ) {
        throw new Error( "unexpectedConsoleCallStacks not implemented" );
    }

    // if ( unexpectedConsoleCallStacks.length > 0 ) {
    //     const messages = unexpectedConsoleCallStacks.map(
    //         ( [ stack, message ] ) =>
    //             `${ chalk.red( message ) }\n` +
    //             `${ stack
    //                 .split( '\n' )
    //                 .map( line => chalk.gray( line ) )
    //                 .join( '\n' ) }`
    //     );
    //
    //     const message =
    //         `Expected test not to call ${ chalk.bold(
    //             `console.${ methodName }()`
    //         ) }.\n\n` +
    //         'If the warning is expected, test for it explicitly by:\n' +
    //         `1. Using the ${ chalk.bold( '.' + expectedMatcher + '()' ) } ` +
    //         `matcher, or...\n` +
    //         `2. Mock it out using ${ chalk.bold(
    //             'spyOnDev'
    //         ) }(console, '${ methodName }') or ${ chalk.bold(
    //             'spyOnProd'
    //         ) }(console, '${ methodName }'), and test that the warning occurs.`;
    //
    //     throw new Error( `${ message }\n\n${ messages.join( '\n\n' ) }` );
    // }
};

const unexpectedErrorCallStacks = [];
const unexpectedWarnCallStacks = [];

const errorMethod = patchConsoleMethod( 'error', unexpectedErrorCallStacks );
const warnMethod = patchConsoleMethod( 'warn', unexpectedWarnCallStacks );

const flushAllUnexpectedConsoleCalls = () => {
    flushUnexpectedConsoleCalls(
        errorMethod,
        'error',
        'toErrorDev',
        unexpectedErrorCallStacks
    );
    flushUnexpectedConsoleCalls(
        warnMethod,
        'warn',
        'toWarnDev',
        unexpectedWarnCallStacks
    );
    unexpectedErrorCallStacks.length = 0;
    unexpectedWarnCallStacks.length = 0;
};

const resetAllUnexpectedConsoleCalls = () => {
    unexpectedErrorCallStacks.length = 0;
    unexpectedWarnCallStacks.length = 0;
};

beforeEach( resetAllUnexpectedConsoleCalls );
afterEach( flushAllUnexpectedConsoleCalls );
