export type QuerySaveInput = { key: string } & object;

export type QueryCreateAutoSaveManagerOptions<TState extends object, TSave extends QuerySaveInput> = {
    getKey( state: TState ): string;
    pickToSave( state: TState ): TSave;
    save( input: TSave ): Promise<void>;
    debounceMs?: number;
    intervalMs?: number;
};

export type QueryAutoSaveManager<TState extends object, _TSave extends QuerySaveInput> = {
    queryUpsert( state: TState, immediate?: boolean ): Promise<void>;
    queryFlush(): Promise<void>;
    queryFlushKey( key: string ): Promise<void>;
};

export function queryCreateAutoSaveManager<TState extends object, TSave extends QuerySaveInput>( options: QueryCreateAutoSaveManagerOptions<TState, TSave> ): QueryAutoSaveManager<TState, TSave> {
    let debounceId: number | undefined;
    const pending = new Map<string, TState>();
    const debounceMs = options.debounceMs ?? 800;
    const intervalMs = options.intervalMs ?? 5000;

    const queryFlush = async () => {
        const entries = Array.from( pending.values() );
        if ( ! entries.length ) return;
        pending.clear();
        await Promise.all( entries.map( s => options.save( options.pickToSave( s ) ) ) );
    };

    const schedule = ( immediate: boolean ) => {
        if ( immediate ) return queryFlush();
        if ( debounceId ) clearTimeout( debounceId );
        debounceId = setTimeout( () => { void queryFlush(); }, debounceMs ) as unknown as number;
        return Promise.resolve();
    };

    const queryUpsert = ( state: TState, immediate?: boolean ) => {
        pending.set( options.getKey( state ), state );
        return schedule( Boolean( immediate ) );
    };

    const queryFlushKey = async ( key: string ) => {
        const s = pending.get( key );
        if ( ! s ) return;
        pending.delete( key );
        await options.save( options.pickToSave( s ) );
    };

    setInterval( () => { void schedule( false ); }, intervalMs );
    window.addEventListener( "beforeunload", () => { void queryFlush(); } );

    return { queryUpsert, queryFlush, queryFlushKey };
}

