import { clientRenderBoundary } from "@zenflux/react-dom-bindings/src/server/ReactDOMFizzInstructionSetInlineSource";
// This is a string so Closure's advanced compilation mode doesn't mangle it.
// eslint-disable-next-line dot-notation
window[ "$RX" ] = clientRenderBoundary;
