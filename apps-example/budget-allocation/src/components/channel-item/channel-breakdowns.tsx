import React, { useCallback } from "react";

import moment from "moment";

import { useComponent, useCommandState, useCommandStateSelector, useCommandHook } from "@zenflux/react-commander/use-commands";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";

import { ChannelBreak } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-break";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { ChannelState, ChannelBreakData } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { ChannelBudgetFrequencyProps } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings";

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

const getBreakElements = (
    breaks: ChannelBreakData[],
    breaksElements: React.JSX.Element[],
    allocation: ChannelState["allocation"],
    onInputChange: ( index: number, value: string ) => void
) => {
    if ( ! breaks.length ) {
        throw new Error( "Breaks state is empty" );
    }

    const breakElements: React.JSX.Element[] = [];

    function formatDate( date: Date ) {
        return moment( date ).format( "MMM D" );
    };

    let index = 0;

    const isAllocationChanged = breaksElements?.some( ( element ) => element.props.allocation !== allocation );

    for ( const { date, value } of breaks ) {
        if ( ! isAllocationChanged && breaksElements?.[ index ] ) {
            const existBreakElement = breaksElements?.[ index ];

            // Update with pinceta
            if ( existBreakElement.props.value.toString() !== value.toString() ) {
                breakElements.push( React.cloneElement( existBreakElement, {
                    value: value.toString(),
                } ) );

                index++;
                continue;
            }

            breakElements.push( existBreakElement );
            index++;
            continue;
        }

        const props = {
            index,
            allocation,
            label: formatDate( date ),
            value: value.toString(),
        };

        breakElements.push( <ChannelBreak key={ date.getTime() } { ... props } onInputChange={ onInputChange } /> );

        index++;
    }

    return breakElements;
};

export const ChannelBreakdowns: React.FC = () => {
    const component = useComponent( "App/ChannelItem" );

    const [ _getState, setState ] = useCommandState<ChannelState>( "App/ChannelItem" );

    const onBreakdownInputChange = useCallback( ( index: number, value: string ) => {
        component.run( "App/ChannelItem/SetBreakdown", { index, value, source: UpdateSource.FROM_BUDGET_BREAKS } );
    }, [ component ] );

    const updateBreakdownElements = useCallback( () => {
        const currentState = component.getState<ChannelState>();

        // Always ensure we have breaks
        let breaks = currentState.breaks;
        let shouldUpdateBreaks = false;

        if ( ! breaks?.length ) {
            breaks = generateBreaks( currentState.frequency, currentState.baseline );
            shouldUpdateBreaks = true;
        }

        // Generate break elements from the breaks
        const newBreakElements = getBreakElements(
            breaks,
            currentState.breakElements || [],
            currentState.allocation,
            onBreakdownInputChange
        );

        // Only update state if breaks changed or break elements changed
        const hasBreakElementsChanged = JSON.stringify( currentState.breakElements ) !== JSON.stringify( newBreakElements );

        if ( shouldUpdateBreaks || hasBreakElementsChanged ) {
            setState( {
                ...( shouldUpdateBreaks ? { breaks } : {} ),
                breakElements: newBreakElements
            } );
        }
    }, [ component, setState, onBreakdownInputChange ] );

    const handleBudgetSettingsChange = async () => {
        const currentState = component.getState<ChannelState>();
        const newBreaks = generateBreaks( currentState.frequency, currentState.baseline );

        // Update breaks and then generate new break elements
        setState( { breaks: newBreaks } );

        // Generate new break elements with the updated breaks
        const newBreakElements = getBreakElements(
            newBreaks,
            currentState.breakElements || [],
            currentState.allocation,
            onBreakdownInputChange
        );

        setState( { breakElements: newBreakElements } );
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

    useCommandHook( "App/ChannelItem/SetBaseline", handleBudgetSettingsChange, );
    useCommandHook( "App/ChannelItem/SetFrequency", handleBudgetSettingsChange );
    useCommandHook( "App/ChannelItem/SetAllocation", handleBudgetSettingsChange );
    useCommandHook( "App/ChannelItem/SetBreakdown", handleBreakdownSum );

    React.useEffect( () => {
        updateBreakdownElements();
    }, [ updateBreakdownElements ] );

    const [ state ] = useCommandStateSelector<ChannelState, {
        breakElements: React.JSX.Element[]
    }>(
        "App/ChannelItem",
        (state) => ({
            breakElements: state.breakElements || []
        })
    );

    return (
        <div className="content p-[24px] grid grid-cols-6 gap-[20px]">
            { state.breakElements }
        </div>
    );
};

