import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import {
    enableAsyncActions,
    enableFormActions,
    enableHostSingletons
} from "@zenflux/react-shared/src/react-feature-flags";

import { precacheFiberNode, updateFiberProps } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import {
    checkForUnmatchedText,
    diffHydratedProperties,
    diffHydratedText,
    warnForDeletedHydratableElement,
    warnForDeletedHydratableText,
    warnForInsertedHydratedElement,
    warnForInsertedHydratedText
} from "@zenflux/react-dom-bindings/src/client/ReactDOMComponent";

import { COMMENT_NODE, ELEMENT_NODE, TEXT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";

import {
    FORM_STATE_IS_MATCHING, FORM_STATE_IS_NOT_MATCHING, SUSPENSE_END_DATA,
    SUSPENSE_FALLBACK_START_DATA,
    SUSPENSE_PENDING_START_DATA,
    SUSPENSE_START_DATA
} from "@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags";

import { retryIfBlockedOn } from "@zenflux/react-dom-bindings/src/events/ReactDOMEventReplaying";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";
import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

import type { Container, HostContext, HydratableInstance, Instance, Props, TextInstance } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

const SUPPRESS_HYDRATION_WARNING = "suppressHydrationWarning";

type FormStateMarkerInstance = Comment;

function getNextHydratable( node: Node | null | undefined ) {
    // Skip non-hydratable nodes.
    for ( ; node != null ; node = ( ( node as any ) as Node ).nextSibling ) {
        const nodeType = node.nodeType;

        if ( nodeType === ELEMENT_NODE || nodeType === TEXT_NODE ) {
            break;
        }

        if ( nodeType === COMMENT_NODE ) {
            const nodeData = ( node as any ).data;

            if ( nodeData === SUSPENSE_START_DATA || nodeData === SUSPENSE_FALLBACK_START_DATA || nodeData === SUSPENSE_PENDING_START_DATA || enableFormActions && enableAsyncActions && ( nodeData === FORM_STATE_IS_MATCHING || nodeData === FORM_STATE_IS_NOT_MATCHING ) ) {
                break;
            }

            if ( nodeData === SUSPENSE_END_DATA ) {
                return null;
            }
        }
    }

    return ( node as any );
}

export function getNextHydratableSibling( instance: HydratableInstance ): null | HydratableInstance {
    return getNextHydratable( instance.nextSibling );
}

export function getFirstHydratableChild( parentInstance: Instance ): null | HydratableInstance {
    return getNextHydratable( parentInstance.firstChild );
}

export function getFirstHydratableChildWithinContainer( parentContainer: Container ): null | HydratableInstance {
    return getNextHydratable( parentContainer.firstChild );
}

export function getFirstHydratableChildWithinSuspenseInstance( parentInstance: SuspenseInstance ): null | HydratableInstance {
    return getNextHydratable( parentInstance.nextSibling );
}

export function hydrateInstance( instance: Instance, type: string, props: Props, hostContext: HostContext, internalInstanceHandle: Fiber /* Object */, shouldWarnDev: boolean ): void {
    precacheFiberNode( internalInstanceHandle, instance );
    // TODO: Possibly defer this until the commit phase where all the events
    // get attached.
    updateFiberProps( instance, props );
    // TODO: Temporary hack to check if we're in a concurrent root. We can delete
    // when the legacy root API is removed.
    const isConcurrentMode = ( ( internalInstanceHandle as Fiber ).mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
    diffHydratedProperties( instance, type, props, isConcurrentMode, shouldWarnDev, hostContext );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hydrateTextInstance( textInstance: TextInstance, text: string, internalInstanceHandle: Fiber /* Object */, shouldWarnDev: boolean ): boolean {
    precacheFiberNode( internalInstanceHandle, textInstance );
    // TODO: Temporary hack to check if we're in a concurrent root. We can delete
    // when the legacy root API is removed.
    const isConcurrentMode = ( ( internalInstanceHandle as Fiber ).mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
    return diffHydratedText( textInstance, text, isConcurrentMode );
}

export function hydrateSuspenseInstance( suspenseInstance: SuspenseInstance, internalInstanceHandle: Fiber /* Object */ ) {
    precacheFiberNode( internalInstanceHandle, suspenseInstance );
}

export function commitHydratedContainer( container: Container ): void {
    // Retry if any event replaying was blocked on this.
    retryIfBlockedOn( container );
}

export function commitHydratedSuspenseInstance( suspenseInstance: SuspenseInstance ): void {
    // Retry if any event replaying was blocked on this.
    retryIfBlockedOn( suspenseInstance );
}

export function shouldDeleteUnhydratedTailInstances( parentType: string ): boolean {
    return ( enableHostSingletons || parentType !== "head" && parentType !== "body" ) && ( ! enableFormActions || parentType !== "form" && parentType !== "button" );
}

export function didNotMatchHydratedContainerTextInstance( parentContainer: Container, textInstance: TextInstance, text: string, isConcurrentMode: boolean, shouldWarnDev: boolean ) {
    checkForUnmatchedText( textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev );
}

export function didNotMatchHydratedTextInstance( parentType: string, parentProps: Props, parentInstance: Instance, textInstance: TextInstance, text: string, isConcurrentMode: boolean, shouldWarnDev: boolean ) {
    if ( parentProps[ SUPPRESS_HYDRATION_WARNING ] !== true ) {
        checkForUnmatchedText( textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev );
    }
}

export function didNotHydrateInstanceWithinContainer( parentContainer: Container, instance: HydratableInstance ) {
    if ( __DEV__ ) {
        if ( instance.nodeType === ELEMENT_NODE ) {
            warnForDeletedHydratableElement( parentContainer, ( instance as any ) );
        } else if ( instance.nodeType === COMMENT_NODE ) {// TODO: warnForDeletedHydratableSuspenseBoundary
        } else {
            warnForDeletedHydratableText( parentContainer, ( instance as any ) );
        }
    }
}

export function didNotHydrateInstanceWithinSuspenseInstance( parentInstance: SuspenseInstance, instance: HydratableInstance ) {
    if ( __DEV__ ) {
        // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
        const parentNode: Element | Document | null = parentInstance.parentNode as any;

        if ( parentNode !== null ) {
            if ( instance.nodeType === ELEMENT_NODE ) {
                warnForDeletedHydratableElement( parentNode, ( instance as any ) );
            } else if ( instance.nodeType === COMMENT_NODE ) {// TODO: warnForDeletedHydratableSuspenseBoundary
            } else {
                warnForDeletedHydratableText( parentNode, ( instance as any ) );
            }
        }
    }
}

export function didNotHydrateInstance( parentType: string, parentProps: Props, parentInstance: Instance, instance: HydratableInstance, isConcurrentMode: boolean ) {
    if ( __DEV__ ) {
        if ( isConcurrentMode || parentProps[ SUPPRESS_HYDRATION_WARNING ] !== true ) {
            if ( instance.nodeType === ELEMENT_NODE ) {
                warnForDeletedHydratableElement( parentInstance, ( instance as any ) );
            } else if ( instance.nodeType === COMMENT_NODE ) {// TODO: warnForDeletedHydratableSuspenseBoundary
            } else {
                warnForDeletedHydratableText( parentInstance, ( instance as any ) );
            }
        }
    }
}

export function didNotFindHydratableInstanceWithinContainer( parentContainer: Container, type: string, props: Props ) {
    if ( __DEV__ ) {
        warnForInsertedHydratedElement( parentContainer, type, props );
    }
}

export function didNotFindHydratableTextInstanceWithinContainer( parentContainer: Container, text: string ) {
    if ( __DEV__ ) {
        warnForInsertedHydratedText( parentContainer, text );
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function didNotFindHydratableSuspenseInstanceWithinContainer( parentContainer: Container ) {
    if ( __DEV__ ) {// TODO: warnForInsertedHydratedSuspense(parentContainer);
    }
}

export function didNotFindHydratableInstanceWithinSuspenseInstance( parentInstance: SuspenseInstance, type: string, props: Props ) {
    if ( __DEV__ ) {
        // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
        const parentNode: Element | Document | null = parentInstance.parentNode as any as any;
        if ( parentNode !== null ) warnForInsertedHydratedElement( parentNode, type, props );
    }
}

export function didNotFindHydratableTextInstanceWithinSuspenseInstance( parentInstance: SuspenseInstance, text: string ) {
    if ( __DEV__ ) {
        // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
        const parentNode: Element | Document | null = parentInstance.parentNode as any as any;
        if ( parentNode !== null ) warnForInsertedHydratedText( parentNode, text );
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance( parentInstance: SuspenseInstance ) {
    if ( __DEV__ ) {// const parentNode: Element | Document | null = parentInstance.parentNode as any;
        // TODO: warnForInsertedHydratedSuspense(parentNode);
    }
}

export function didNotFindHydratableInstance( parentType: string, parentProps: Props, parentInstance: Instance, type: string, props: Props, isConcurrentMode: boolean ) {
    if ( __DEV__ ) {
        if ( isConcurrentMode || parentProps[ SUPPRESS_HYDRATION_WARNING ] !== true ) {
            warnForInsertedHydratedElement( parentInstance, type, props );
        }
    }
}

export function didNotFindHydratableTextInstance( parentType: string, parentProps: Props, parentInstance: Instance, text: string, isConcurrentMode: boolean ) {
    if ( __DEV__ ) {
        if ( isConcurrentMode || parentProps[ SUPPRESS_HYDRATION_WARNING ] !== true ) {
            warnForInsertedHydratedText( parentInstance, text );
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function didNotFindHydratableSuspenseInstance( parentType: string, parentProps: Props, parentInstance: Instance ) {
    if ( __DEV__ ) {// TODO: warnForInsertedHydratedSuspense(parentInstance);
    }
}

export function errorHydratingContainer( parentContainer: Container ): void {
    if ( __DEV__ ) {
        // TODO: This gets logged by onRecoverableError, too, so we should be
        // able to remove it.
        console.error( "An error occurred during hydration. The server HTML was replaced with client content in <%s>.", parentContainer.nodeName.toLowerCase() );
    }
}

export function canHydrateTextInstance( instance: HydratableInstance, text: string, inRootOrSingleton: boolean ): null | TextInstance {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    if ( text === "" ) return null;

    while ( instance.nodeType !== TEXT_NODE ) {
        if ( enableFormActions && instance.nodeType === ELEMENT_NODE && instance.nodeName === "INPUT" && ( instance as any ).type === "hidden" ) {// If we have extra hidden inputs, we don't mismatch. This allows us to
            // embed extra form data in the original form.
        } else if ( ! inRootOrSingleton || ! enableHostSingletons ) {
            return null;
        }

        const nextInstance = getNextHydratableSibling( instance );

        if ( nextInstance === null ) {
            return null;
        }

        instance = nextInstance;
    }

    // This has now been refined to a text node.
    return ( ( instance as any ) as TextInstance );
}

export function canHydrateSuspenseInstance( instance: HydratableInstance, inRootOrSingleton: boolean ): null | SuspenseInstance {
    while ( instance.nodeType !== COMMENT_NODE ) {
        if ( ! inRootOrSingleton || ! enableHostSingletons ) {
            return null;
        }

        const nextInstance = getNextHydratableSibling( instance );

        if ( nextInstance === null ) {
            return null;
        }

        instance = nextInstance;
    }

    // This has now been refined to a suspense node.
    return ( ( instance as any ) as SuspenseInstance );
}

export function canHydrateFormStateMarker( instance: HydratableInstance, inRootOrSingleton: boolean ): null | FormStateMarkerInstance {
    while ( instance.nodeType !== COMMENT_NODE ) {
        if ( ! inRootOrSingleton || ! enableHostSingletons ) {
            return null;
        }

        const nextInstance = getNextHydratableSibling( instance );

        if ( nextInstance === null ) {
            return null;
        }

        instance = nextInstance;
    }

    const nodeData = ( instance as any ).data;

    if ( nodeData === FORM_STATE_IS_MATCHING || nodeData === FORM_STATE_IS_NOT_MATCHING ) {
        const markerInstance: FormStateMarkerInstance = ( instance as any );
        return markerInstance;
    }

    return null;
}
