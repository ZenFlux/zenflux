const util = require( "node:util" );

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
            util.format( format, ...args ),
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
        const messages = unexpectedConsoleCallStacks.map(
            ( [ stack, message ] ) =>
                `\x1b[31m${ message }\x1b[0m\n` +
                `${ stack
                    .split( '\n' )
                    .map( line => `\x1b[90m${ line }\x1b[0m` )
                    .join( '\n' ) }`
        );

        const message =
            `Expected test not to call \x1b[1mconsole.${ methodName }()\x1b[0m.\n\n` +
            'If the warning is expected, test for it explicitly by:\n' +
            `1. Using the \x1b[1m.${ expectedMatcher }()\x1b[0m ` +
            `matcher, or...\n` +
            `2. Mock it out using \x1b[1mspyOnDev\x1b[0m(console, '${ methodName }') or \x1b[1mspyOnProd\x1b[0m(console, '${ methodName }'), and test that the warning occurs.`;

        throw new Error( `${ message }\n\n${ messages.join( '\n\n' ) }` );
    }
};

if ( "undefined" === typeof __UNEXPECTED_ERROR_CALL_STACKS__ ) {
    global.__UNEXPECTED_ERROR_CALL_STACKS__ = [];
}

if ( "undefined" === typeof __UNEXPECTED_WARN_CALL_STACKS__ ) {
    global.__UNEXPECTED_WARN_CALL_STACKS__ = [];
}

const errorMethod = patchConsoleMethod( 'error', __UNEXPECTED_ERROR_CALL_STACKS__ );
const warnMethod = patchConsoleMethod( 'warn', __UNEXPECTED_WARN_CALL_STACKS__ );

const flushAllUnexpectedConsoleCalls = () => {
    flushUnexpectedConsoleCalls(
        errorMethod,
        'error',
        'toErrorDev',
        __UNEXPECTED_ERROR_CALL_STACKS__
    );
    flushUnexpectedConsoleCalls(
        warnMethod,
        'warn',
        'toWarnDev',
        __UNEXPECTED_WARN_CALL_STACKS__
    );
    __UNEXPECTED_ERROR_CALL_STACKS__.length = 0;
    __UNEXPECTED_WARN_CALL_STACKS__.length = 0;
};

const resetAllUnexpectedConsoleCalls = () => {
    __UNEXPECTED_ERROR_CALL_STACKS__.length = 0;
    __UNEXPECTED_WARN_CALL_STACKS__.length = 0;
};

beforeEach( resetAllUnexpectedConsoleCalls );
afterEach( flushAllUnexpectedConsoleCalls );

exports.flushAllUnexpectedConsoleCalls = flushAllUnexpectedConsoleCalls;
exports.resetAllUnexpectedConsoleCalls = resetAllUnexpectedConsoleCalls;
