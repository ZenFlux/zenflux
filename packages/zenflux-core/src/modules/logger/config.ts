const DEFAULT_LOG_LEVEL = "5";

// Note: avoid importing `process` so browser bundles (Vite) don't inject an
// external shim that throws. Instead, safely peek at both process.env (Node)
// and import.meta.env (bundlers) when present.
function getEnvVar( key: string ): string | undefined {
    // Node / SSR
    if ( typeof process !== "undefined" && process?.env ) {
        return process.env[ key ] ?? process.env[ `VITE_${ key }` ];
    }

    // Vite / ESM build-time injected env
    if ( typeof import.meta !== "undefined" && ( import.meta as any ).env ) {
        const env = ( import.meta as any ).env;
        return env[ key ] ?? env[ `VITE_${ key }` ];
    }

    return undefined;
}

export function getLoggerDefaultLevel(): string {
    return DEFAULT_LOG_LEVEL;
}

export function getLoggerLogLevel(): number {
    const raw = getEnvVar( "LOGGER_LOG_LEVEL" );
    return parseInt( raw ?? DEFAULT_LOG_LEVEL, 10 );
}

export function getLoggerTimeFormat(): string {
    // Example: "[Y-M-D h:m:s]" or "Y/M/D". Empty string disables timestamp prefix.
    return ( getEnvVar( "LOGGER_TIME_FORMAT" ) || "" ).trim();
}

export function getLoggerLogLevelString(): string {
    switch ( getLoggerLogLevel() ) {
        case 0:
            return "NONE";
        case 1:
            return "ERROR";
        case 2:
            return "WARN";
        case 3:
            return "ADMIN";
        case 4:
            return "INFO";
        case 5:
            return "LOG";
        case 6:
            return "DEBUG";
        default:
            return "UNKNOWN";
    }
}

export function isLoggerDebugEnabled(): boolean {
    return getLoggerLogLevel() >= 6;
}

export function isLoggerDisabled(): boolean {
    return getEnvVar( "LOGGER_DISABLED" ) === "true";
}

export function isLoggerPreviousSourceDisabled(): boolean {
    return getEnvVar( "LOGGER_LOG_PREVIOUS_CALLER_SOURCE_DISABLED" ) === "true";
}
