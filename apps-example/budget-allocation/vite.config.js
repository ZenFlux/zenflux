import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import svgr from 'vite-plugin-svgr'

import tailwindcss from 'tailwindcss'
import path from 'path'

export default defineConfig( {
    base: '',
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                memo: true,
            }
        }),
        tailwindcss()
    ],
    resolve: {
        alias: {
            '@zenflux/app-budget-allocation/src': path.resolve( __dirname, 'src' ),
            '@zenflux/react-ui/src': path.resolve( __dirname, '../../packages/zenflux-react-ui/src' ),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler'
            }
        }
    },
    server: {
        port: 5174,
    },
} )
