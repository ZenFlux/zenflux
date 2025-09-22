import React from "react";

import moment from "moment";

import { Input } from "@nextui-org/input";

import { ArrowSkinnyRight, Pencil, Save, Cancel } from "@zenflux/react-ui/src/symbols";

import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommanderState, useCommanderComponent } from "@zenflux/react-commander/use-commands";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";

import { DEFAULT_CHANNEL_BREAK_INPUT_PROPS } from "@zenflux/app-budget-allocation/src/components/channel/channel-constants";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import * as commands from "@zenflux/app-budget-allocation/src/components/channel/commands";

import "@zenflux/app-budget-allocation/src/components/channel/_channel-item-table.scss";

import type { ChannelItemProps, ChannelState } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";
import type { InputProps } from "@nextui-org/input";

import type { CommandFunctionComponent } from "@zenflux/react-commander/types";

declare global {
    interface Math {
        easeInOutQuad( t: number, b: number, c: number, d: number ): number;
    }
}

export const ChannelItemTable: CommandFunctionComponent<ChannelItemProps, ChannelState> = ( props ) => {
    const [ getState, _setState , isMounted ] = useCommanderState<ChannelState>( "App/ChannelItem" ),
        state = getState();

    const [ isEditing, setIsEditing ] = React.useState<boolean[]>( new Array( state.breaks!.length ).fill( false ) );
    const [ arrowRightOrLeft, setArrowRightOrLeft ] = React.useState<"right" | "left">( "right" );
    const [ cloneState, setCloneState ] = React.useState( state );

    React.useEffect( () => {
        if ( isMounted() ) {
            setCloneState( {
                ... state,
            } );
        }
    }, [ isMounted() ] );

    // @ts-ignore - Handles issue with state not being set on first render, when page loaded on overview.
    if ( ! state.breaks?.length && props.breaks.length ) state.breaks = props.breaks;

    const tableRef = React.useRef<HTMLDivElement>( null );

    const commands = useCommanderComponent( "App/ChannelItem" );

    const setBreakdown = ( index: number, value: string, force = false ) => {
        if ( ! force ) {
            commands.run( "App/ChannelItem/SetBreakdown", {
                index,
                value,
                setState: setCloneState,
                source: UpdateSource.FROM_BUDGET_OVERVIEW
            } );

            return;
        }

        commands.run( "App/ChannelItem/SetBreakdown", { index, value, source: UpdateSource.FROM_BUDGET_OVERVIEW } );

        const newIsEditing = [ ... isEditing ];
        newIsEditing[ index ] = false;
        setIsEditing( newIsEditing );

        setCloneState( {
            ... cloneState,
            breaks: cloneState.breaks!.map( ( budgetBreak, i ) => ( {
                ... budgetBreak,
                value: i === index ? value : budgetBreak.value,
            } ) ),
        } );
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
                { state.breaks!.map( ( budgetBreak, index ) => {
                    return (
                        <div key={ index } className="channel-item-table-date">
                            <>{ moment( budgetBreak.date ).format( "MMM D" ) }</>
                        </div>
                    );
                } ) }
                { cloneState.breaks!.map( ( budgetBreak, index ) => {
                    const disabled = ! isEditing[ index ];

                    const inputProps: InputProps = {
                        ... DEFAULT_CHANNEL_BREAK_INPUT_PROPS,

                        disabled,

                        variant: "flat",

                        onChange: ( event ) => {
                            ! disabled && setBreakdown( index, event.target.value );
                        },

                        endContent: ( <span className="control-area">
                            <Pencil onClick={ () => {
                                const newIsEditing = [ ... isEditing ];

                                newIsEditing[ index ] = ! isEditing[ index ];

                                setIsEditing( newIsEditing );
                            } }/>

                            <Save onClick={ () => {
                                setBreakdown( index, cloneState.breaks![ index ].value, true );
                            } }/>

                            <Cancel onClick={ () => {
                                setBreakdown( index, state.breaks![ index ].value, true );
                            } }/>

                        </span> ),

                        value: formatNumericStringToFraction( budgetBreak.value ),
                    };

                    return (
                        <div key={ index } className="channel-item-table-budget" data-disabled={ disabled }>
                            <Input { ... inputProps }/>
                        </div>
                    );
                } ) }
            </div>
        </div>
    );
};

const $$ = withCommands<ChannelItemProps, ChannelState>( "App/ChannelItem", ChannelItemTable, {
        frequency: "annually",
        baseline: "0",
        allocation: "equal",
        breaks: [],
    }, [
        commands.SetBreakdown,
    ]
);

export default $$;
