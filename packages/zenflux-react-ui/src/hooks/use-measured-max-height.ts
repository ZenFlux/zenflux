import React from "react";

export function useMeasuredMaxHeight(
    ref: React.RefObject<HTMLDivElement>,
): number {
    const [ height, setHeight ] = React.useState( 0 );

    React.useEffect( () => {
        if ( ! ref.current ) {
            return;
        }

        const el = ref.current;

        const update = () => {
            const next = el.scrollHeight;
            if ( next > 0 ) {
                setHeight( next );
            }
        };

        update();
        setTimeout( update, 0 );
        setTimeout( update, 200 );

        const ro = new ResizeObserver( update );
        ro.observe( el );

        const mo = new MutationObserver( update );
        mo.observe( el, { childList: true, subtree: true } );

        let rafId: number | null = null;
        let frames = 0;
        const sample = () => {
            update();
            frames++;
            if ( frames < 120 ) {
                rafId = requestAnimationFrame( sample );
            }
        };
        rafId = requestAnimationFrame( sample );

        return () => {
            ro.disconnect();
            mo.disconnect();
            if ( rafId ) {
                cancelAnimationFrame( rafId );
            }
        };
    }, [] );

    return height;
}

