import process from "process";

const DEFAULT_LOG_LEVEL = "5";

export function getLoggerDefaultLevel(): string {
    return DEFAULT_LOG_LEVEL;
}

export function getLoggerLogLevel(): number {
    return parseInt( process.env.LOGGER_LOG_LEVEL || DEFAULT_LOG_LEVEL, 10 );
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
    return process.env.LOGGER_DISABLED === "true";
}

export function isLoggerPreviousSourceDisabled(): boolean {
    return process.env.LOGGER_LOG_PREVIOUS_CALLER_SOURCE_DISABLED === "true";
}
