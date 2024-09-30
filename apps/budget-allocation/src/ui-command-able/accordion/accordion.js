"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var command_base_1 = require("@zenflux/react-commander/command-base");
var with_commands_1 = require("@zenflux/react-commander/with-commands");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var ui_theme_accordion_1 = require("@zenflux/react-ui/src/accordion/ui-theme-accordion");
var accordion_item_1 = require("@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item");
require("@zenflux/app-budget-allocation/src/ui-command-able/accordion/_accordion.scss");
/**
 * The main difference between UIThemeAccordion and Accordion is that Accordion is command-able (having commands).
 */
var Accordion = function (props) {
    var children = Array.isArray(props.children) ? props.children : [props.children];
    // If `ReactFragment` is used as children, then pop it out.
    if (children.length === 1 && children[0].type === react_1.default.Fragment) {
        children = children[0].props.children;
    }
    var commands = (0, use_commands_1.useCommanderComponent)("UI/Accordion");
    var _a = react_1.default.useState({}), selected = _a[0], setSelected = _a[1];
    if (props.selected) {
        selected = props.selected;
    }
    if (props.setSelected) {
        setSelected = props.setSelected;
    }
    var _b = react_1.default.useState({}), previousSelected = _b[0], setPreviousSelected = _b[1];
    var _c = react_1.default.useState(false), isLoaded = _c[0], setIsLoaded = _c[1];
    var accordionUIProps = {
        setSelected: setSelected,
        selected: selected,
        onClick: function (event, key, state, signal) {
            // Disable multiple selections, by default accordion allows multiple selections.
            var _a;
            // If current selected is not the new selected, dissect the old and select the new.
            if (Object.keys(selected).length > 0) {
                if (!Object.keys(selected).find(function (i) { return i == key; })) {
                    signal === null || signal === void 0 ? void 0 : signal.abort();
                    // Dissect all
                    setSelected((_a = {}, _a[key] = true, _a));
                }
            }
        },
        onSelectionChanged: function () {
            if (false === isLoaded) {
                setIsLoaded(true);
            }
            else if (JSON.stringify(previousSelected) !== JSON.stringify(selected)) {
                // Find who detached
                var detached = Object.keys(previousSelected).find(function (key) { return !selected[key]; });
                // Find who attached
                var attached = Object.keys(selected).find(function (key) { return !previousSelected[key]; });
                // Run the commands so later someone can hook them.
                if (detached) {
                    commands.run("UI/Accordion/onSelectionDetached", { key: detached });
                }
                if (attached) {
                    commands.run("UI/Accordion/onSelectionAttached", { key: attached });
                }
            }
            setPreviousSelected(selected);
        }
    };
    return (<div className={"loader ".concat(isLoaded ? "loaded" : "")}>
            <ui_theme_accordion_1.UIThemeAccordion {...accordionUIProps}>
                {children.map(function (child, index) {
            return <accordion_item_1.default {...child.props} key={index}>
                        {child.props.children}
                    </accordion_item_1.default>;
        })}
            </ui_theme_accordion_1.UIThemeAccordion>
        </div>);
};
var $$ = (0, with_commands_1.withCommands)("UI/Accordion", Accordion, [
    /** @class */ (function (_super) {
        __extends(onSelectionAttached, _super);
        function onSelectionAttached() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        onSelectionAttached.getName = function () {
            return "UI/Accordion/onSelectionAttached";
        };
        return onSelectionAttached;
    }(command_base_1.CommandBase)),
    /** @class */ (function (_super) {
        __extends(onSelectionDetached, _super);
        function onSelectionDetached() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        onSelectionDetached.getName = function () {
            return "UI/Accordion/onSelectionDetached";
        };
        return onSelectionDetached;
    }(command_base_1.CommandBase)),
]);
exports.default = $$;
