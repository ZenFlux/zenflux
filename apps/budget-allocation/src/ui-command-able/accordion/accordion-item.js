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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var with_commands_1 = require("@zenflux/react-commander/with-commands");
var command_base_1 = require("@zenflux/react-commander/command-base");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var ui_theme_accordion_1 = require("@zenflux/react-ui/src/accordion/ui-theme-accordion");
var accordion_item_menu_1 = require("@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item-menu");
var AccordionItemEditableTitle = react_1.default.forwardRef(function (props, refForParent) {
    var _a;
    var _b = react_1.default.useState(false), isEditing = _b[0], setIsEditing = _b[1], _c = react_1.default.useState(false), isFocusCaptured = _c[0], setIsFocusCaptured = _c[1];
    var editableCommand = (0, use_commands_1.useCommanderCommand)("UI/AccordionItem/EditableTitle"), onTitleChangedCommand = (0, use_commands_1.useCommanderCommand)("UI/AccordionItem/OnTitleChanged");
    var isCollapsed = react_1.default.useMemo(function () {
        return props.collapsedState === "detached";
    }, [props.collapsedState]);
    var runOnTitleChangedCommand = function (newTitle) {
        onTitleChangedCommand.run({ title: newTitle, itemKey: props.itemKey });
    };
    var ref = react_1.default.useRef(null);
    // If selection detached from the element, stop editing
    react_1.default.useEffect(function () {
        if (!isEditing || !ref.current || !isCollapsed) {
            return;
        }
        ref.current.contentEditable = "false";
    }, [isCollapsed]);
    // On accordion enable editing, set editing mode is on
    react_1.default.useEffect(function () {
        editableCommand.hook(function (result, args) {
            setIsEditing(args.state);
            setTimeout(function () {
                if (ref.current) {
                    ref.current.focus();
                    // Without this, the cursor will be at the start of the text
                    var sel = window.getSelection();
                    if (!sel) {
                        return;
                    }
                    sel.selectAllChildren(ref.current);
                    sel.collapseToEnd();
                }
            }, 1000);
        });
        return function () {
            editableCommand.unhook();
        };
    }, [setIsEditing]);
    // On enter, stop editing
    function onKeyPress(e) {
        if (!isEditing) {
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(false);
            runOnTitleChangedCommand(e.currentTarget.innerText);
        }
    }
    // Start editing on click
    function onClick(e) {
        if (!isEditing) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.focus();
    }
    // On focus capture, set flag to await for release/blur.
    function onFocusCapture() {
        if (!isEditing) {
            return;
        }
        setIsFocusCaptured(true);
    }
    // If focus was captured, and blur happened, stop editing
    function onBlur(e) {
        if (!isEditing) {
            return;
        }
        if (isFocusCaptured) {
            setIsFocusCaptured(false);
            setIsEditing(false);
            runOnTitleChangedCommand(e.currentTarget.innerText);
        }
    }
    refForParent.current = ref.current;
    return <span className="accordion-item-title" ref={ref} contentEditable={isEditing} suppressContentEditableWarning={true} onKeyPress={onKeyPress} onClick={onClick} onFocusCapture={onFocusCapture} onBlur={onBlur}>
        {(_a = props.heading) === null || _a === void 0 ? void 0 : _a.title}
    </span>;
});
var AccordionItem = function (props) {
    var itemKey = props.itemKey, _a = props.heading, heading = _a === void 0 ? {} : _a, _b = props.menu, menu = _b === void 0 ? {} : _b;
    var onAction = function (key) {
        var _a;
        var action = (_a = menu[key.toString()]) === null || _a === void 0 ? void 0 : _a.action;
        if (action) {
            action();
        }
    };
    var ref = react_1.default.useRef(null), onceRef = react_1.default.useRef(false);
    react_1.default.useEffect(function () {
        if (!ref.current || onceRef.current) {
            return;
        }
        onceRef.current = true;
        if (props.onRender) {
            setTimeout(props.onRender, 800);
        }
    }, [ref.current]);
    var propsInternal = __assign(__assign({}, props), { heading: __assign(__assign({}, heading), { title: <AccordionItemEditableTitle {...props} ref={ref}/>, extra: <span className={"accordion-item-menu"}>
                    <accordion_item_menu_1.AccordionItemMenu menuItems={menu} onAction={onAction}/>
                </span> }) });
    return <ui_theme_accordion_1.UIThemeAccordionItem {...propsInternal} key={itemKey}>
        {props.children}
    </ui_theme_accordion_1.UIThemeAccordionItem>;
};
var $$ = (0, with_commands_1.withCommands)("UI/AccordionItem", AccordionItem, [
    /** @class */ (function (_super) {
        __extends(Editable, _super);
        function Editable() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Editable.getName = function () {
            return "UI/AccordionItem/EditableTitle";
        };
        return Editable;
    }(command_base_1.CommandBase)),
    /** @class */ (function (_super) {
        __extends(OnTitleChanged, _super);
        function OnTitleChanged() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        OnTitleChanged.getName = function () {
            return "UI/AccordionItem/OnTitleChanged";
        };
        return OnTitleChanged;
    }(command_base_1.CommandBase))
]);
exports.default = $$;
