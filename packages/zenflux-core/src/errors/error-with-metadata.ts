export class ErrorWithMetadata extends Error {
    public metadata: any;

    public constructor( message: string, metadata: any | null = null ) {
        super( message );
        this.metadata = metadata;
        const metaView = null !== metadata ? formatMetadata( metadata ) : null;

        this.message = null !== metaView ? `${ message } - Metadata: ${ metaView }` : message;

        Object.setPrototypeOf( this, new.target.prototype );
    }
}

function formatMetadata( metadata: any ) {
    try {
        if ( metadata === null || metadata === undefined ) {
            return String( metadata );
        }

        if ( typeof metadata === "object" ) {
            return JSON.stringify( metadata );
        }

        return String( metadata );
    } catch ( err ) {
        return "[unserializable metadata]";
    }
}
