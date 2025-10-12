import React from "react";

import moment from "moment";

import { ArrowSkinnyRight, Pencil, Save, Cancel } from "@zenflux/react-ui/src/symbols";

import { withCommands } from "@zenflux/react-commander/with-commands";

import * as commands from "@zenflux/app-budget-allocation/src/components/channel-item/commands";

import { useChannelBreaks } from "@zenflux/app-budget-allocation/src/components/channel-item/hooks/use-channel-breaks";
import { useChannelEditing } from "@zenflux/app-budget-allocation/src/components/channel-item/hooks/use-channel-editing";
import { useBreaksTableScroller } from "@zenflux/app-budget-allocation/src/components/channel-item/hooks/use-breaks-table-scroller";

import { Input } from "@zenflux/app-budget-allocation/src/components/ui/input";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";

import { DEFAULT_CHANNEL_BREAK_INPUT_PROPS } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants";

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

export const ChannelItemTable: DCommandFunctionComponent<{ $data: Channel }, ChannelItemTableState> = ( props, _mm ) => {
    const { breaks, setBreakdown } = useChannelBreaks( props.$data );
    const { editing: isEditing, toggle, setEnabled } = useChannelEditing( breaks.length );
    const { ref: tableRef, direction: arrowRightOrLeft, onArrowClick } = useBreaksTableScroller( 500 );

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
                                <Pencil onClick={ () => toggle( index ) }/>
                                <Save onClick={ () => {
                                    const valueToPersist = breaks?.[ index ]?.value ?? budgetBreak.value;

                                    setBreakdown( index, valueToPersist );
                                    setEnabled( index, false );
                                } }/>
                                <Cancel onClick={ () => {
                                    const initialValue = props.$data.breaks?.[ index ]?.value ?? budgetBreak.value;

                                    setBreakdown( index, initialValue );
                                    setEnabled( index, false );
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
