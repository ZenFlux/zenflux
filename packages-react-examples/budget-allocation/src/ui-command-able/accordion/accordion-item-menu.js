"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccordionItemMenu = void 0;
var react_1 = require("react");
var dropdown_1 = require("@nextui-org/dropdown");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
require("@zenflux/app-budget-allocation/src/ui-command-able/accordion/_accordion-item-menu.scss");
var AccordionDropdownTrigger = function (_a) {
    var onPointerUp = _a.onPointerUp, onMouseEnter = _a.onMouseEnter, onMouseLeave = _a.onMouseLeave;
    return (<dropdown_1.DropdownTrigger onPointerUp={onPointerUp} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <span>
                <symbols_1.ThreeDots className="menu-trigger"/>
            </span>
        </dropdown_1.DropdownTrigger>);
};
var AccordionDropdownMenu = function (_a) {
    var onMouseEnter = _a.onMouseEnter, onMouseLeave = _a.onMouseLeave, onAction = _a.onAction, menuItems = _a.menuItems;
    return (<dropdown_1.DropdownMenu onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onAction={onAction} aria-label={"accordion-item-menu"}>
                {Object.entries(menuItems).map(function (_a) {
            var key = _a[0], _b = _a[1], label = _b.label, color = _b.color;
            return (<dropdown_1.DropdownItem key={key} color={color !== null && color !== void 0 ? color : "default"} className={color ? "text-${color}" : ""} ria-label={"accordion-item-menu-dropdown"} onPointerUp={onMouseLeave}>
                            {label}
                        </dropdown_1.DropdownItem>);
        })}
            </dropdown_1.DropdownMenu>);
};
/**
 * Using this trick to create nice dropdown menu with real popover, actually
 * this can be a general ui, not accordion related, im not sure if it works - there is no reason to do it now.
 */
function AccordionItemMenu(args) {
    var menuItems = args.menuItems, onAction = args.onAction;
    var _a = react_1.default.useState(false), isOpen = _a[0], setIsOpen = _a[1];
    var timer;
    react_1.default.useEffect(function () {
        return function () {
            clearTimeout(timer);
        };
    }, []);
    var handleMouseLeave = function () {
        timer = setTimeout(function () { return setIsOpen(false); }, 200);
    };
    var handleMouseEnter = function (force) {
        clearTimeout(timer);
        if (force) {
            return setIsOpen(true);
        }
        setTimeout(function () { return setIsOpen(true); }, 100);
    };
    var handlePointerUp = function (e) {
        e.stopPropagation();
        clearTimeout(timer);
        // Re pop.
        setIsOpen(false);
        handleMouseEnter();
    };
    return (<dropdown_1.Dropdown isOpen={isOpen}>
                <AccordionDropdownTrigger onPointerUp={handlePointerUp} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}/>
                <AccordionDropdownMenu onMouseEnter={function () { return handleMouseEnter(true); }} onMouseLeave={function () { return setIsOpen(false); }} onAction={onAction} menuItems={menuItems}/>
            </dropdown_1.Dropdown>);
}
exports.AccordionItemMenu = AccordionItemMenu;
