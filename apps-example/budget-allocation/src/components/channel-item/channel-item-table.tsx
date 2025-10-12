import React, { useEffect } from "react";

import moment from "moment";

import { ArrowSkinnyRight, Pencil, Save, Cancel } from "@zenflux/react-ui/src/symbols";

import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommandStateSelector, useComponent } from "@zenflux/react-commander/use-commands";

import { Input } from "@zenflux/app-budget-allocation/src/components/ui/input";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";

import { DEFAULT_CHANNEL_BREAK_INPUT_PROPS } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import * as commands from "@zenflux/app-budget-allocation/src/components/channel-item/commands";

import "@zenflux/app-budget-allocation/src/components/channel-item/_channel-item-table.scss";

import type { ChannelItemTableState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";
import type { InputProps } from "@zenflux/app-budget-allocation/src/components/ui/input";
import type { Channel } from "@zenflux/app-budget-allocation/src/query/channels-domain";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

declare global {
    interface Math {
        easeInOutQuad( t: number, b: number, c: number, d: number ): number;
    }
}

export const ChannelItemTable: DCommandFunctionComponent<{ $data: Channel }, ChannelItemTableState> = ( props, mm ) => {
    const [ commandState, setCommandState ] = useCommandStateSelector<ChannelItemTableState, {
        breaks: ChannelItemTableState["breaks"],
        editing: ChannelItemTableState["editing"],
    }>(
        "App/ChannelItem",
        (state) => ({
            breaks: state.breaks ?? [],
            editing: state.editing ?? []
        })
    );

    const breaks = commandState.breaks?.length ? commandState.breaks : props.$data.breaks ?? [];
    const isEditing = commandState.editing?.length ? commandState.editing : new Array( breaks.length ).fill( false );
    const incomingBreaks = React.useMemo(() => props.$data.breaks ?? [], [props.$data.breaks]);

    useEffect(() => {
        if (!incomingBreaks.length || commandState.breaks?.length) return;

        setCommandState({ breaks: incomingBreaks, editing: new Array(incomingBreaks.length).fill(false) });
    }, [incomingBreaks, commandState.breaks?.length, setCommandState]);

    console.log( {
        mm,
        commandState,
        props,
    } );
    const [ arrowRightOrLeft, setArrowRightOrLeft ] = React.useState<"right" | "left">( "right" );

    const tableRef = React.useRef<HTMLDivElement>( null );

    const component = useComponent( "App/ChannelItem" );

    const setBreakdown = ( index: number, value: string, force = false ) => {
        component.run( "App/ChannelItem/SetBreakdown", {
            index,
            value,
            source: UpdateSource.FROM_BUDGET_OVERVIEW
        } );

        if ( force ) {
            const newIsEditing = [ ... isEditing ];
            newIsEditing[ index ] = false;
            setCommandState( { editing: newIsEditing } );
        }
    };

    // All the code made for "SkinnyRight" is hacky, but that fine for this demo situation.
    function smoothScroll( element: { scrollLeft: number; }, target: number, duration: number ) {
        let start = element.scrollLeft,
            change = target - start,
            startTime = performance.now(),
            val;

        function animateScroll( currentTime: number ) {
            let elapsed = currentTime - startTime;
            val = Math.easeInOutQuad( elapsed, start, change, duration );

            element.scrollLeft = val;

            if ( elapsed < duration ) {
                window.requestAnimationFrame( animateScroll );
            }
        };

        Math.easeInOutQuad = function ( t, b, c, d ) {
            t /= d / 2;
            if ( t < 1 ) return c / 2 * t * t + b;
            t--;
            return -c / 2 * ( t * ( t - 2 ) - 1 ) + b;
        };

        window.requestAnimationFrame( animateScroll );
    }

    function scroll() {
        const table = tableRef.current;

        if ( table ) {
            if ( arrowRightOrLeft === "right" ) {
                smoothScroll( table, table.scrollWidth - table.clientWidth, 500 );
            } else {
                smoothScroll( table, 0, 500 );
            }
        }
    }

    function onArrowClick() {
        setArrowRightOrLeft( arrowRightOrLeft === "right" ? "left" : "right" );

        scroll();
    }

    return (
        <div className={ `channel-item-table ${ arrowRightOrLeft }` } ref={ tableRef }>
            <ArrowSkinnyRight onClick={ () => onArrowClick() }/>
            <div className="channel-item-table-breaks" ref={ tableRef }>
                { breaks?.map( ( budgetBreak, index ) => {
                    return (
                        <div key={ index } className="channel-item-table-date">
                            <>{ moment( budgetBreak.date ).format( "MMM D" ) }</>
                        </div>
                    );
                } ) }
                { breaks.map( ( budgetBreak, index ) => {
                    const disabled = ! isEditing[ index ];

                    const inputProps: InputProps = {
                        ... DEFAULT_CHANNEL_BREAK_INPUT_PROPS,

                        disabled,

                        onChange: ( event ) => {
                            ! disabled && setBreakdown( index, event.target.value );
                        },

                        value: formatNumericStringToFraction( budgetBreak.value ),
                    };

                    return (
                        <div key={ index } className="channel-item-table-budget" data-disabled={ disabled }>
                            <div className="trigger">
                                <span className="currency-sign">$</span>
                                <Input { ... inputProps } />
                            </div>
                            <span className="control-area">
                                <Pencil onClick={ () => {
                                    const newIsEditing = [ ... isEditing ];
                                    newIsEditing[ index ] = ! isEditing[ index ];
                                    setCommandState( { editing: newIsEditing } );
                                } }/>
                                <Save onClick={ () => {
                                    const valueToPersist = commandState.breaks?.[ index ]?.value ?? budgetBreak.value;

                                    setBreakdown( index, valueToPersist, true );
                                } }/>
                                <Cancel onClick={ () => {
                                    const initialValue = props.$data.breaks?.[ index ]?.value ?? budgetBreak.value;

                                    setBreakdown( index, initialValue, true );
                                } }/>
                            </span>
                        </div>
                    );
                } ) }
            </div>
        </div>
    );
};

const $$ = withCommands<{ $data: Channel }, ChannelItemTableState>( "App/ChannelItem", ChannelItemTable, {
    frequency: "annually",
    baseline: "0",
    allocation: "equal",
    breaks: [],
    editing: [],
}, [
    commands.SetBreakdown,
]
);

export default $$;
