/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { ControllerBase } from "../bases";

/**
 * @internal
 */
export class ControllerAlreadySet extends Error {
    public constructor( controller: ControllerBase ) {
        super( `Controller: '${ controller.getName() }' is already set` );
    }
}
