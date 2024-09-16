import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

import svgr from 'vite-plugin-svgr'

import tailwindcss from 'tailwindcss'

export default defineConfig( {
    base: '/projects/infinigrow/',
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                memo: true,
            }
        }),
        tailwindcss()
    ],
} )
