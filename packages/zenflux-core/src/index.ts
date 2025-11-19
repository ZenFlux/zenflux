/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

import * as ZenCore from "./exports";

// TODO: Only in development mode
if ( ! globalThis?.zCore ) {
    globalThis.zCore = ZenCore;
}

declare global {
    var zCore: typeof ZenCore;
}

export * from "./exports-index";

export default ZenCore;
