import type { ObjectBase } from "@z-core/bases";

/**
 * @internal
 */
export class ForceMethodBase extends Error {
    public constructor( className: string, methodName: string ) {
        super(
            `ForceMethod implementation: at: '${ className }' method: '${ methodName }'`
        );
    }
}

/**
 * @public
 */
export class ForceMethodImplementation extends Error {
    public constructor( context: ObjectBase | typeof ObjectBase | string, methodName: string ) {
        super(
            `ForceMethod implementation: at: '${ "string" === typeof context ? context : context.getName() }' method: '${ methodName }'`
        );
    }
}
