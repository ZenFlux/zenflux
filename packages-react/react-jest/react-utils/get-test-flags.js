function getTestFlags() {
    // These are required on demand because some of our tests mutate them. We try
    // not to but there are exceptions.
    const featureFlags = require( "@zenflux/react-shared/src/react-feature-flags" );
    const schedulerFeatureFlags = require( "@zenflux/react-scheduler/src/scheduler-feature-flags" );

    const www = global.__WWW__ === true;
    const releaseChannel = www
        ? __EXPERIMENTAL__
            ? "modern"
            : "classic"
        : __EXPERIMENTAL__
            ? "experimental"
            : "stable";

    // Return a proxy, so we can throw if you attempt to access a flag that
    // doesn't exist.
    return new Proxy(
        {
            channel: releaseChannel,
            modern: releaseChannel === "modern",
            classic: releaseChannel === "classic",
            source: ! process.env.IS_BUILD,
            www,

            // This isn't a flag, just a useful alias for tests.
            enableActivity: releaseChannel === "experimental" || www,
            enableUseSyncExternalStoreShim: ! __VARIANT__,
            enableSuspenseList: releaseChannel === "experimental" || www,
            enableLegacyHidden: www,

            // If there's a naming conflict between scheduler and React feature flags, the
            // React ones take precedence.
            // TODO: Maybe we should error on conflicts? Or we could namespace
            // the flags
            ...schedulerFeatureFlags,
            ...featureFlags,
            ...environmentFlags,
        },
        {
            get( flags, flagName ) {
                const flagValue = flags[ flagName ];
                if ( flagValue === undefined && typeof flagName === "string" ) {
                    throw Error(
                        `Feature flag "${ flagName }" does not exist. See setup-react-test-flags.js ` +
                        "for more details."
                    );
                }
                return flagValue;
            },
        }
    );
}

exports.getTestFlags = getTestFlags;
