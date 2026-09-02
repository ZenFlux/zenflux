import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import svgr from 'vite-plugin-svgr'

import tailwindcss from 'tailwindcss'
import path from 'path'

// Served from https://inewlegend.com/projects/budget-allocation/ (nginx alias -> /home/ubuntu/projects/budget-allocation).
// Dev keeps '/' so http://localhost:5174 still works.
export default defineConfig( ( { command } ) => ( {
    base: command === 'build' ? '/projects/budget-allocation/' : '/',
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
} ) )
