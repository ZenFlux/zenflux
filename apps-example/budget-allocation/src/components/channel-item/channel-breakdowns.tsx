import React, { useCallback } from "react";

import moment from "moment";

import { useComponent, useCommandState, useCommandHook } from "@zenflux/react-commander/hooks";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";

import { ChannelItemBreak } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-break";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

import type { ChannelState, ChannelBreakData } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

import type { ChannelBudgetFrequencyProps } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings";

export const ChannelBreakdowns: React.FC = () => {
    const component = useComponent( "App/ChannelItem" );

    const [ , setState ] = useCommandState<ChannelState>( "App/ChannelItem" );

    const onBreakdownInputChange = useCallback( ( index: number, value: string ) => {
        component.run( "App/ChannelItem/SetBreakdown", { index, value, source: UpdateSource.FROM_BUDGET_BREAKS } );
    }, [ component ] );

    const handleBudgetSettingsChange = async () => {
        const currentState = component.getState<ChannelState>();
        const newBreaks = generateBreaks( currentState.frequency, currentState.baseline );

        setState( { breaks: newBreaks } );
    };

    const handleBreakdownSum = () => {
        const values = Array.from( document.querySelectorAll( ".break input" ) )
            .map( ( input ) => parseFloat( ( input as HTMLInputElement ).value.replace( /,/g, "" ) ) );

        const sum = formatNumericStringToFraction( values
            .filter( ( value ) => ! isNaN( value ) )
            .reduce( ( a, b ) => a + b, 0 )
            .toString()
        );

        setState( { baseline: sum! } );
    };

    const [ settings ] = useCommandState<ChannelState, {
        allocation: ChannelState["allocation"]
        frequency: ChannelState["frequency"]
        baseline: ChannelState["baseline"]
    }>(
        "App/ChannelItem",
        ( state ) => ({
            allocation: state.allocation,
            frequency: state.frequency,
            baseline: state.baseline,
        })
    );

    const [ breaks ] = useCommandState<ChannelState, {
        breaks: ChannelBreakData[]
    }>(
        "App/ChannelItem",
        (state) => ({
            breaks: state.breaks?.length ? state.breaks : generateBreaks( state.frequency, state.baseline )
        }),

    );

    useCommandHook( "App/ChannelItem/SetBaseline", handleBudgetSettingsChange, );
    useCommandHook( "App/ChannelItem/SetFrequency", handleBudgetSettingsChange );
    useCommandHook( "App/ChannelItem/SetAllocation", handleBudgetSettingsChange );
    useCommandHook( "App/ChannelItem/SetBreakdown", handleBreakdownSum );

    const elements = useBreakElements( breaks.breaks, settings.allocation, onBreakdownInputChange );

    return (
        <div className="content p-[24px] grid grid-cols-6 gap-[20px]">
            { elements }
        </div>
    );
};

const generateBreaks = (
    frequency: ChannelBudgetFrequencyProps["frequency"],
    baseline: string,
) => {
    const breaks: ChannelBreakData[] = [];

    const baselineParsed = parseFloat( baseline.toString().replace( /,/g, "" ) );

    let fillValue;

    // noinspection FallThroughInSwitchStatementJS
    switch ( frequency ) {
        case "annually":
            // Per month.
            fillValue = baselineParsed / 12;
            break;

        case "monthly":
            // Same each month.
            fillValue = baselineParsed;
            break;

        case "quarterly":
            const perQuarter = baselineParsed / 4;

            for ( let i = 0 ; i < 12 ; i++ ) {
                const date = moment().month( i ).toDate();
                if ( i % 3 === 0 ) {
                    breaks.push( {
                        date,
                        value: perQuarter.toString(),
                    } );
                    continue;
                }

                // No budget
                breaks.push( {
                    date,
                    value: "0",
                } );
            }

            break;

        default:
            throw new Error( `Invalid frequency: ${ frequency }` );
    }

    if ( ! breaks.length ) {
        for ( let i = 0 ; i < 12 ; i++ ) {
            breaks.push( {
                date: moment().month( i ).toDate(),
                value: fillValue!.toString(),
            } );
        }
    }

    return breaks;
};

const useBreakElements = (
    breaks: ChannelBreakData[],
    allocation: ChannelState["allocation"],
    onInputChange: ( index: number, value: string ) => void
) => {
    const elementsRef = React.useRef<React.JSX.Element[]>( [] );

    const elements = React.useMemo( () => {
        if ( ! breaks.length ) return [] as React.JSX.Element[];

        const prev = elementsRef.current;
        const isAllocationChanged = prev?.some( ( element ) => element.props.allocation !== allocation );

        const next: React.JSX.Element[] = [];

        let index = 0;

        for ( const { date, value } of breaks ) {
            if ( ! isAllocationChanged && prev?.[ index ] ) {
                const exist = prev[ index ];
                if ( exist.props.value.toString() !== value.toString() ) {
                    next.push( React.cloneElement( exist, { value: value.toString() } ) );
                    index++;
                    continue;
                }
                next.push( exist );
                index++;
                continue;
            }

            const label = moment( date ).format( "MMM D" );
            const props = { index, allocation, label, value: value.toString() };
            next.push( <ChannelItemBreak key={ date.getTime() } { ... props } onInputChange={ onInputChange } /> );
            index++;
        }

        elementsRef.current = next;
        return next;
    }, [ breaks, allocation, onInputChange ] );

    return elements;
};
