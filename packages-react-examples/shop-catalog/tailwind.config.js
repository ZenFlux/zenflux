import { nextui } from "@nextui-org/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        // ...
    ],
    theme: {
        extend: {
            screens: {
                '2lg': '1550px',
                'xl': '1700px',
                '2xl': '1800px',
            },
        },
    },
    plugins: [
    ],
    darkMode: "class",
};
