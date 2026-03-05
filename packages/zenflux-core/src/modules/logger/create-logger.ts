import Implementation from "./implementation";

type LoggerOptions = {
    skipEventBusHook?: boolean;
    repeatedly?: boolean;
};

export class ZenFluxLogger extends Implementation {}

// Cache for HMR support - prevents "Logger already exists" errors during hot reload
const loggerCache = new Map<string, ZenFluxLogger>();

const resolveOwnerName = ( owner: string | object ): string => {
    if ( typeof owner === "string" ) {
        return owner;
    }

    if ( owner && typeof ( owner as any ).getName === "function" ) {
        return ( owner as any ).getName();
    }

    return "UnknownOwner";
};

export const createLogger = ( owner: string | object, options?: LoggerOptions ) => {
    const ownerName = resolveOwnerName( owner );

    // Return cached logger if it exists (HMR support)
    const cached = loggerCache.get( ownerName );
    if ( cached ) {
        return cached;
    }

    const logger = new ZenFluxLogger( owner, options );
    loggerCache.set( ownerName, logger );

    return logger;
};
