/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
/* eslint-disable @zenflux/no-relative-imports,no-restricted-imports */
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
