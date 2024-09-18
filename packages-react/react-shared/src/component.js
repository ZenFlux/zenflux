"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
/* Handles static members */
var Component;
(function (Component) {
    // tslint won't let me format the sample code in a way that vscode likes it :(
    /**
     * If set, `this.context` will be set at runtime to the current value of the given Context.
     *
     * Usage:
     *
     * ```ts
     * type MyContext = number
     * const Ctx = React.createContext<MyContext>(0)
     *
     * class Foo extends React.Component {
     *   static contextType = Ctx
     *   context!: React.ContextType<typeof Ctx>
     *   render () {
     *     return <>My context's value: {this.context}</>;
     *   }
     * }
     * ```
     *
     * @see https://react.dev/reference/react/Component#static-contexttype
     */
    Component.contextType = undefined;
})(Component || (exports.Component = Component = {}));
