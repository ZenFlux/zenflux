export type CrossOriginString = string;

export function getCrossOriginString( input: string | null | undefined ): CrossOriginString | null | undefined {
    if ( typeof input === "string" ) {
        return input === "use-credentials" ? input : "";
    }

    return undefined;
}

export function getCrossOriginStringAs( as: string | null | undefined, input: string | null | undefined ): CrossOriginString | null | undefined {
    if ( as === "font" ) {
        return "";
    }

    if ( typeof input === "string" ) {
        return input === "use-credentials" ? input : "";
    }

    return undefined;
}
