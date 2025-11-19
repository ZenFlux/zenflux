import React from "react";

import { Input } from "@zenflux/app-budget-allocation/src/components/ui/input";

import { DEFAULT_CHANNEL_BREAK_INPUT_PROPS } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-constants.tsx";

import { formatNumericStringToFraction } from "@zenflux/app-budget-allocation/src/utils";
import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import type { InputProps } from "@zenflux/app-budget-allocation/src/components/ui/input";

import type { ChannelState } from "@zenflux/app-budget-allocation/src/components/channel-item/channel-item-types";

export const ChannelItemBreak: React.FC<{
    label: string;
    value: string;
    index: number;
    allocation: ChannelState[ "allocation" ];
    onInputChange: ( index: number, value: string ) => void;
}> = ( props ) => {
    const { label, index, allocation, onInputChange } = props,
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
