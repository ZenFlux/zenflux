export default function getActiveElement( doc?: Document | null | undefined ): Element | HTMLInputElement {
    doc = doc || ( typeof document !== "undefined" ? document : undefined );

    if ( typeof doc === "undefined" ) {
        // return null was originally here
        throw new Error( "getActiveElement(...): Unexpected undefined document" );
    }

    try {
        return doc.activeElement || doc.body;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch ( e ) {
        return doc.body;
    }
}
