export interface DelayConfig {
    min?: number;
    max?: number;
    fixed?: number;
    enabled?: boolean;
}

export class DelayUtil {
    private static defaultConfig: DelayConfig = {
        min: 1000,
        max: 3000,
    };

    public static async delay( config?: DelayConfig ): Promise<void> {
        if ( config?.enabled === false ) {
            return;
        }

        const delayConfig = { ...this.defaultConfig, ...config };

        let delayMs: number;

        if ( delayConfig.fixed !== undefined ) {
            delayMs = delayConfig.fixed;
        } else {
            const min = delayConfig.min || 1000;
            const max = delayConfig.max || 3000;
            delayMs = Math.floor( Math.random() * ( max - min + 1 ) ) + min;
        }

        return new Promise( resolve => setTimeout( resolve, delayMs ) );
    }

    public static async withDelay<T>(
        operation: () => T | Promise<T>,
        config?: DelayConfig
    ): Promise<T> {
        await this.delay( config );
        return await operation();
    }
}
