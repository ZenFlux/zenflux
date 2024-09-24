import "@zenflux/app-shop-catalog/src/components/catalog/catalog.scss";

import CatalogItem from "@zenflux/app-shop-catalog/src/components/catalog-item/catalog-item";

const DEFAULT_MAX_GRID_COLS = 4;

function getGridType( count: number ): string {
    const range = Array.from( { length: DEFAULT_MAX_GRID_COLS },
            ( _, i ) => i + 1 ).reverse();

    let mods = range.map( i => count % i );

    // Remove the first item from the mods array since its default
    const breakpoints = [ "xl", "2lg", "lg" ];

    return breakpoints
            .slice( 0, mods.length )
            .map( ( bp, i ) => `grid-${ bp }-type-${ mods[ i ] }` )
            .join( " " );
}

export default function Catalog() {
    const items = [];

    // Random from 1 to 20
    const count = Math.floor( Math.random() * 20 ) + 1;

    for ( let i = 0 ; i < count ; i++ ) {
        items.push( <CatalogItem key={ i }/> );
    }

    return (
            <div className={ `catalog grid gap-6 ${ getGridType( count ) }` }>
                { items }
            </div>
    );
}

