/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { ControllerBase } from "../bases";

/**
 * @internal
 */
export class ControllerAlreadyRegistered extends Error {
    public constructor( controller: ControllerBase ) {
        super( `Controller: '${ controller.getName() }' is already registered` );
    }
}
