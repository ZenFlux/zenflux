// code copied and modified from escape-html

/**
 * Module variables.
 * @private
 */
import { checkHtmlStringCoercion } from "@zenflux/react-shared/src/check-string-coercion";

const matchHtmlRegExp = /["'&<>]/;

/**
 * Escapes special characters and HTML entities in a given html string.
 *
 * @param  {string} string HTML string to escape for later insertion
 * @return {string}
 * @public
 */
function escapeHtml( string: string ) {
    if ( __DEV__ ) {
        checkHtmlStringCoercion( string );
    }

    const str = "" + string;
    const match = matchHtmlRegExp.exec( str );

    if ( ! match ) {
        return str;
    }

    let escape;
    let html = "";
    let index;
    let lastIndex = 0;

    for ( index = match.index ; index < str.length ; index++ ) {
        switch ( str.charCodeAt( index ) ) {
            case 34:
                // "
                escape = "&quot;";
                break;

            case 38:
                // &
                escape = "&amp;";
                break;

            case 39:
                // '
                escape = "&#x27;"; // modified from escape-html; used to be '&#39'

                break;

            case 60:
                // <
                escape = "&lt;";
                break;

            case 62:
                // >
                escape = "&gt;";
                break;

            default:
                continue;
        }

        if ( lastIndex !== index ) {
            html += str.slice( lastIndex, index );
        }

        lastIndex = index + 1;
        html += escape;
    }

    return lastIndex !== index ? html + str.slice( lastIndex, index ) : html;
}

// end code copied and modified from escape-html

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextForBrowser( text: string | number | boolean ): string {
    if ( typeof text === "boolean" || typeof text === "number" ) {
        // this shortcircuit helps perf for types that we know will never have
        // special characters, especially given that this function is used often
        // for numeric dom ids.
        return "" + ( text as any );
    }

    return escapeHtml( text );
}

export default escapeTextForBrowser;
