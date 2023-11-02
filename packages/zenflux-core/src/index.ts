/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import * as ZenCore from "@z-core/exports";

// TODO: Only in development mode
if ( ! globalThis?.zCore ) {
    globalThis.zCore = ZenCore;
}

declare global {
    var zCore: typeof ZenCore;
}

export * from "@z-core/exports-index";

export default ZenCore;
