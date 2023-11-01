/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
export type TCaller = string | Function;

export interface ILogger {
    log( caller: TCaller, message: string, ...params: any[] ): void;
    warn( caller: TCaller, message: string, ...params: any[] ): void;
    error( caller: TCaller, message: string, ...params: any[] ): void;
    info( caller: TCaller, message: string, ...params: any[] ): void;
    debug( caller: TCaller, message: string, ...params: any[] ): void;

    startsEmpty( caller: TCaller ): void;
    startsWith( caller: TCaller, params: object ): void;

    dump( caller: TCaller, params: { [ key: string ]: object|string } ): void;
    drop( caller: TCaller, according: { [ key: string ]: string }, data: any ): void;
}
