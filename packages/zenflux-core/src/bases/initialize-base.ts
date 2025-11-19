import { ObjectBase } from "@zenflux/core/src/bases/object-base";

import { Logger } from "@zenflux/core/src/modules/logger";

export abstract class InitializeBase extends ObjectBase {
    protected logger: Logger;

    protected constructor( shouldInitialize = true ) {
        super();

        this.logger = new Logger( this );

        if ( this.initialize && shouldInitialize ) {
            this.initialize();
        }
    }

    protected initialize?(): void;

    // TODO: Find better place for this
    protected debounce<T extends ( ...args: any[] ) => any>( func: T, delay: number ) {
        let timeoutId: ReturnType<typeof setTimeout>;

        return ( ...args: Parameters<T> ) => {
            clearTimeout( timeoutId );

            timeoutId = setTimeout( () => {
                func.apply( this, args );
            }, delay );
        };
    }
}
