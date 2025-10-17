import React from "react";

import { useCommandStateSelector } from "@zenflux/react-commander/hooks";

import type { ChannelItemTableState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

export function useChannelEditing( breaksLength: number ) {
    const [ slice, setState ] = useCommandStateSelector<ChannelItemTableState, { editing: boolean[] }>(
        "App/ChannelItem",
        ( state ) => ( { editing: state.editing ?? [] } ),
    );

    const editing = React.useMemo( () => (
        slice.editing.length ? slice.editing : new Array( breaksLength ).fill( false )
    ), [ slice.editing, breaksLength ] ) as boolean[];

    const toggle = React.useCallback( ( index: number ) => {
        const next = [ ... editing ];
        next[ index ] = ! editing[ index ];
        setState( { editing: next } );
    }, [ editing, setState ] );

    const setEnabled = React.useCallback( ( index: number, enabled: boolean ) => {
        const next = [ ... editing ];
        next[ index ] = enabled;
        setState( { editing: next } );
    }, [ editing, setState ] );

    return { editing, toggle, setEnabled };
}

