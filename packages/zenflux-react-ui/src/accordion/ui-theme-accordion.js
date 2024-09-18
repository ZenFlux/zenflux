"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIThemeAccordion = exports.UIThemeAccordionItem = void 0;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
require("@zenflux/react-ui/src/accordion/_ui-theme-accordion.scss");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
var ui_theme_accordion_handle_selection_1 = require("@zenflux/react-ui/src/accordion/ui-theme-accordion-handle-selection");
/**
 * Function UIThemeAccordionHeading()
 */
var UIThemeAccordionHeading = function (props) {
    var children = props.children, _a = props.heading, icon = _a.icon, iconAlt = _a.iconAlt;
    var Icon = function () { return (icon &&
        <span className="accordion-icon">
            <img className="icon" src={icon} alt={iconAlt}/>
        </span>); };
    /* Avoid flickering on re-render */
    var MemorizedHeading = react_1.default.useMemo(function () { return (<>
            <span className="accordion-indicator">
                {<symbols_1.ArrowDown />}
            </span>

            {Icon()}

            <div className="accordion-title">
                {children}
            </div>
        </>); }, [children, icon, iconAlt]);
    return (<>{MemorizedHeading}</>);
};
/**
 * Function UIThemeAccordionItemCollapse() : The AccordionItemCollapse component follows a common pattern for accordion components
 * in React: maintaining a state determines the collapsed/expanded status of the accordion item.
 * The component uses the useState and useEffect React hooks to handle state and side effects respectively.
 *
 * The component uses the framer-motion library to animate the accordion's opening and closing.
 * With AnimatePresence from framer-motion, elements can be animated in and out of the React component tree.
 */
var UIThemeAccordionItemCollapse = function (props) {
    var children = props.children, height = props.height, collapsedState = props.collapsedState, collapsedStateRef = props.collapsedStateRef, setCollapsedState = props.setCollapsedState, setIsTransitioning = props.setIsTransitioning;
    var _a = react_1.default.useState(null), shouldRenderCollapse = _a[0], setShouldRenderCollapse = _a[1];
    var memoCollapsedStateChanged = react_1.default.useMemo(function () {
        return collapsedState;
    }, [collapsedState]);
    react_1.default.useEffect(function () {
        switch (collapsedState) {
            case "initial":
                setShouldRenderCollapse(true);
                setCollapsedState("re-render");
                break;
            case "re-render":
                setShouldRenderCollapse(false);
                setCollapsedState("detached");
                break;
            case "attached":
                setShouldRenderCollapse(true);
                break;
            default:
                setShouldRenderCollapse(false);
        }
    }, [collapsedState]);
    var Component = function () {
        var renderCollapse = function () {
            // Initial render rendering collapse for getting the height
            var isInitialRender = memoCollapsedStateChanged === "initial" && shouldRenderCollapse === null;
            if (!isInitialRender && !shouldRenderCollapse) {
                return null;
            }
            return (<framer_motion_1.motion.div className="accordion-collapse" initial={{ maxHeight: 0 }} animate={{ maxHeight: height, display: "block" }} exit={{ maxHeight: 0 }} transition={{ duration: 0.3 }} onAnimationStart={function () { return setIsTransitioning(true); }} onAnimationComplete={function () { return setIsTransitioning(false); }}>
                    <div className="accordion-content" ref={collapsedStateRef}>
                        {children}
                    </div>
                </framer_motion_1.motion.div>);
        };
        return (<framer_motion_1.AnimatePresence>
                {renderCollapse()}
            </framer_motion_1.AnimatePresence>);
    };
    return Component();
};
var UIThemeAccordionItemContent = function (props) {
    var children = props.children, collapsedState = props.collapsedState, setCollapsedState = props.setCollapsedState;
    var _a = react_1.default.useState(0), height = _a[0], setHeight = _a[1];
    var collapsedStateRef = react_1.default.useRef(null);
    react_1.default.useEffect(function () {
        if (collapsedStateRef.current && collapsedState === "initial") {
            var contentHeight = collapsedStateRef.current.clientHeight;
            if (contentHeight > 0) {
                // Set the height for the animation
                setHeight(contentHeight);
                // Hide the content
                collapsedStateRef.current.style.height = "0px";
                collapsedStateRef.current.style.display = "none";
            }
        }
    }, []);
    var args = {
        height: height,
        collapsedState: collapsedState,
        collapsedStateRef: collapsedStateRef,
        setCollapsedState: setCollapsedState,
        setIsTransitioning: props.setIsTransitioning,
    };
    return (<UIThemeAccordionItemCollapse {...args}>
        {children}
    </UIThemeAccordionItemCollapse>);
};
var UIThemeAccordionItem = function (props) {
    var children = props.children, propsWithoutChildren = __rest(props, ["children"]);
    return (<>
            <h2 className="accordion-heading">
                <button className="accordion-button" onClick={function () {
            var _a;
            return (_a = props.onClick) === null || _a === void 0 ? void 0 : _a.call(props, event, props.itemKey.toString(), props.collapsedState);
        }}>
                    <UIThemeAccordionHeading {...propsWithoutChildren}>
                        {props.heading.title}
                    </UIThemeAccordionHeading>
                </button>
                {props.heading.extra || null}
            </h2>

            <div className="accardion-content-container">
                <UIThemeAccordionItemContent {...propsWithoutChildren}>
                    {children}
                </UIThemeAccordionItemContent>
            </div>
        </>);
};
exports.UIThemeAccordionItem = UIThemeAccordionItem;
var NormalizeAccordionItem = function (props) {
    var item = props.item, selected = props.selected, setSelected = props.setSelected, sharedProps = props.sharedProps, isTransitioning = props.isTransitioning, setIsTransitioning = props.setIsTransitioning;
    var ref = react_1.default.createRef();
    var _a = react_1.default.useState("initial"), collapsedState = _a[0], setCollapsedState = _a[1];
    collapsedState = item.props.collapsedState || collapsedState;
    setCollapsedState = item.props.setCollapsedState || setCollapsedState;
    var itemProps = __assign(__assign({}, item.props), { collapsedState: collapsedState, setCollapsedState: setCollapsedState, setIsTransitioning: setIsTransitioning, key: item.props.itemKey });
    itemProps.onClick = function (e) { return (0, ui_theme_accordion_handle_selection_1.accordionHandleSelection)(e, ref, {
        key: itemProps.itemKey.toString(),
        collapsedState: collapsedState,
        setCollapsedState: setCollapsedState,
        selected: selected,
        setSelected: setSelected,
        // Passing `api` onClick handler, `accordionHandleSelection` will handle the call to it.
        onClick: props.onClick,
        isTransitioning: isTransitioning
    }); };
    sharedProps[itemProps.itemKey.toString()] = itemProps;
    return (<div className="group accordion-item" data-collapsed={"initial"} ref={ref}>
            {<item.type {...itemProps}/>}
        </div>);
};
exports.UIThemeAccordion = react_1.default.memo(function (props) {
    var children = props.children;
    var _a = react_1.default.useState({}), selectedInternal = _a[0], setSelectedInternal = _a[1];
    var selected = props.selected || selectedInternal, setSelected = props.setSelected || setSelectedInternal;
    var _b = react_1.default.useState({}), prevSelected = _b[0], setPrevSelected = _b[1];
    var _c = react_1.default.useState(false), isTransitioning = _c[0], setIsTransitioning = _c[1];
    var sharedProps = react_1.default.useMemo(function () { return ({}); }, []);
    // Remove deleted sharedProps
    Object.keys(sharedProps).forEach(function (key) {
        if (!children.find(function (item) { return item.props.itemKey.toString() === key; })) {
            delete sharedProps[key];
        }
    });
    (0, ui_theme_accordion_handle_selection_1.accordionHandleExternalSelection)({
        selected: selected,
        setSelected: setSelected,
        prevSelected: prevSelected,
        setPrevSelected: setPrevSelected,
        onSelectionChanged: props.onSelectionChanged,
        sharedProps: sharedProps,
    });
    return (<div className="accordion">
            {children.map(function (item) {
            return <NormalizeAccordionItem key={item.props.itemKey} item={item} selected={selected} setSelected={setSelected} sharedProps={sharedProps} isTransitioning={isTransitioning} setIsTransitioning={setIsTransitioning} onClick={props.onClick}/>;
        })}
        </div>);
});
