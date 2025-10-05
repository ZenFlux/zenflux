import React from "react";

import moment from "moment";

import { useComponent, useCommandState, useCommandStateSelector, useCommandHook } from "@zenflux/react-commander/use-commands";

import { Input } from "@zenflux/app-budget-allocation/src/components/ui/input";

import { DEFAULT_CHANNEL_BREAK_INPUT_PROPS } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants.tsx";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";
import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { InputProps } from "@zenflux/app-budget-allocation/src/components/ui/input";

import type { ChannelState, ChannelBreakData } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-types";

import type { ChannelBudgetFrequencyProps } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-budget-settings";

function generateBreaks(
    frequency: ChannelBudgetFrequencyProps["frequency"],
    baseline: string,
) {
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
}

function getBreakElements(
    breaks: ChannelBreakData[],
    breaksElements: React.JSX.Element[],
    allocation: ChannelState["allocation"],
    onInputChange: ( index: number, value: string ) => void
) {
    if ( ! breaks.length ) {
        throw new Error( "Breaks state is empty" );
    }

    const breakElements: React.JSX.Element[] = [];

    const Break: React.FC<{ label: string; value: string, index: number, allocation: ChannelState["allocation"] }> = ( props ) => {
        const { label, index } = props,
            formatted = formatNumericStringToFraction( props.value );

        const disabled = allocation === "equal";

        const inputProps: InputProps = {
            ... DEFAULT_CHANNEL_BREAK_INPUT_PROPS,
            disabled,
            value: formatted,
            onChange: ( e ) => ! disabled && onInputChange( index, e.target.value ),
            variant: "transparent",
            className: cn(
                "w-full h-10 bg-transparent border-0 outline-none px-3 py-0 text-sm",
                disabled ? "text-[#99A4C2] placeholder:text-[#99A4C2]" : "text-[#2A3558] placeholder:text-[#99A4C2]"
            )
        };

        const triggerClassName = cn(
            "trigger flex items-center w-[160px] h-10 border-[2px] rounded-[0px] border-[#b2bbd580]",
            disabled ? "bg-transparent text-[#99A4C2]" : "bg-white"
        );

        return (
            <div className="break flex flex-col gap-2" data-disabled={ inputProps.disabled }>
                <div className="label text-slate-700 text-sm font-normal leading-[21px]">{ label }</div>
                <div className={ triggerClassName }>
                    <span className="currency-sign pl-[12px] pr-[0px] text-[14px] leading-[24px] text-black relative left-[5px]">$</span>
                    <Input { ... inputProps } />
                </div>
            </div>
        );
    };

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

        breakElements.push( <Break key={ date.getTime() } { ... props } /> );

        index++;
    }

    return breakElements;
}

// Optimized content component that only re-renders when breakElements change
const ChannelBreakdownsContent: React.FC<{ ref: React.RefObject<HTMLDivElement> }> = React.memo(({ ref }) => {
    const [state] = useCommandStateSelector<ChannelState, {
        breakElements: React.JSX.Element[]
    }>(
        "App/ChannelItem",
        (state) => ({
            breakElements: state.breakElements || []
        })
    );

    return (
        <div ref={ ref } className="content p-[24px] grid grid-cols-6 gap-[20px]">
            { state.breakElements }
        </div>
    );
});

ChannelBreakdownsContent.displayName = "ChannelBreakdownsContent";

export const ChannelBreakdowns: React.FC = () => {
    const component = useComponent( "App/ChannelItem" );
    const [ _getState, setState ] = useCommandState<ChannelState>( "App/ChannelItem" );
    const ref = React.useRef<HTMLDivElement>( null );
    const onBreakdownInputChange = ( index: number, value: string ) => {
        component.run( "App/ChannelItem/SetBreakdown", { index, value, source: UpdateSource.FROM_BUDGET_BREAKS } );
    };

    const updateBreakdownElements = () => {
        const currentState = component.getState<ChannelState>();

        // Always ensure we have breaks
        let breaks = currentState.breaks;
        if ( ! breaks?.length ) {
            breaks = generateBreaks( currentState.frequency, currentState.baseline );
            setState( { breaks } );
        }

        // Generate break elements from the breaks
        const newBreakElements = getBreakElements(
            breaks,
            currentState.breakElements || [],
            currentState.allocation,
            onBreakdownInputChange
        );

        setState( { breakElements: newBreakElements } );
    };

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
    }, [] );

    // This component handles all the logic but delegates rendering to the optimized content component
    return <ChannelBreakdownsContent ref={ ref } />;
};

