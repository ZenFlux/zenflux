/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
const zDebounceTimers: {
    [ key: string ]: NodeJS.Timeout
} = {};

export function zDebounce( id: string, fn: () => void, delay: number ) {
    clearTimeout( zDebounceTimers[ id ] );

    zDebounceTimers[ id ] = setTimeout( () => {
        delete zDebounceTimers[ id ];

        fn();
    }, delay );
};
