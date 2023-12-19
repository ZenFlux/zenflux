/* eslint-disable */

const NODE_ENV = process.env.NODE_ENV;

if ( NODE_ENV !== 'development' && NODE_ENV !== 'production' ) {
    throw new Error( `NODE_ENV must either be set to development or production, current: ${ process.env.NODE_ENV ?? "NOT_SET" }` );
}

global.__DEV__ = NODE_ENV === 'development';
global.__EXTENSION__ = false;
global.__TEST__ = NODE_ENV === 'test';
global.__PROFILE__ = NODE_ENV === 'development';
global.__UMD__ = false;

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to running tests in experimental mode. If the release channel is
// set via an environment variable, then check if it's "experimental".
global.__EXPERIMENTAL__ =
    typeof RELEASE_CHANNEL === 'string'
        ? RELEASE_CHANNEL === 'experimental'
        : true;

global.__VARIANT__ = !! process.env.VARIANT;

global.React = require( 'react' );
