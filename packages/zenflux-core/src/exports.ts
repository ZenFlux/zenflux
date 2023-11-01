/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

/**
 * api-extractor 7.97.1: ERROR: The "export * as ___" syntax is not supported yet; as a workaround, use "import * as ___" with a separate "export { ___ }" declaration
 *
 * export * as bases from "./bases";
 * export * as commandBases from "./command-bases";
 * export * as errors from "./errors";
 * export * as interfaces from "./interfaces";
 * export * as managers from "./managers/export";
 */

import * as bases from "@z-core/bases";
import * as commandBases from "@z-core/command-bases";
import * as errors from "@z-core/errors/index-public";
import * as interfaces from "@z-core/interfaces";
import * as managers from "@z-core/managers/export";

import type { ILogger, TCaller } from "@z-core/interfaces";

export const classes = {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/explicit-member-accessibility */

    Logger: class NullLogger implements ILogger {
        constructor(owner: typeof bases.ObjectBase, params: any = {} ) {}
        log( caller: TCaller, message: string, ... params: any[] ) {}
        warn( caller: TCaller, message: string, ... params: any[] ) {}
        error( caller: TCaller, message: string, ... params: any[] ) {}
        info( caller: TCaller, message: string, ... params: any[] ) {}
        debug( caller: TCaller, message: string, ... params: any[] ) {}
        startsEmpty( caller: TCaller ) {}
        startsWith( caller: TCaller, params: object ) {}
        dump( caller: TCaller, data: any ) {}
        drop( caller: TCaller, according: { [ key: string ]: string }, data: any ) {}
    }

    /* eslint-enable */
};

export {
    bases,
    commandBases,
    errors,
    interfaces,
    managers
};
