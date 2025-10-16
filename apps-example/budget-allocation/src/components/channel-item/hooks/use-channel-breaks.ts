import React from "react";

import { useCommand, useCommandStateSelector } from "@zenflux/react-commander/use-commands";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

import type { Channel } from "@zenflux/app-budget-allocation/src/query/channels-domain";
import type { ChannelItemTableState, ChannelBreaks } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

export function useChannelBreaks( initialChannel: Channel ): {
    breaks: ChannelBreaks;
    setBreakdown: ( index: number, value: string ) => void;
} {
    const [ slice, setState ] = useCommandStateSelector<ChannelItemTableState, { breaks: ChannelItemTableState["breaks"] }>(
        "App/ChannelItem",
        ( state ) => ( { breaks: state.breaks ?? [] } ),
    );

    const incomingBreaks = React.useMemo( () => initialChannel.breaks ?? [], [ initialChannel.breaks ] );

    React.useEffect( () => {
        if ( ! incomingBreaks.length || slice.breaks?.length ) return;

        setState( { breaks: incomingBreaks } );
    }, [ incomingBreaks, slice.breaks?.length, setState ] );

    const breaks = ( slice.breaks?.length ? slice.breaks : incomingBreaks ) as ChannelBreaks;

    const command = useCommand( "App/ChannelItem/SetBreakdown" );

    const setBreakdown = React.useCallback( ( index: number, value: string ) => {
        command.run( {
            index,
            value,
            source: UpdateSource.FROM_BUDGET_OVERVIEW,
        } );
    }, [ command ] );

    return { breaks, setBreakdown };
}

