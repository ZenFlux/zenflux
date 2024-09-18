"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CHANNEL_BREAK_INPUT_PROPS = exports.CHANNEL_LIST_STATE_DATA_WITH_META = exports.CHANNEL_LIST_STATE_DATA = exports.META_DATA_KEYS = void 0;
var react_1 = require("react");
exports.META_DATA_KEYS = {
    id: true,
    icon: true,
    name: true,
    createdAt: true,
};
exports.CHANNEL_LIST_STATE_DATA = {
    allocation: true,
    baseline: true,
    frequency: true,
    breaks: true,
    // Visual
    breakElements: false,
    // Saved separately
    meta: false
};
exports.CHANNEL_LIST_STATE_DATA_WITH_META = {
    allocation: true,
    baseline: true,
    frequency: true,
    breaks: true,
    // Visual
    breakElements: false,
    // Saved separately
    meta: true
};
exports.DEFAULT_CHANNEL_BREAK_INPUT_PROPS = {
    classNames: {
        base: "input",
        mainWrapper: "wrapper",
        inputWrapper: "trigger",
        label: "currency",
    },
    type: "string",
    variant: "bordered",
    radius: "none",
    labelPlacement: "outside",
    placeholder: "0",
    startContent: (<div className="pointer-events-none flex items-center ">
            <span className="currency-sign text-slate-700 text-sm font-medium leading-[21px]">$</span>
        </div>),
};
