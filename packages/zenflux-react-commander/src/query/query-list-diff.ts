export function queryDiffById<T>( prev: T[], curr: T[], getId: ( t: T ) => string ) {
    const prevIds = new Set( prev.map( getId ) );
    const currIds = new Set( curr.map( getId ) );
    const added = curr.filter( i => ! prevIds.has( getId( i ) ) );
    const removed = prev.filter( i => ! currIds.has( getId( i ) ) );
    return { added, removed };
}

