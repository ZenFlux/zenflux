if ( "undefined" === typeof globalThis.__Z_CUSTOM_LOADER__ ) {
    function zCustomLoaderData( data, sourceId ) {
        if ( globalThis.__Z_CUSTOM_LOADER_DATA__[ sourceId ] ) {
            throw new Error( 'zCustomLoaderData: Duplicate source' + sourceId + " " +
                JSON.stringify( data, null, 4 )
            );
        }

        globalThis.__Z_CUSTOM_LOADER_DATA__[ sourceId ] = data;
    }

    function zCustomLoaderModuleForwarding( forModule, source, target ) {
        if ( "undefined" === typeof globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING__[ forModule ] ) {
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING__[ forModule ] = {};
        }

        if (
            ! globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__[ forModule ] &&
            globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING__[ forModule ][ source ]
        ) {
            throw new Error( 'zCustomLoaderModuleForwarding: Duplicate forwarding ' +
                JSON.stringify( {
                    forModule,
                    source,
                    target
                }, null, 4 )
            );
        }

        globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING__[ forModule ][ source ] = target;
    }

    function zCustomLoader( path, args ) {
        const moduleForwarding = globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING__[ args.moduleName ];

        if ( moduleForwarding ) {
            const forwardedModuleName = moduleForwarding[ path ];

            if ( forwardedModuleName ) {
                path = forwardedModuleName;
            }
        }

        switch ( args.type ) {
            case "import":
                switch ( args.mode ) {
                    case "default":
                        return import( path ).then( function ( module ) {
                            return module.default;
                        } );

                    case "named":
                    case "all":
                        return import( path ).then( function ( module ) {
                            return module;
                        } );

                    default:
                        throw new Error( 'zCustomLoader: Unknown import mode: ' + args.mode );
                }

            case "require":
                if ( path.startsWith( "./" ) ) {
                    return require( args.sourceDir + path.substr( 1 ) );
                }

                return require( path );

            default:
                throw new Error( 'zCustomLoader: Unknown import type: ' + args.type );
        }
    }

    globalThis.__Z_CUSTOM_LOADER_DATA__ = {};
    globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING__ = {};
    globalThis.__Z_CUSTOM_LOADER_MODULE_FORWARDING_EXPECT_DUPLICATE__ = {};

    globalThis.__Z_CUSTOM_LOADER__ = {
        zCustomLoaderData: zCustomLoaderData,
        zCustomLoaderModuleForwarding: zCustomLoaderModuleForwarding,
        zCustomLoader: zCustomLoader,
    };
}


