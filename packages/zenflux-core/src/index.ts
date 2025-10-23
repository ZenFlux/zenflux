/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import * as ZenCore from "@zenflux/core/src/exports";

// TODO: Only in development mode
if ( ! globalThis?.zCore ) {
    globalThis.zCore = ZenCore;
}

declare global {
    var zCore: typeof ZenCore;
}

export * from "@zenflux/core/src/exports-index";

export default ZenCore;
