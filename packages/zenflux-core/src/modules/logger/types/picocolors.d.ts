declare module "picocolors" {
    const pc: {
        ( input: string ): string;
        red( input: string ): string;
        blue( input: string ): string;
        yellow( input: string ): string;
        gray( input: string ): string;
        white( input: string ): string;
        bold( input: string ): string;
    };

    export default pc;
}

