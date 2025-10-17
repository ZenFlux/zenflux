import React from "react";

export function useBreaksTableScroller( durationMs = 500 ) {
    const [ direction, setDirection ] = React.useState<"right" | "left">( "right" );

    const ref = React.useRef<HTMLDivElement>( null );

    function smoothScroll( element: { scrollLeft: number; scrollWidth: number; clientWidth: number; }, target: number, duration: number ) {
        let start = element.scrollLeft,
            change = target - start,
            startTime = performance.now(),
            val: number;

        function animateScroll( currentTime: number ) {
            let elapsed = currentTime - startTime;
            val = Math.easeInOutQuad( elapsed, start, change, duration );

            element.scrollLeft = val;

            if ( elapsed < duration ) {
                window.requestAnimationFrame( animateScroll );
            }
        }

        Math.easeInOutQuad = function ( t: number, b: number, c: number, d: number ) {
            t /= d / 2;
            if ( t < 1 ) return c / 2 * t * t + b;
            t--;
            return -c / 2 * ( t * ( t - 2 ) - 1 ) + b;
        };

        window.requestAnimationFrame( animateScroll );
    }

    const onArrowClick = React.useCallback( () => {
        const table = ref.current;

        if ( table ) {
            if ( direction === "right" ) {
                smoothScroll( table, table.scrollWidth - table.clientWidth, durationMs );
            } else {
                smoothScroll( table, 0, durationMs );
            }
        }

        setDirection( direction === "right" ? "left" : "right" );
    }, [ direction, durationMs ] );

    return { ref, direction, onArrowClick } as const;
}





