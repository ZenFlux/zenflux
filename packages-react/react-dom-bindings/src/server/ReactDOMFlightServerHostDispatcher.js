// import { enableFloat } from "@zenflux/react-shared/src/react-feature-flags";
// import { emitHint, getHints, resolveRequest } from "react-server/src/ReactFlightServer";
//
// import type {
//     CrossOriginEnum,
//     HostDispatcher,
//     PreinitModuleScriptOptions,
//     PreinitScriptOptions,
//     PreinitStyleOptions,
//     PreloadImplOptions,
//     PreloadModuleImplOptions
// } from "@zenflux/react-dom/src/shared/ReactDOMTypes";
//
// export const ReactDOMFlightServerDispatcher: HostDispatcher = {
//     prefetchDNS,
//     preconnect,
//     preload,
//     preloadModule,
//     preinitStyle,
//     preinitScript,
//     preinitModuleScript
// };
//
// function prefetchDNS( href: string ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" && href ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 const key = "D|" + href;
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//                 emitHint( request, "D", href );
//             }
//         }
//     }
// }
//
// function preconnect( href: string, crossOrigin?: CrossOriginEnum | null | undefined ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 const key = `C|${ crossOrigin == null ? "null" : crossOrigin }|${ href }`;
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//
//                 if ( typeof crossOrigin === "string" ) {
//                     emitHint( request, "C", [ href, crossOrigin ] );
//                 } else {
//                     emitHint( request, "C", href );
//                 }
//             }
//         }
//     }
// }
//
// function preload( href: string, as: string, options?: PreloadImplOptions | null | undefined ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 let key = "L";
//
//                 if ( as === "image" && options ) {
//                     key += getImagePreloadKey( href, options.imageSrcSet, options.imageSizes );
//                 } else {
//                     key += `[${ as }]${ href }`;
//                 }
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//                 const trimmed = trimOptions( options );
//
//                 if ( trimmed ) {
//                     emitHint( request, "L", [ href, as, trimmed ] );
//                 } else {
//                     emitHint( request, "L", [ href, as ] );
//                 }
//             }
//         }
//     }
// }
//
// function preloadModule( href: string, options?: PreloadModuleImplOptions | null | undefined ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 const key = "m|" + href;
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//                 const trimmed = trimOptions( options );
//
//                 if ( trimmed ) {
//                     return emitHint( request, "m", [ href, trimmed ] );
//                 } else {
//                     return emitHint( request, "m", href );
//                 }
//             }
//         }
//     }
// }
//
// function preinitStyle( href: string, precedence: string | null | undefined, options?: PreinitStyleOptions | null | undefined ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 const key = "S|" + href;
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//                 const trimmed = trimOptions( options );
//
//                 if ( trimmed ) {
//                     return emitHint( request, "S", [ href, typeof precedence === "string" ? precedence : 0, trimmed ] );
//                 } else if ( typeof precedence === "string" ) {
//                     return emitHint( request, "S", [ href, precedence ] );
//                 } else {
//                     return emitHint( request, "S", href );
//                 }
//             }
//         }
//     }
// }
//
// function preinitScript( href: string, options?: PreinitScriptOptions | null | undefined ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 const key = "X|" + href;
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//                 const trimmed = trimOptions( options );
//
//                 if ( trimmed ) {
//                     return emitHint( request, "X", [ href, trimmed ] );
//                 } else {
//                     return emitHint( request, "X", href );
//                 }
//             }
//         }
//     }
// }
//
// function preinitModuleScript( href: string, options?: PreinitModuleScriptOptions | null | undefined ) {
//     if ( enableFloat ) {
//         if ( typeof href === "string" ) {
//             const request = resolveRequest();
//
//             if ( request ) {
//                 const hints = getHints( request );
//                 const key = "M|" + href;
//
//                 if ( hints.has( key ) ) {
//                     // duplicate hint
//                     return;
//                 }
//
//                 hints.add( key );
//                 const trimmed = trimOptions( options );
//
//                 if ( trimmed ) {
//                     return emitHint( request, "M", [ href, trimmed ] );
//                 } else {
//                     return emitHint( request, "M", href );
//                 }
//             }
//         }
//     }
// }
//
// // Flight normally encodes undefined as a special character however for directive option
// // arguments we don't want to send unnecessary keys and bloat the payload so we create a
// // trimmed object which omits any keys with null or undefined values.
// // This is only typesafe because these option objects have entirely optional fields where
// // null and undefined represent the same thing as no property.
// function trimOptions<T extends PreloadImplOptions | PreloadModuleImplOptions | PreinitStyleOptions | PreinitScriptOptions | PreinitModuleScriptOptions>( options: T | null | undefined ): T | null | undefined {
//     if ( options == null ) return null;
//     let hasProperties = false;
//     const trimmed: T = ( {} as any );
//
//     for ( const key in options ) {
//         if ( options[ key ] != null ) {
//             hasProperties = true;
//             ( trimmed as any )[ key ] = options[ key ];
//         }
//     }
//
//     return hasProperties ? trimmed : null;
// }
//
// function getImagePreloadKey( href: string, imageSrcSet: string | null | undefined, imageSizes: string | null | undefined ) {
//     let uniquePart = "";
//
//     if ( typeof imageSrcSet === "string" && imageSrcSet !== "" ) {
//         uniquePart += "[" + imageSrcSet + "]";
//
//         if ( typeof imageSizes === "string" ) {
//             uniquePart += "[" + imageSizes + "]";
//         }
//     } else {
//         uniquePart += "[][]" + href;
//     }
//
//     return `[image]${ uniquePart }`;
// }
