function isCustomElement( tagName: string, props: Record<string, any> ): boolean {
    if ( tagName.indexOf( "-" ) === -1 ) {
        return false;
    }

    switch ( tagName ) {
        // These are reserved SVG and MathML elements.
        // We don't mind this list too much because we expect it to never grow.
        // The alternative is to track the namespace in a few places which is convoluted.
        // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return false;

        default:
            return true;
    }
}

export default isCustomElement;
